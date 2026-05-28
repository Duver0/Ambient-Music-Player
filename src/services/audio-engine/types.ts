/**
 * Audio Engine Types
 *
 * Canonical types for the audio engine as defined in the audio-lifecycle spec.
 * All audio-related types used across the app should reference these.
 */

import type { Track } from '@/types/track'

// ---------------------------------------------------------------------------
// Audio Engine State
// ---------------------------------------------------------------------------

/**
 * Audio engine state machine states.
 *
 * - idle:        No AudioContext, no track loaded
 * - loading:     Fetching + decoding audio file
 * - ready:       Track decoded, cached, ready to play
 * - playing:     Source connected, graph active
 * - paused:      Position saved, source stopped
 * - interrupted: Paused by external interruption (phone call, alarm, etc.)
 * - error:       Unrecoverable error occurred
 */
export type AudioEngineState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'interrupted'
  | 'error'

// ---------------------------------------------------------------------------
// Audio Event Types
// ---------------------------------------------------------------------------

/** Events emitted by the audio engine. */
export type AudioEvent =
  | 'stateChange'
  | 'trackEnded'
  | 'trackError'
  | 'timeUpdate'
  | 'interruption'

/** Sources that can request audio focus. */
export type AudioSource = 'player' | 'ambient' | 'timer'

// ---------------------------------------------------------------------------
// Interruption Types
// ---------------------------------------------------------------------------

/** Types of interruptions that can pause/duck audio. */
export type InterruptionType =
  | 'phoneCall'
  | 'alarm'
  | 'otherApp'
  | 'headphoneUnplug'
  | 'bluetoothLost'
  | 'system'

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

/** Structured audio error with recovery context. */
export interface AudioError {
  type:
    | 'CONTEXT_CLOSED'
    | 'CONTEXT_SUSPENDED'
    | 'DECODE_FAILED'
    | 'FILE_NOT_FOUND'
    | 'UNKNOWN'
  message: string
  trackId?: string
  originalError?: unknown
}

// ---------------------------------------------------------------------------
// Audio State Snapshot
// ---------------------------------------------------------------------------

/** Read-only snapshot of the engine state for external consumers. */
export interface AudioState {
  state: AudioEngineState
  currentTrack: Track | null
  currentTime: number
  duration: number
  volume: number
  isInterrupted: boolean
  error: AudioError | null
}

// ---------------------------------------------------------------------------
// IAudioEngine — The public contract
// ---------------------------------------------------------------------------

/**
 * Audio engine interface — the complete public API surface.
 *
 * All audio playback, visualization, effects, and state management
 * goes through this interface. UI components must NOT access the
 * Web Audio API directly.
 */
export interface IAudioEngine {
  // ── Lifecycle ──────────────────────────────────────────────────────────

  /** Initialize event listeners. AudioContext is NOT created here — deferred to first user gesture. */
  init(): Promise<void>

  /** Release all resources, close AudioContext, remove event listeners. */
  destroy(): Promise<void>

  // ── Playback ───────────────────────────────────────────────────────────

  /** Start or resume playback from current position. */
  play(): Promise<void>

  /** Pause playback at current position. */
  pause(): Promise<void>

  /** Resume playback from saved position (after pause or interruption). */
  resume(): Promise<void>

  /** Stop playback and reset position to 0. */
  stop(): Promise<void>

  /** Seek to a specific time in seconds. */
  seek(time: number): Promise<void>

  // ── Track Management ───────────────────────────────────────────────────

  /** Load (fetch + decode) a track into memory cache without playing. */
  loadTrack(track: Track): Promise<void>

  /** Load and immediately start playing a track. */
  playTrack(track: Track): Promise<void>

  /** Advance to the next track in the queue. */
  next(): Promise<void>

  /** Go back to the previous track (or restart current if >3s in). */
  previous(): Promise<void>

  // ── Volume ─────────────────────────────────────────────────────────────

  /** Set master volume (0.0 – 1.0). */
  setVolume(vol: number): void

  /** Get current master volume (0.0 – 1.0). */
  getVolume(): number

  /** Smoothly fade volume to 0 over `duration` milliseconds. */
  fadeOut(duration: number): Promise<void>

  /** Smoothly fade volume from 0 to target over `duration` milliseconds. */
  fadeIn(duration: number): Promise<void>

  // ── State Queries ──────────────────────────────────────────────────────

  /** Get the current engine state. */
  getState(): AudioEngineState

  /** Get the current playback position in seconds. */
  getCurrentTime(): number

  /** Get the duration of the current track in seconds. */
  getDuration(): number

  /**
   * Get frequency analyser data for visualization.
   * Returns a Uint8Array of 128 frequency bins (0-255 each).
   * Call this in a requestAnimationFrame loop from the UI layer.
   */
  getAnalyserData(): Uint8Array

  // ── Event System ───────────────────────────────────────────────────────

  /** Subscribe to an audio engine event. */
  on(event: AudioEvent, handler: Function): void

  /** Unsubscribe from an audio engine event. */
  off(event: AudioEvent, handler: Function): void

  // ── Audio Focus ────────────────────────────────────────────────────────

  /** Request audio focus for a source (e.g., 'player' takes priority over 'ambient'). */
  setAudioFocus(source: AudioSource): void

  /** Release audio focus for a source. */
  releaseAudioFocus(source: AudioSource): void

  // ── Background / Interruptions ─────────────────────────────────────────

  /** Handle page visibility change (app minimized/restored). */
  handleVisibilityChange(visible: boolean): void

  /** Handle an external audio interruption (phone call, alarm, etc.). */
  handleInterruption(type: InterruptionType): void
}
