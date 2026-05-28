/**
 * AudioFocusManager
 *
 * Manages multiple audio sources (player, ambient, timer) with individual gain
 * nodes feeding into a shared master gain and analyser.
 *
 * Audio Graph:
 * ```
 *   playerSource → playerGain ─┐
 *   ambientSource → ambientGain ─┼──→ masterGain → analyserNode → destination
 *   timerSource → timerGain   ─┘
 * ```
 *
 * Focus Rules:
 * - Player gain = 1.0 when active
 * - Ambient gain = 0.3 when player active (ducked), 1.0 when solo
 * - Timer alarm ducks player to 0.3, restores after 3s
 * - Master gain = user volume setting (0.0–1.0)
 */

import type { AudioSource } from './types'

/**
 * Default gain values per source.
 */
const GAIN_DEFAULTS: Record<AudioSource, number> = {
  player: 1.0,
  ambient: 0.3,
  timer: 1.0,
}

export class AudioFocusManager {
  private ctx: AudioContext

  /** Per-source gain nodes. External source nodes connect to these. */
  readonly playerGain: GainNode
  readonly ambientGain: GainNode
  readonly timerGain: GainNode

  /** Master volume gain node (controlled by user). */
  readonly masterGain: GainNode

  /** Analyser node for frequency data (read-only from UI). */
  readonly analyserNode: AnalyserNode

  /** Currently active audio sources. */
  private activeSources: Set<AudioSource> = new Set()

  /** Whether player is currently ducked by timer alarm. */
  private isPlayerDucked: boolean = false

  /** Timer handle for restoring player gain after alarm. */
  private duckRestoreTimer: ReturnType<typeof setTimeout> | null = null

  constructor(ctx: AudioContext) {
    this.ctx = ctx

    // Create nodes
    this.playerGain = ctx.createGain()
    this.playerGain.gain.value = GAIN_DEFAULTS.player

    this.ambientGain = ctx.createGain()
    this.ambientGain.gain.value = 0.0 // off by default

    this.timerGain = ctx.createGain()
    this.timerGain.gain.value = 0.0 // off by default

    this.masterGain = ctx.createGain()
    this.masterGain.gain.value = 0.8 // default volume

    this.analyserNode = ctx.createAnalyser()
    this.analyserNode.fftSize = 256

    // Wire the graph: each source gain → masterGain → analyserNode → destination
    this.playerGain.connect(this.masterGain)
    this.ambientGain.connect(this.masterGain)
    this.timerGain.connect(this.masterGain)
    this.masterGain.connect(this.analyserNode)
    this.analyserNode.connect(ctx.destination)
  }

  // ── Source Management ──────────────────────────────────────────────────

  /**
   * Activate an audio source (unmute its gain).
   * Applying focus rules: activating player ducks ambient, activating timer ducks player.
   */
  setActiveSource(source: AudioSource): void {
    this.activeSources.add(source)

    switch (source) {
      case 'player':
        // Player active → duck ambient to background level
        this.rampGain(this.ambientGain, GAIN_DEFAULTS.ambient, 0.05)
        this.playerGain.gain.value = GAIN_DEFAULTS.player
        break

      case 'ambient':
        // Ambient active — if player is also active, stay ducked
        if (!this.activeSources.has('player')) {
          this.rampGain(this.ambientGain, 1.0, 0.05)
        }
        break

      case 'timer':
        // Timer alarm → duck player if active
        this.timerGain.gain.value = GAIN_DEFAULTS.timer
        if (this.activeSources.has('player') && !this.isPlayerDucked) {
          this.duckPlayer()
        }
        break
    }
  }

  /**
   * Deactivate an audio source (mute its gain).
   */
  releaseSource(source: AudioSource): void {
    this.activeSources.delete(source)

    switch (source) {
      case 'player':
        this.playerGain.gain.value = 0.0
        // If ambient is active, give it full gain now
        if (this.activeSources.has('ambient')) {
          this.rampGain(this.ambientGain, 1.0, 0.2)
        }
        break

      case 'ambient':
        this.rampGain(this.ambientGain, 0.0, 0.1)
        break

      case 'timer':
        this.timerGain.gain.value = 0.0
        // Restore player from duck if needed
        if (this.isPlayerDucked) {
          this.restorePlayer()
        }
        break
    }
  }

  /**
   * Check if a source is currently active.
   */
  isSourceActive(source: AudioSource): boolean {
    return this.activeSources.has(source)
  }

  // ── Volume Control ─────────────────────────────────────────────────────

  /**
   * Set master volume (0.0 – 1.0).
   * Uses linear ramp for click-free changes.
   */
  setMasterVolume(value: number): void {
    const clamped = Math.max(0, Math.min(1, value))
    const now = this.ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.linearRampToValueAtTime(clamped, now + 0.02)
  }

  /**
   * Get current master volume.
   */
  getMasterVolume(): number {
    return this.masterGain.gain.value
  }

  // ── Ducking / Focus ────────────────────────────────────────────────────

  /**
   * Duck player gain to 0.3 over 100ms (for timer alarm).
   */
  private duckPlayer(): void {
    this.isPlayerDucked = true
    this.rampGain(this.playerGain, 0.3, 0.1)

    // Auto-restore after 3 seconds
    if (this.duckRestoreTimer !== null) {
      clearTimeout(this.duckRestoreTimer)
    }
    this.duckRestoreTimer = setTimeout(() => {
      this.restorePlayer()
    }, 3000)
  }

  /**
   * Restore player gain to 1.0 over 100ms.
   */
  private restorePlayer(): void {
    if (!this.isPlayerDucked) return
    this.isPlayerDucked = false
    if (this.activeSources.has('player')) {
      this.rampGain(this.playerGain, GAIN_DEFAULTS.player, 0.1)
    }
    if (this.duckRestoreTimer !== null) {
      clearTimeout(this.duckRestoreTimer)
      this.duckRestoreTimer = null
    }
  }

  /**
   * Smoothly ramp a gain node to a target value.
   */
  private rampGain(node: GainNode, target: number, durationSeconds: number): void {
    const now = this.ctx.currentTime
    node.gain.cancelScheduledValues(now)
    node.gain.setValueAtTime(node.gain.value, now)
    node.gain.linearRampToValueAtTime(target, now + durationSeconds)
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  /**
   * Disconnect all nodes and release references.
   */
  dispose(): void {
    if (this.duckRestoreTimer !== null) {
      clearTimeout(this.duckRestoreTimer)
      this.duckRestoreTimer = null
    }

    try {
      this.playerGain.disconnect()
      this.ambientGain.disconnect()
      this.timerGain.disconnect()
      this.masterGain.disconnect()
      this.analyserNode.disconnect()
    } catch {
      // Nodes may already be disconnected
    }

    this.activeSources.clear()
  }

  /**
   * Get frequency analyser data.
   * Returns 128-bin Uint8Array (0-255). Call in RAF loop.
   */
  getAnalyserData(): Uint8Array {
    const data = new Uint8Array(this.analyserNode.frequencyBinCount)
    this.analyserNode.getByteFrequencyData(data)
    return data
  }
}
