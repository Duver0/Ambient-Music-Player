/**
 * AudioEngine
 *
 * Complete audio playback engine implementing IAudioEngine.
 * Manages the Web Audio API graph, state machine, playback, caching,
 * interruption handling, Media Session API, and audio focus.
 *
 * Audio Graph:
 *   AudioBufferSourceNode → playerGain → masterGain → analyserNode → destination
 *
 * State Machine (audio-lifecycle spec §2):
 *   IDLE → (init) → CONTEXT_READY → LOADING → READY → PLAYING ↔ PAUSED
 *                                                          ↓
 *                                                    INTERRUPTED → PLAYING
 *                                                          ↓
 *                                                    ENDED → next track
 *                                                          ↓
 *                                                    ERROR → retry/skip
 */

import type { Track } from '@/types/track'
import { audioContextManager } from './AudioContextManager'
import { AudioFocusManager } from './AudioFocusManager'
import type {
  AudioEngineState,
  AudioError,
  AudioEvent,
  AudioSource,
  IAudioEngine,
  InterruptionType,
} from './types'

// ---------------------------------------------------------------------------
// AudioBufferCache — LRU eviction with size budget
// ---------------------------------------------------------------------------

interface CacheEntry {
  buffer: AudioBuffer
  trackId: string
  size: number // estimated bytes in memory
  lastAccessed: number
}

const MAX_CACHE_ENTRIES = 5
const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

function estimateBufferSize(buf: AudioBuffer): number {
  return buf.numberOfChannels * buf.length * 4 // Float32 = 4 bytes per sample
}

class AudioBufferCache {
  private entries: Map<string, CacheEntry> = new Map()
  private currentSize: number = 0

  /**
   * Get a cached buffer, updating last-accessed timestamp.
   */
  get(trackId: string): AudioBuffer | null {
    const entry = this.entries.get(trackId)
    if (!entry) return null
    entry.lastAccessed = Date.now()
    return entry.buffer
  }

  /**
   * Store a decoded buffer. Evicts oldest entries if over budget.
   */
  set(trackId: string, buffer: AudioBuffer): void {
    // If already cached, remove old entry first
    if (this.entries.has(trackId)) {
      this.delete(trackId)
    }

    const size = estimateBufferSize(buffer)
    const entry: CacheEntry = { buffer, trackId, size, lastAccessed: Date.now() }

    // Evict until we have room
    this.evict(size)

    this.entries.set(trackId, entry)
    this.currentSize += size
  }

  /**
   * Remove a specific entry from cache.
   */
  delete(trackId: string): void {
    const entry = this.entries.get(trackId)
    if (!entry) return
    this.entries.delete(trackId)
    this.currentSize -= entry.size
  }

  /**
   * Check if a track is cached.
   */
  has(trackId: string): boolean {
    return this.entries.has(trackId)
  }

  /**
   * Clear all cached buffers.
   */
  clear(): void {
    this.entries.clear()
    this.currentSize = 0
  }

  /**
   * Evict the least-recently-used entries until the required space is available.
   */
  private evict(requiredSize: number): void {
    // If the required size alone exceeds budget, we can't cache this
    if (requiredSize > MAX_CACHE_SIZE_BYTES) return

    // Sort by lastAccessed (oldest first) and evict
    while (
      (this.entries.size >= MAX_CACHE_ENTRIES ||
        this.currentSize + requiredSize > MAX_CACHE_SIZE_BYTES) &&
      this.entries.size > 0
    ) {
      let oldest: CacheEntry | null = null
      for (const entry of this.entries.values()) {
        if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
          oldest = entry
        }
      }
      if (oldest) {
        this.delete(oldest.trackId)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// AudioEventEmitter — typed event system
// ---------------------------------------------------------------------------

type EventHandler = (...args: unknown[]) => void

class AudioEventEmitter {
  private listeners: Map<string, Set<EventHandler>> = new Map()

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event)
    if (!handlers) return
    for (const handler of handlers) {
      try {
        handler(...args)
      } catch {
        // Silently handle listener errors to prevent one bad listener
        // from breaking the entire engine
      }
    }
  }

  removeAll(): void {
    this.listeners.clear()
  }
}

// ---------------------------------------------------------------------------
// AudioEngine
// ---------------------------------------------------------------------------

/**
 * Default crossfade/fade duration in seconds.
 */
const FADE_DURATION_S = 0.05 // 50ms for pause fade
const STOP_FADE_DURATION_S = 0.1 // 100ms for stop fade

/**
 * How far into a track (as ratio 0.0–1.0) before triggering next-track preload.
 */
const PRELOAD_THRESHOLD = 0.7

/**
 * Max time (seconds) to wait for an interruption to end before giving up.
 */
const INTERRUPT_RESUME_TIMEOUT_S = 30

/**
 * Interval for Media Session position state updates (ms).
 */
const MEDIA_SESSION_UPDATE_INTERVAL_MS = 1000

export class AudioEngine implements IAudioEngine {
  // ── Dependencies ───────────────────────────────────────────────────────
  private focusManager: AudioFocusManager | null = null
  private bufferCache: AudioBufferCache = new AudioBufferCache()
  private emitter: AudioEventEmitter = new AudioEventEmitter()

