/**
 * Shared Audio Types
 *
 * These are the canonical audio types for the app.
 * The audio-engine-agent owns the full definition in services/audio-engine/types.ts;
 * this file re-exports those types and maintains backward-compatible aliases.
 */

import type {
  AudioEngineState,
  AudioEvent,
  AudioSource,
  InterruptionType,
  AudioError,
  AudioState,
} from '@/services/audio-engine/types'

// Re-export engine types for cross-app use
export type { AudioEngineState, AudioEvent, AudioSource, InterruptionType, AudioError, AudioState }

// ---------------------------------------------------------------------------
// Backward-compatible aliases
// ---------------------------------------------------------------------------

/** @deprecated Use `AudioEngineState` instead. */
export type AudioPlaybackState = AudioEngineState

// ---------------------------------------------------------------------------
// Audio quality setting
// ---------------------------------------------------------------------------

export type AudioQuality = 'low' | 'medium' | 'high' | 'lossless'

// ---------------------------------------------------------------------------
// Audio engine options
// ---------------------------------------------------------------------------

export interface AudioEngineOptions {
  quality: AudioQuality
  crossfadeDuration: number
  gaplessPlayback: boolean
  equalizerPreset: string | null
}

// ---------------------------------------------------------------------------
// Analyser data
// ---------------------------------------------------------------------------

export interface AudioAnalyserData {
  frequency: Uint8Array
  waveform: Uint8Array
  peak: number
  rms: number
}

// ---------------------------------------------------------------------------
// Crossfade configuration
// ---------------------------------------------------------------------------

export interface CrossfadeConfig {
  duration: number
  type: 'equalPower' | 'linear' | 'logarithmic'
}

// ---------------------------------------------------------------------------
// Legacy engine event (for backward compat with old subscribe pattern)
// ---------------------------------------------------------------------------

export type AudioEngineEvent =
  | { type: 'stateChange'; state: AudioEngineState }
  | { type: 'timeUpdate'; currentTime: number; duration: number }
  | { type: 'trackEnd'; trackId: string }
  | { type: 'error'; message: string; code: number }
  | { type: 'analyserUpdate'; data: AudioAnalyserData }
