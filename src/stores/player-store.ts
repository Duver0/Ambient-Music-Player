import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AudioEngine } from '@/services/audio-engine'
import type { AudioEngineState } from '@/services/audio-engine'
import type { Track } from '@/types/track'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlaybackMode = 'normal' | 'shuffle' | 'repeat-one' | 'repeat-all'

export interface PlayerState {
  // Data
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  isInterrupted: boolean
  volume: number
  currentTime: number
  duration: number
  playbackMode: PlaybackMode

  // Actions
  play: (track?: Track) => Promise<void>
  pause: () => void
  resume: () => Promise<void>
  stop: () => void
  seek: (time: number) => void
  next: () => Promise<void>
  previous: () => Promise<void>
  setVolume: (volume: number) => void
  setQueue: (tracks: Track[], startIndex?: number) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  setPlaybackMode: (mode: PlaybackMode) => void

  // Internal setters (called from engine event handlers & time polling)
  _setCurrentTime: (time: number) => void
  _setDuration: (duration: number) => void
  _setIsPlaying: (playing: boolean) => void
  _setIsInterrupted: (interrupted: boolean) => void
}

// ---------------------------------------------------------------------------
// AudioEngine singleton & init guard
// ---------------------------------------------------------------------------

const audioEngine = new AudioEngine()
let engineInitialized = false
let engineInitPromise: Promise<void> | null = null

async function ensureEngineInitialized(): Promise<void> {
  if (engineInitialized) return
  if (!engineInitPromise) {
    engineInitPromise = audioEngine.init().then(() => {
      engineInitialized = true
    })
  }
  await engineInitPromise
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      isInterrupted: false,
      volume: 0.8,
      currentTime: 0,
      duration: 0,
      playbackMode: 'normal',

      // ── Playback actions ───────────────────────────────────────────────

      play: async (track) => {
        await ensureEngineInitialized()

        const trackToPlay = track ?? get().currentTrack
        if (!trackToPlay) return

        // Sync persisted volume to engine
        audioEngine.setVolume(get().volume)

        // Optimistic update for responsive UI
        set({
          currentTrack: trackToPlay,
          isPlaying: true,
          isInterrupted: false,
          currentTime: 0,
          duration: trackToPlay.duration,
        })

        try {
          await audioEngine.playTrack(trackToPlay)
        } catch {
          set({ isPlaying: false })
        }
      },

      pause: () => {
        if (!get().isPlaying) return
        audioEngine.pause()
        set({ isPlaying: false })
      },

      resume: async () => {
        if (get().isPlaying || !get().currentTrack) return

        await ensureEngineInitialized()
        audioEngine.setVolume(get().volume)

        try {
          await audioEngine.resume()
          set({ isPlaying: true })
        } catch {
          // Resume failed — stay paused
        }
      },

      stop: () => {
        audioEngine.stop()
        set({
          isPlaying: false,
          currentTime: 0,
          currentTrack: null,
        })
      },

      seek: (time) => {
        const clamped = Math.max(0, Math.min(time, get().duration))
        audioEngine.seek(clamped)
        set({ currentTime: clamped })
      },

      // ── Queue actions ──────────────────────────────────────────────────

      next: async () => {
        const { queue, queueIndex, playbackMode } = get()
        if (queue.length === 0) return

        let nextIndex: number

        switch (playbackMode) {
          case 'repeat-one':
            nextIndex = queueIndex
            break
          case 'shuffle':
            nextIndex = Math.floor(Math.random() * queue.length)
            break
          case 'repeat-all':
            nextIndex = (queueIndex + 1) % queue.length
            break
          case 'normal':
          default:
            nextIndex = queueIndex + 1
            if (nextIndex >= queue.length) {
              // End of queue — stop
              audioEngine.stop()
              set({
                isPlaying: false,
                currentTrack: null,
                currentTime: 0,
              })
              return
            }
            break
        }

        const nextTrack = queue[nextIndex]
        if (!nextTrack) return

        await ensureEngineInitialized()
        audioEngine.setVolume(get().volume)

        set({
          queueIndex: nextIndex,
          currentTrack: nextTrack,
          currentTime: 0,
          duration: nextTrack.duration,
          isPlaying: true,
        })

        try {
          await audioEngine.playTrack(nextTrack)
        } catch {
          set({ isPlaying: false })
        }
      },

      previous: async () => {
        const { queue, queueIndex, currentTime } = get()
        if (queue.length === 0) return

        // If more than 3 seconds in, restart current track
        if (currentTime > 3) {
          audioEngine.seek(0)
          set({ currentTime: 0 })
          return
        }

        const prevIndex = queueIndex - 1
        if (prevIndex < 0) return

        const prevTrack = queue[prevIndex]
        if (!prevTrack) return

        await ensureEngineInitialized()
        audioEngine.setVolume(get().volume)

        set({
          queueIndex: prevIndex,
          currentTrack: prevTrack,
          currentTime: 0,
          duration: prevTrack.duration,
          isPlaying: true,
        })

        try {
          await audioEngine.playTrack(prevTrack)
        } catch {
          set({ isPlaying: false })
        }
      },

      // ── Volume ─────────────────────────────────────────────────────────

      setVolume: (volume) => {
        const clamped = Math.max(0, Math.min(1, volume))
        audioEngine.setVolume(clamped)
        set({ volume: clamped })
      },

      // ── Queue management ───────────────────────────────────────────────

      setQueue: (tracks, startIndex = 0) => {
        const track = tracks[startIndex]
        set({
          queue: tracks,
          queueIndex: startIndex,
          currentTrack: track ?? null,
          currentTime: 0,
          duration: track?.duration ?? 0,
        })
      },

      addToQueue: (track) =>
        set((s) => ({
          queue: [...s.queue, track],
        })),

      removeFromQueue: (index) =>
        set((s) => ({
          queue: s.queue.filter((_, i) => i !== index),
          queueIndex: index < s.queueIndex ? s.queueIndex - 1 : s.queueIndex,
        })),

      clearQueue: () =>
        set({
          queue: [],
          queueIndex: -1,
        }),

      setPlaybackMode: (mode) => set({ playbackMode: mode }),

      // ── Internal setters ───────────────────────────────────────────────

      _setCurrentTime: (time) => set({ currentTime: time }),
      _setDuration: (duration) => set({ duration }),
      _setIsPlaying: (playing) => set({ isPlaying: playing }),
      _setIsInterrupted: (interrupted) => set({ isInterrupted: interrupted }),
    }),
    {
      name: 'ambient-player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        playbackMode: state.playbackMode,
      }),
    },
  ),
)