  // ── State ──────────────────────────────────────────────────────────────
  private state: AudioEngineState = 'idle'
  private currentTrack: Track | null = null
  private queue: Track[] = []
  private queueIndex: number = -1
  private _currentTime: number = 0
  private _volume: number = 0.8

  // ── Playback references ────────────────────────────────────────────────
  private activeSource: AudioBufferSourceNode | null = null
  private sourceContextTimeAtStart: number = 0 // ctx.currentTime when source.start() was called
  private sourceTrackOffsetAtStart: number = 0 // track position (seconds) when source started

  // ── Preload ────────────────────────────────────────────────────────────
  private preloadCheckInterval: ReturnType<typeof setInterval> | null = null

  // ── Interruption tracking ──────────────────────────────────────────────
  private wasPlayingBeforeInterrupt: boolean = false
  private interruptResumeTimeout: ReturnType<typeof setTimeout> | null = null

  // ── Event handler references (for cleanup) ─────────────────────────────
  private boundVisibilityHandler: ((event: Event) => void) | null = null
  private boundContextStateHandler: ((state: string) => void) | null = null

  // ── Crossfade ──────────────────────────────────────────────────────────
  private _crossfadeEnabled: boolean = false
  private _crossfadeDuration: number = 3 // seconds

  // ── Media Session ──────────────────────────────────────────────────────
  private mediaSessionSupported: boolean = false
  private positionStateInterval: ReturnType<typeof setInterval> | null = null

  // ── Init flag ──────────────────────────────────────────────────────────
  private _initialized: boolean = false

