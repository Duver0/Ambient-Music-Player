import { useFocusTimer } from '@/hooks/useFocusTimer'
import { TimerDisplay } from '@/components/ui/TimerDisplay'
import { TimerControls } from '@/components/ui/TimerControls'
import { Slider } from '@/components/ui/Slider'

/**
 * FocusSession — Focus timer main view (Tier 2 — SMART).
 *
 * Displays the Pomodoro-style timer with ambient mix controls.
 * Connects to focusStore for timer state and actions.
 */
export function FocusSession() {
  const {
    timerRemaining,
    timerMode,
    isTimerRunning,
    isTimerPaused,
    ambientMixLevel,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setAmbientMixLevel,
  } = useFocusTimer()

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleStart = () => startTimer()
  const handlePause = () => pauseTimer()
  const handleResume = () => resumeTimer()
  const handleStop = () => stopTimer()

  const handleAmbientChange = (value: number) => {
    setAmbientMixLevel(value / 100)
  }

  // ── Render ────────────────────────────────────────────────────────────

  const isActive = isTimerRunning || isTimerPaused

  return (
    <div className="flex flex-col h-full">
      {/* Page title for screen readers */}
      <h1 className="sr-only text-heading font-display font-semibold text-text-primary">
        {timerMode === 'focus' ? 'Focus Session' : 'Break'}
      </h1>

      {/* Centered timer area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-sp-8">
        {/* Mode indicator */}
        <div
          className={`px-sp-4 py-sp-1 rounded-full text-caption font-medium tracking-wide ${
            timerMode === 'focus'
              ? 'bg-accent-warm/20 text-accent-warm'
              : 'bg-accent-cool/20 text-accent-cool'
          }`}
        >
          {timerMode === 'focus' ? 'Focus Session' : 'Break'}
        </div>

        {/* Timer Display */}
        <TimerDisplay
          remaining={timerRemaining}
          isRunning={isTimerRunning}
          mode={timerMode}
          size="lg"
        />

        {/* Timer Controls */}
        <TimerControls
          isRunning={isTimerRunning}
          isPaused={isTimerPaused}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
        />
      </div>

      {/* Ambient Mix control (bottom) */}
      <div className="px-sp-6 pb-sp-8">
        <div
          className={`rounded-2xl border p-sp-5 transition-colors ${
            isActive
              ? 'bg-glass-200 backdrop-blur-glass border-glass-300'
              : 'bg-glass-100 border-glass-200'
          }`}
        >
          <div className="flex items-center justify-between mb-sp-3">
            <span className="text-body-sm font-medium text-text-primary">
              Ambient Mix
            </span>
            <span className="text-caption text-text-tertiary tabular-nums">
              {Math.round(ambientMixLevel * 100)}%
            </span>
          </div>
          <Slider
            value={Math.round(ambientMixLevel * 100)}
            min={0}
            max={100}
            step={1}
            size="md"
            onChange={handleAmbientChange}
          />
          <p className="text-caption text-text-tertiary mt-sp-2">
            Blend ambient sounds to mask distractions
          </p>
        </div>
      </div>
    </div>
  )
}

export default FocusSession
