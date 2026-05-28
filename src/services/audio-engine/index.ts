/**
 * Audio Engine — barrel export
 *
 * Usage:
 *   import { AudioEngine, audioContextManager } from '@/services/audio-engine'
 *   import type { IAudioEngine, AudioEngineState, Track } from '@/services/audio-engine'
 */

export { AudioContextManager, audioContextManager } from './AudioContextManager'
export { AudioFocusManager } from './AudioFocusManager'
export { AudioEngine } from './AudioEngine'

export type {
  IAudioEngine,
  AudioEngineState,
  AudioEvent,
  AudioSource,
  InterruptionType,
  AudioError,
  AudioState,
} from './types'
