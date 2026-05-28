import { useEffect, useRef } from 'react'
import { usePlayerStore, getEngineTime } from '@/stores/player-store'
import type { Track } from '@/types/track'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerAPI {
  // Reactive state (selectors)
  isPlaying: boolean
  currentTrack: Track | null
  volume: number
  playbackMode: 'normal' | 'shuffle' | 'repeat-one' | 'repeat-all'
  currentTime: number
  duration: number
  queue: Track[]
  queueIndex: number

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
  setPlaybackMode: (mode: 'normal' | 'shuffle' | 'repeat-one' | 'repeat-all') => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_UPDATE_INTERVAL_MS = 250

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Player orchestration hook.
 *
 * Combines player store selectors + audio engine interaction.
 * Manages a polling interval to keep `currentTime` in sync with
 * the AudioEngine's actual playback position.
 *
 * Usage (spec §5.3 — Hook Boundaries):
 *   const { isPlaying, currentTrack, play, pause } = usePlayer()
 */
export function usePlayer(): PlayerAPI {
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const volume = usePlayerStore((s) => s.volume)
  const playbackMode = usePlayerStore((s) => s.playbackMode)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const queue = usePlayerStore((s) => s.queue)
  const queueIndex = usePlayerStore((s) => s.queueIndex)

  // Store actions (stable references, no selector needed)
  const play = usePlayerStore((s) => s.play)
  const pause = usePlayerStore((s) => s.pause)
  const resume = usePlayerStore((s) => s.resume)
  const stop = usePlayerStore((s) => s.stop)
  const seek = usePlayerStore((s) => s.seek)
  const next = usePlayerStore((s) => s.next)
  const previous = usePlayerStore((s) => s.previous)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const setQueue = usePlayerStore((s) => s.setQueue)
  const addToQueue = usePlayerStore((s) => s.addToQueue)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const clearQueue = usePlayerStore((s) => s.clearQueue)
  const setPlaybackMode = usePlayerStore((s) => s.setPlaybackMode)
  const _setCurrentTime = usePlayerStore((s) => s._setCurrentTime)

  // Poll currentTime while playing (engine doesn't emit timeUpdate events)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isPlaying) {
      // Start polling — read the real engine position to avoid clock drift
      intervalRef.current = setInterval(() => {
        const store = usePlayerStore.getState()
        store._setCurrentTime(getEngineTime())
      }, TIME_UPDATE_INTERVAL_MS)
    } else {
      // Stop polling
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, _setCurrentTime])

  return {
    // State
    isPlaying,
    currentTrack,
    volume,
    playbackMode,
    currentTime,
    duration,
    queue,
    queueIndex,

    // Actions
    play,
    pause,
    resume,
    stop,
    seek,
    next,
    previous,
    setVolume,
    setQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setPlaybackMode,
  }
}
