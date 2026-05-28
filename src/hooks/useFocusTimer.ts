import { useEffect, useRef } from 'react'
import { useFocusStore } from '@/stores/focus-store'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TICK_INTERVAL_MS = 1000

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Focus timer orchestration hook.
 *
 * Manages the `setInterval` that calls `tick()` every second while the
 * timer is running. The store owns the timer state and logic; this hook
 * only handles the interval lifecycle.
 *
 * Usage:
 *   const { timerRemaining, isTimerRunning, startTimer } = useFocusTimer()
 */
export function useFocusTimer() {
  const isTimerRunning = useFocusStore((s) => s.isTimerRunning)
  const isTimerPaused = useFocusStore((s) => s.isTimerPaused)
  const timerRemaining = useFocusStore((s) => s.timerRemaining)
  const timerDuration = useFocusStore((s) => s.timerDuration)
  const timerMode = useFocusStore((s) => s.timerMode)
  const ambientMixLevel = useFocusStore((s) => s.ambientMixLevel)
  const ambientSoundType = useFocusStore((s) => s.ambientSoundType)

  const startTimer = useFocusStore((s) => s.startTimer)
  const pauseTimer = useFocusStore((s) => s.pauseTimer)
  const resumeTimer = useFocusStore((s) => s.resumeTimer)
  const stopTimer = useFocusStore((s) => s.stopTimer)
  const setTimerDuration = useFocusStore((s) => s.setTimerDuration)
  const setAmbientMixLevel = useFocusStore((s) => s.setAmbientMixLevel)
  const setAmbientSoundType = useFocusStore((s) => s.setAmbientSoundType)
  const resetTimer = useFocusStore((s) => s.resetTimer)
  const tick = useFocusStore((s) => s.tick)

  // Interval ref for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const shouldRun = isTimerRunning && !isTimerPaused

    if (shouldRun) {
      intervalRef.current = setInterval(() => {
        useFocusStore.getState().tick()
      }, TICK_INTERVAL_MS)
    } else {
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
  }, [isTimerRunning, isTimerPaused, tick])

  return {
    // State
    timerRemaining,
    timerDuration,
    timerMode,
    isTimerRunning,
    isTimerPaused,
    ambientMixLevel,
    ambientSoundType,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setTimerDuration,
    setAmbientMixLevel,
    setAmbientSoundType,
    resetTimer,
  }
}
