import { cn } from '@/lib/cn'

interface TimerDisplayProps {
  remaining?: number
  isRunning?: boolean
  mode?: 'focus' | 'break'
  size?: 'md' | 'lg'
  className?: string
}

function formatTimer(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const displaySizes = {
  md: 'text-[40px] leading-[48px]',
  lg: 'text-[56px] leading-[64px]',
}

export function TimerDisplay({
  remaining = 0,
  isRunning = false,
  mode = 'focus',
  size = 'lg',
  className,
}: TimerDisplayProps) {
  const accentColor = mode === 'focus' ? 'text-accent-warm' : 'text-accent-cool'

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-sp-2 select-none',
        className,
      )}
    >
      <span
        className={cn(
          'font-numeric font-bold tracking-tight transition-colors duration-300',
          displaySizes[size],
          isRunning ? accentColor : 'text-text-primary',
        )}
      >
        {formatTimer(remaining)}
      </span>
      {isRunning && (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" />
          <span className="text-caption text-text-tertiary uppercase tracking-wider">
            {mode === 'focus' ? 'Focus' : 'Break'}
          </span>
        </div>
      )}
    </div>
  )
}

export default TimerDisplay