  constructor() {
    this.mediaSessionSupported = 'mediaSession' in navigator
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Lifecycle
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Initialize the audio engine.
   *
   * IMPORTANT: Does NOT create the AudioContext — that is deferred until
   * the first user gesture (play/playTrack call). This satisfies iOS
   * requirements for AudioContext creation inside a user gesture handler.
   *
   * Sets up:
   *   - Page Visibility listener
   *   - AudioContext state change listener
   */
  async init(): Promise<void> {
    if (this._initialized) return
    this._initialized = true

    // Set up context state change callback (interruption detection)
    this.boundContextStateHandler = this.handleContextStateChange.bind(this)
    audioContextManager.setOnStateChangeCallback(this.boundContextStateHandler)

    // Set up visibility change handler
    this.boundVisibilityHandler = this.handleVisibilityEvent.bind(this)
    document.addEventListener('visibilitychange', this.boundVisibilityHandler)

    this.startPreloadCheck()

    this.setState('idle')
  }

  /**
   * Destroy the audio engine — release all resources.
   */
  async destroy(): Promise<void> {
    this.stopPreloadCheck()
    this.stopPositionStateUpdates()
    this.emitter.removeAll()

    // Remove event listeners
    if (this.boundVisibilityHandler) {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler)
      this.boundVisibilityHandler = null
    }

    // Clean up focus manager
    if (this.focusManager) {
      this.focusManager.dispose()
      this.focusManager = null
    }

    // Stop active source
    this.disconnectSource()

    // Clear cache
    this.bufferCache.clear()

    // Reset state
    this.state = 'idle'
    this.currentTrack = null
    this._currentTime = 0
    this.activeSource = null
    this.queue = []
    this.queueIndex = -1

    // Close AudioContext
    await audioContextManager.close()

    if (this.interruptResumeTimeout !== null) {
      clearTimeout(this.interruptResumeTimeout)
      this.interruptResumeTimeout = null
    }

    this._initialized = false
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Playback
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Start or resume playback.
   *
   * If AudioContext hasn't been created yet (first user gesture), this
   * triggers creation. If paused, resumes from saved position.
   */
  async play(): Promise<void> {
    if (!this.currentTrack) return

    // Ensure AudioContext is ready (creates on first call — user gesture context)
    const ctx = await audioContextManager.getContext()

    // Ensure audio graph is set up
    this.ensureGraph(ctx)

    // Get the decoded buffer
    const buffer = this.bufferCache.get(this.currentTrack.id)
    if (!buffer) {
      await this.loadTrackInternal(this.currentTrack)
    }

    await this.startSource(this._currentTime)
    this.setupMediaSession()
    this.startPositionStateUpdates()
    this.setState('playing')
  }

  /**
   * Pause playback at current position.
   */
  async pause(): Promise<void> {
    if (this.state !== 'playing' && this.state !== 'interrupted') return

    // Save current position
    this._currentTime = this.computeCurrentTime()

    // Fade out
    const gainNode = this.getPlayerGainNode()
    if (gainNode) {
      await this.fadeOutNode(gainNode, FADE_DURATION_S)
    }

    // Stop and disconnect source
    this.disconnectSource()

    this.setState('paused')
  }

  /**
   * Resume playback after pause or interruption.
   */
  async resume(): Promise<void> {
    if (this.state !== 'paused' && this.state !== 'interrupted') return

    // If interrupted, clear the timeout
    if (this.state === 'interrupted') {
      if (this.interruptResumeTimeout !== null) {
        clearTimeout(this.interruptResumeTimeout)
        this.interruptResumeTimeout = null
      }
    }

    if (!this.currentTrack) return

    const ctx = await audioContextManager.getContext()
    this.ensureGraph(ctx)

    // Use saved position
    await this.startSource(this._currentTime)
    this.setupMediaSession()
    this.startPositionStateUpdates()
    this.setState('playing')
  }

  /**
   * Stop playback and reset position to 0.
   */
  async stop(): Promise<void> {
    if (this.activeSource) {
      const gainNode = this.getPlayerGainNode()
      if (gainNode) {
        await this.fadeOutNode(gainNode, STOP_FADE_DURATION_S)
      }
    }

    this.disconnectSource()
    this._currentTime = 0

    // Reset volume ramp if needed
    if (this.focusManager) {
      this.focusManager.setMasterVolume(this._volume)
    }

    this.setState('ready')
  }

  /**
   * Seek to a specific time in seconds.
   */
  async seek(time: number): Promise<void> {
    const duration = this.currentTrack?.duration ?? 0
    const clampedTime = Math.max(0, Math.min(time, duration))

    if (this.state === 'playing') {
      // Stop current source and restart at new position
      this.disconnectSource()
      this._currentTime = clampedTime
      const ctx = await audioContextManager.getContext()
      this.ensureGraph(ctx)
      await this.startSource(clampedTime)
    } else {
      // Just update position — will take effect on next play/resume
      this._currentTime = clampedTime
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Track Management
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Load a track into memory cache without playing.
   */
  async loadTrack(track: Track): Promise<void> {
    await this.loadTrackInternal(track)
    this.setState('ready')
  }

  /**
   * Load and immediately start playing a track.
   * If crossfade is enabled and a track is currently playing (not natural end),
   * performs a fade-out → fade-in transition.
   */
  async playTrack(track: Track): Promise<void> {
    // If crossfade is enabled and we have an active source, do crossfade
    if (this._crossfadeEnabled && this.activeSource && this.state === 'playing') {
      await this.crossfadeToNext(track)
      return
    }

    // Normal (non-crossfade) path
    if (this.activeSource) {
      this.disconnectSource()
    }

    await this.loadTrackInternal(track)

    // Ensure AudioContext is created (user gesture context)
    const ctx = await audioContextManager.getContext()
    this.ensureGraph(ctx)

    this._currentTime = 0
    await this.startSource(0)
    this.setupMediaSession()
    this.startPositionStateUpdates()
    this.setState('playing')
  }

  /**
   * Advance to the next track in the queue.
   */
  async next(): Promise<void> {
    if (this.queue.length === 0) return

    const nextIndex = this.queueIndex + 1
    if (nextIndex >= this.queue.length) {
      // End of queue — stop
      await this.stop()
      return
    }

    this.queueIndex = nextIndex
    const nextTrack = this.queue[nextIndex]
    await this.playTrack(nextTrack)
  }

  /**
   * Go back to the previous track.
   * If >3 seconds into current track, restart current instead.
   */
  async previous(): Promise<void> {
    if (this._currentTime > 3 && this.currentTrack) {
      // Restart current track
      await this.seek(0)
      return
    }

    if (this.queue.length === 0 || this.queueIndex <= 0) {
      // At the beginning — restart current
      await this.seek(0)
      return
    }

    this.queueIndex--
    const prevTrack = this.queue[this.queueIndex]
    await this.playTrack(prevTrack)
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Volume
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Set master volume (0.0 – 1.0).
   */
  setVolume(vol: number): void {
    this._volume = Math.max(0, Math.min(1, vol))
    if (this.focusManager) {
      this.focusManager.setMasterVolume(this._volume)
    }
  }

  /**
   * Get current master volume.
   */
  getVolume(): number {
    return this._volume
  }

  // ── Crossfade Configuration ────────────────────────────────────────────

  /**
   * Enable or disable crossfade between tracks.
   */
  setCrossfadeEnabled(enabled: boolean): void {
    this._crossfadeEnabled = enabled
  }

  /**
   * Whether crossfade is currently enabled.
   */
  getCrossfadeEnabled(): boolean {
    return this._crossfadeEnabled
  }

  /**
   * Set crossfade duration in seconds (clamped 0–30).
   */
  setCrossfadeDuration(duration: number): void {
    this._crossfadeDuration = Math.max(0, Math.min(30, duration))
  }

  /**
   * Get current crossfade duration in seconds.
   */
  getCrossfadeDuration(): number {
    return this._crossfadeDuration
  }

  /**
   * Sync the engine's internal queue index (used for preloading).
   * Called by the player store after it advances the queue.
   */
  setQueueIndex(index: number): void {
    this.queueIndex = index
  }

  /**
   * Smoothly fade volume to 0 over `duration` milliseconds.
   */
  async fadeOut(duration: number): Promise<void> {
    if (!this.focusManager) return
    const gainNode = this.focusManager.masterGain
    const durationSec = Math.max(0.01, duration / 1000)
    await this.fadeOutNode(gainNode, durationSec)
  }

  /**
   * Smoothly fade volume from 0 to target over `duration` milliseconds.
   */
  async fadeIn(duration: number): Promise<void> {
    if (!this.focusManager) return
    const gainNode = this.focusManager.masterGain
    const durationSec = Math.max(0.01, duration / 1000)
    const ctx = gainNode.context
    const now = ctx.currentTime

    gainNode.gain.cancelScheduledValues(now)
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(this._volume, now + durationSec)

    // Wait for fade to complete
    await new Promise((resolve) => setTimeout(resolve, duration))
  }

  // ────────────────────────────────────────────────────────────────────────
  //  State Queries
  // ────────────────────────────────────────────────────────────────────────

  getState(): AudioEngineState {
    return this.state
  }

  getCurrentTime(): number {
    if (this.state === 'playing' && this.activeSource) {
      return this.computeCurrentTime()
    }
    return this._currentTime
  }

  getDuration(): number {
    return this.currentTrack?.duration ?? 0
  }

  /**
   * Get frequency analyser data (128-bin Uint8Array).
   * Call this from a requestAnimationFrame loop in the UI layer.
   */
  getAnalyserData(): Uint8Array {
    if (!this.focusManager) {
      return new Uint8Array(128)
    }
    return this.focusManager.getAnalyserData()
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Event System
  // ────────────────────────────────────────────────────────────────────────

  on(event: AudioEvent, handler: Function): void {
    this.emitter.on(event, handler as (...args: unknown[]) => void)
  }

  off(event: AudioEvent, handler: Function): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void)
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Audio Focus
  // ────────────────────────────────────────────────────────────────────────

  setAudioFocus(source: AudioSource): void {
    if (this.focusManager) {
      this.focusManager.setActiveSource(source)
    }
  }

  releaseAudioFocus(source: AudioSource): void {
    if (this.focusManager) {
      this.focusManager.releaseSource(source)
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Background / Interruptions
  // ────────────────────────────────────────────────────────────────────────

  handleVisibilityChange(_visible: boolean): void {
    // Visibility changes are handled via the DOM event listener set up in init()
    // This method exists for programmatic visibility control if needed.
  }

  handleInterruption(type: InterruptionType): void {
    if (type === 'headphoneUnplug' || type === 'bluetoothLost') {
      // Pause immediately — do NOT auto-resume
      this.handleImmediateInterruption(type)
      return
    }

    // Other interruptions: pause gracefully, mark as interrupted
    this.handleGenericInterruption(type)
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Audio Graph Setup
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Ensure the audio graph (AudioFocusManager) is created and connected.
   */
  private ensureGraph(ctx: AudioContext): void {
    if (this.focusManager) return // already set up

    this.focusManager = new AudioFocusManager(ctx)
    this.focusManager.setMasterVolume(this._volume)
    this.focusManager.setActiveSource('player')
  }

  /**
   * Get the player gain node from the focus manager.
   */
  private getPlayerGainNode(): GainNode | null {
    return this.focusManager?.playerGain ?? null
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Source Management
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Create and start a new AudioBufferSourceNode at the given track offset.
   */
  private async startSource(offset: number): Promise<void> {
    if (!this.currentTrack) return

    const ctx = await audioContextManager.getContext()
    const buffer = this.bufferCache.get(this.currentTrack.id)
    if (!buffer) {
      throw new Error(`Track ${this.currentTrack.id} not decoded in cache`)
    }

    // Disconnect any existing source
    this.disconnectSource()

    // Create new source node
    const source = ctx.createBufferSource()
    source.buffer = buffer

    // Connect to focus manager's player gain
    const playerGain = this.getPlayerGainNode()
    if (playerGain) {
      source.connect(playerGain)
    } else {
      // Fallback: connect directly to destination (shouldn't happen in normal flow)
      source.connect(ctx.destination)
    }

    // Handle track end
    source.onended = () => {
      // Only auto-advance if we're in playing state (not paused/stopped)
      if (this.state === 'playing') {
        this.handleTrackEnd()
      }
    }

    // Start playback
    source.start(0, offset)

    // Track timing
    this.activeSource = source
    this.sourceContextTimeAtStart = ctx.currentTime
    this.sourceTrackOffsetAtStart = offset
  }

  /**
   * Disconnect and clean up the active source node.
   */
  private disconnectSource(): void {
    if (this.activeSource) {
      try {
        this.activeSource.onended = null
        this.activeSource.stop()
      } catch {
        // Source may already have stopped
      }
      try {
        this.activeSource.disconnect()
      } catch {
        // May already be disconnected
      }
      this.activeSource = null
    }
  }

  /**
   * Calculate the current track position based on context time.
   * Works because we track the context time when the source started.
   */
  private computeCurrentTime(): number {
    if (!this.activeSource) return this._currentTime

    const ctx = audioContextManager.getCurrentContext()
    if (!ctx) return this._currentTime

    const elapsed = ctx.currentTime - this.sourceContextTimeAtStart
    return this.sourceTrackOffsetAtStart + Math.max(0, elapsed)
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Track Loading / Decoding
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Internal track loading: fetch, decode, and cache.
   */
  private async loadTrackInternal(track: Track): Promise<void> {
    this.setState('loading')

    try {
      // Check cache first
      const cached = this.bufferCache.get(track.id)
      if (cached) {
        this.currentTrack = track
        return
      }

      // Need to fetch and decode
      const ctx = await audioContextManager.getContext()
      const arrayBuffer = await this.fetchTrackFile(track.filePath)
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      // Cache the decoded buffer
      this.bufferCache.set(track.id, audioBuffer)
      this.currentTrack = track
    } catch (err) {
      this.handleError(err, track.id)
      throw err // Re-throw so callers know loading failed
    }
  }

  /**
   * Fetch a track file from the filesystem path.
   * Supports both direct file:// paths (for local files) and blob URLs.
   */
  private async fetchTrackFile(filePath: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to fetch track: ${response.status} ${response.statusText}`)
      }
      return await response.arrayBuffer()
    } catch (err) {
      const error: AudioError = {
        type: 'FILE_NOT_FOUND',
        message: `Unable to load file: ${filePath}`,
        originalError: err,
      }
      throw error
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Preload Strategy
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Start periodic check for preloading the next track.
   */
  private startPreloadCheck(): void {
    this.stopPreloadCheck()
    this.preloadCheckInterval = setInterval(() => {
      this.checkPreload()
    }, 2000) // Check every 2 seconds
  }

  /**
   * Stop the preload check interval.
   */
  private stopPreloadCheck(): void {
    if (this.preloadCheckInterval !== null) {
      clearInterval(this.preloadCheckInterval)
      this.preloadCheckInterval = null
    }
  }

  /**
   * Check if we should preload the next track.
   * Preloads when current track is 70% through and there's a next track in the queue.
   */
  private checkPreload(): void {
    if (this.state !== 'playing' || !this.currentTrack || this.queue.length === 0) {
      return
    }

    const duration = this.currentTrack.duration
    if (duration <= 0) return

    const progress = this.computeCurrentTime() / duration

    if (progress >= PRELOAD_THRESHOLD) {
      const nextIndex = this.queueIndex + 1
      if (nextIndex < this.queue.length) {
        const nextTrack = this.queue[nextIndex]
        // Only preload if not already cached
        if (!this.bufferCache.has(nextTrack.id)) {
          this.loadTrackInternal(nextTrack).catch(() => {
            // Preload failure is non-critical — will retry on actual play
          })
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Crossfade
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Crossfade from the current track to a new track.
   *
   * Performs a fade-out of the current track over `_crossfadeDuration` seconds,
   * then loads and starts the new track with a fade-in.
   * This sequential approach avoids the complexity of overlapping two sources
   * while still providing a smooth transition.
   */
  private async crossfadeToNext(track: Track): Promise<void> {
    const playerGain = this.getPlayerGainNode()
    const ctx = await audioContextManager.getContext()
    const fadeDuration = this._crossfadeDuration

    // ── Phase 1: Fade out current track ────────────────────────────────
    if (playerGain && this.activeSource) {
      const now = ctx.currentTime
      playerGain.gain.cancelScheduledValues(now)
      playerGain.gain.setValueAtTime(playerGain.gain.value, now)
      playerGain.gain.linearRampToValueAtTime(0, now + fadeDuration)

      // Wait for fade out to complete. The old source is still playing
      // during this time, so the listener hears a smooth fade out.
      await new Promise((resolve) => setTimeout(resolve, fadeDuration * 1000))
    }

    // ── Phase 2: Switch tracks ─────────────────────────────────────────
    this.disconnectSource()
    this._currentTime = 0

    // Load the new track (will fetch + decode + cache if needed)
    await this.loadTrackInternal(track)

    // Ensure graph is set up (may have been torn down)
    this.ensureGraph(ctx)

    // Start the new source
    await this.startSource(0)

    // ── Phase 3: Fade in new track ─────────────────────────────────────
    if (playerGain) {
      const fadeInStart = ctx.currentTime
      playerGain.gain.setValueAtTime(0, fadeInStart)
      playerGain.gain.linearRampToValueAtTime(this._volume, fadeInStart + fadeDuration)
    }

    this.setupMediaSession()
    this.startPositionStateUpdates()
    this.setState('playing')
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Media Session API
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Set up Media Session metadata and action handlers for the current track.
   */
  private setupMediaSession(): void {
    if (!this.mediaSessionSupported || !this.currentTrack) return

    const track = this.currentTrack

    const artwork: MediaImage[] = []
    if (track.artwork512) artwork.push({ src: track.artwork512, sizes: '512x512', type: 'image/png' })
    if (track.artwork256) artwork.push({ src: track.artwork256, sizes: '256x256', type: 'image/png' })
    if (track.artwork128) artwork.push({ src: track.artwork128, sizes: '128x128', type: 'image/png' })
    if (track.artwork96) artwork.push({ src: track.artwork96, sizes: '96x96', type: 'image/png' })

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album ?? '',
      artwork: artwork.length > 0 ? artwork : undefined,
    })

    // Action handlers (set only once, since they reference `this` via closures)
    const setHandlerIfAbsent = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler,
    ): void => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // Action not supported on this platform
      }
    }

    setHandlerIfAbsent('play', () => {
      this.resume().catch(() => {})
    })
    setHandlerIfAbsent('pause', () => {
      this.pause().catch(() => {})
    })
    setHandlerIfAbsent('previoustrack', () => {
      this.previous().catch(() => {})
    })
    setHandlerIfAbsent('nexttrack', () => {
      this.next().catch(() => {})
    })
    setHandlerIfAbsent('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.seek(details.seekTime).catch(() => {})
      }
    })
    setHandlerIfAbsent('stop', () => {
      this.stop().catch(() => {})
    })
  }

  /**
   * Start periodic Media Session position state updates.
   */
  private startPositionStateUpdates(): void {
    this.stopPositionStateUpdates()
    if (!this.mediaSessionSupported) return

    this.positionStateInterval = setInterval(() => {
      if (this.state === 'playing') {
        try {
          navigator.mediaSession.setPositionState({
            duration: this.getDuration(),
            playbackRate: 1,
            position: this.getCurrentTime(),
          })
        } catch {
          // Position state update may fail if session is inactive
        }
      }
    }, MEDIA_SESSION_UPDATE_INTERVAL_MS)
  }

  /**
   * Stop Media Session position state updates.
   */
  private stopPositionStateUpdates(): void {
    if (this.positionStateInterval !== null) {
      clearInterval(this.positionStateInterval)
      this.positionStateInterval = null
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Interruption Handling
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Handle AudioContext state changes for interruption detection.
   * Called by AudioContextManager when the context state changes.
   */
  private handleContextStateChange(contextState: string): void {
    if (contextState === 'suspended' && (this.state === 'playing' || this.state === 'paused')) {
      // Context was suspended — likely an interruption (phone call, etc.)
      this._currentTime = this.computeCurrentTime()
      this.disconnectSource()

      this.wasPlayingBeforeInterrupt = this.state === 'playing'
      this.setState('interrupted')

      this.emitter.emit('interruption', 'system')

      // Set a timeout — if not restored within 30s, assume permanent
      this.interruptResumeTimeout = setTimeout(() => {
        if (this.state === 'interrupted') {
          // Interruption is permanent — stay paused
          if (this.wasPlayingBeforeInterrupt) {
            // Don't auto-resume, but keep the saved position
            this.setState('paused')
          }
          this.wasPlayingBeforeInterrupt = false
        }
      }, INTERRUPT_RESUME_TIMEOUT_S * 1000)
    }

    if (contextState === 'running' && this.state === 'interrupted' && this.wasPlayingBeforeInterrupt) {
      // Interruption ended — auto-resume
      if (this.interruptResumeTimeout !== null) {
        clearTimeout(this.interruptResumeTimeout)
        this.interruptResumeTimeout = null
      }

      this.wasPlayingBeforeInterrupt = false

      // Auto-resume playback
      if (this.currentTrack) {
        this.resume().catch(() => {})
      }
    }
  }

  /**
   * Handle page visibility events (app minimized/restored).
   */
  private handleVisibilityEvent(_event: Event): void {
    const hidden = document.hidden

    if (hidden) {
      // App minimized — save position
      if (this.state === 'playing') {
        this._currentTime = this.computeCurrentTime()
      }
    } else {
      // App restored — check context state
      const ctx = audioContextManager.getCurrentContext()
      if (ctx?.state === 'suspended' && this.state === 'interrupted') {
        // Try to resume context
        ctx.resume().catch(() => {
          // If resume fails, we need a user gesture
        })
      }
      if (ctx?.state === 'closed') {
        // iOS killed the context — will recreate on next play()
      }
    }
  }

  /**
   * Handle immediate interruptions (headphone unplug, Bluetooth lost).
   * Pauses immediately and does NOT auto-resume.
   */
  private handleImmediateInterruption(type: InterruptionType): void {
    if (this.state !== 'playing') return

    this._currentTime = this.computeCurrentTime()
    this.disconnectSource()
    this.setState('interrupted')

    this.emitter.emit('interruption', type)

    // Don't set auto-resume — user must manually resume
    this.wasPlayingBeforeInterrupt = false
  }

  /**
   * Handle generic interruptions (phone call, alarm, etc.).
   * Pauses gracefully, marks as interrupted, sets up auto-resume.
   */
  private handleGenericInterruption(type: InterruptionType): void {
    if (this.state !== 'playing') return

    this._currentTime = this.computeCurrentTime()

    // Fade out quickly
    const playerGain = this.getPlayerGainNode()
    if (playerGain) {
      const now = playerGain.context.currentTime
      playerGain.gain.cancelScheduledValues(now)
      playerGain.gain.setValueAtTime(playerGain.gain.value, now)
      playerGain.gain.linearRampToValueAtTime(0, now + 0.05)
    }

    this.disconnectSource()
    this.wasPlayingBeforeInterrupt = true
    this.setState('interrupted')

    this.emitter.emit('interruption', type)
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Track End Handling
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Handle natural track end — emit event so the store can advance the queue.
   *
   * IMPORTANT: Does NOT call this.next() here. The store listens for 'trackEnded'
   * and calls its own next(), which in turn calls engine.playTrack().
   * Calling this.next() here AND emitting trackEnded would cause a double advance
   * (Bug #4).
   */
  private handleTrackEnd(): void {
    this.disconnectSource()
    this._currentTime = 0
    this.setState('ready')
    this.emitter.emit('trackEnded')
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Error Handling & Recovery
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Handle an error during playback or loading.
   */
  private handleError(err: unknown, trackId?: string): void {
    let audioError: AudioError

    if (this.isAudioError(err)) {
      audioError = { ...err, trackId: trackId ?? err.trackId }
    } else if (err instanceof DOMException && err.name === 'EncodingError') {
      audioError = {
        type: 'DECODE_FAILED',
        message: `Failed to decode audio: ${err.message}`,
        trackId,
        originalError: err,
      }
    } else {
      audioError = {
        type: 'UNKNOWN',
        message: err instanceof Error ? err.message : 'Unknown audio error',
        trackId,
        originalError: err,
      }
    }

    this.setState('error')
    this.emitter.emit('trackError', audioError)

    // Attempt recovery
    this.recoverFromError(audioError)
  }

  /**
   * Attempt to recover from an audio error.
   */
  private async recoverFromError(error: AudioError): Promise<void> {
    switch (error.type) {
      case 'CONTEXT_CLOSED':
      case 'CONTEXT_SUSPENDED': {
        // Recreate context and restore graph
        await audioContextManager.close()
        try {
          const ctx = await audioContextManager.getContext()
          if (this.focusManager) {
            this.focusManager.dispose()
            this.focusManager = null
          }
          this.ensureGraph(ctx)

          // If was playing, resume
          if (this.currentTrack && this.wasPlayingBeforeInterrupt) {
            await this.startSource(this._currentTime)
            this.setState('playing')
          } else {
            this.setState('ready')
          }
        } catch {
          this.setState('idle')
        }
        break
      }

      case 'DECODE_FAILED':
      case 'FILE_NOT_FOUND': {
        // Skip track, try next
        this.disconnectSource()
        this.setState('ready')
        this.emitter.emit('trackEnded')
        this.next().catch(() => {
          this.setState('idle')
        })
        break
      }

      case 'UNKNOWN': {
        // Hard reset
        await audioContextManager.close()
        if (this.focusManager) {
          this.focusManager.dispose()
          this.focusManager = null
        }
        this.disconnectSource()
        this.setState('idle')
        break
      }
    }
  }

  /**
   * Type guard for AudioError objects.
   */
  private isAudioError(err: unknown): err is AudioError {
    return (
      typeof err === 'object' &&
      err !== null &&
      'type' in err &&
      'message' in err &&
      typeof (err as AudioError).type === 'string'
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: Fade Helpers
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Fade a gain node to 0 over the given duration in seconds.
   */
  private fadeOutNode(node: GainNode, durationSec: number): Promise<void> {
    const ctx = node.context
    const now = ctx.currentTime

    node.gain.cancelScheduledValues(now)
    node.gain.setValueAtTime(node.gain.value, now)
    node.gain.linearRampToValueAtTime(0, now + durationSec)

    return new Promise((resolve) => setTimeout(resolve, durationSec * 1000))
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Private: State Machine
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Transition to a new state and emit the stateChange event.
   */
  private setState(newState: AudioEngineState): void {
    if (this.state === newState) return
    const prevState = this.state
    this.state = newState
    this.emitter.emit('stateChange', { prevState, newState })
  }

  /**
   * Set the playback queue.
   */
  setQueue(tracks: Track[], startIndex: number = 0): void {
    this.queue = [...tracks]
    this.queueIndex = startIndex
    if (tracks[startIndex]) {
      this.currentTrack = tracks[startIndex]
    }
  }
}