// ---------------------------------------------------------------------------
// Engine event listeners (module-level, attached once)
// ---------------------------------------------------------------------------

/**
 * Map AudioEngine states to store booleans.
 */
function mapEngineState(newState: AudioEngineState): {
  isPlaying: boolean
  isInterrupted: boolean
} {
  return {
    isPlaying: newState === 'playing',
    isInterrupted: newState === 'interrupted',
  }
}

/** Handle engine `stateChange` event. */
function onEngineStateChange(change: unknown): void {
  const { newState } = change as { prevState: AudioEngineState; newState: AudioEngineState }
  const { isPlaying, isInterrupted } = mapEngineState(newState)
  usePlayerStore.getState()._setIsPlaying(isPlaying)
  usePlayerStore.getState()._setIsInterrupted(isInterrupted)

  // Sync duration when a track starts playing
  if (newState === 'playing' || newState === 'ready') {
    const duration = audioEngine.getDuration()
    if (duration > 0) {
      usePlayerStore.getState()._setDuration(duration)
    }
  }
}

/** Handle engine `trackEnded` event — auto-advance queue. */
function onTrackEnded(): void {
  usePlayerStore.getState().next()
}

/** Handle engine `trackError` event. */
function onTrackError(_error: unknown): void {
  // Track error — the engine has already attempted recovery.
  // The player store's `next()` will be called if the engine signals `trackEnded`.
  // For now, mark as not playing so the UI reflects the error state.
  usePlayerStore.getState()._setIsPlaying(false)
}

// Attach event listeners (runs once at module import time)
audioEngine.on('stateChange', onEngineStateChange)
audioEngine.on('trackEnded', onTrackEnded)
audioEngine.on('trackError', onTrackError)

// ---------------------------------------------------------------------------
// Bootstrap: ensure engine is initialized on first user interaction
// ---------------------------------------------------------------------------

/**
 * Initialize the audio engine. Safe to call multiple times.
 * Called from the app bootstrap (main.tsx or App.tsx).
 */
export async function initPlayerEngine(): Promise<void> {
  await ensureEngineInitialized()

  // Sync persisted volume to engine
  const { volume } = usePlayerStore.getState()
  audioEngine.setVolume(volume)
}
