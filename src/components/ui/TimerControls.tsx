import { cn } from '@/lib/cn'
import { PlayIcon } from './icons/PlayIcon'
import { PauseIcon } from './icons/PauseIcon'

interface TimerControlsProps {
  isRunning?: boolean
  isPaused?: boolean
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
  className?: string
}

export function TimerControls({
  isRunning = false,
  isPaused = false,
  onStart,
  onPause,
  onResume,
  onStop,
  className,
}: TimerControlsProps) {
  const showStart = !isRunning && !isPaused
  const showResume = isPaused
  const showPause = isRunning && !isPaused

  const handlePrimaryAction = () => {
    if (showStart) onStart?.()
    else if (showResume) onResume?.()
    else if (showPause) onPause?.()
  }

  return (
    <div className={cn('flex items-center justify-center gap-sp-4', className)}>
      {/* Primary action (start / pause / resume) */}
      <button
        type="button"
        onClick={handlePrimaryAction}
        className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full',
          'bg-accent-warm text-ambient-900 hover:brightness-110 active:brightness-90',
          'transition-all duration-150 shadow-glow shadow-accent-warm/30',
          'min-w-[44px] min-h-[44px]',
        )}
        aria-label={
          showStart ? 'Start timer' : showResume ? 'Resume timer' : 'Pause timer'
        }
      >
        {showPause ? (
          <PauseIcon size={28} />
        ) : (
          <PlayIcon size={28} className="ml-1" />
        )}
      </button>

      {/* Stop button (only when running or paused) */}
      {(isRunning || isPaused) && (
        <button
          type="button"
          onClick={onStop}
          className="flex items-center justify-center w-12 h-12 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-200 transition-colors min-w-[44px] min-h-[44px]"
          aria-label="Stop timer"
        >
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            fill="currentColor"
            stroke="none"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default TimerControls
