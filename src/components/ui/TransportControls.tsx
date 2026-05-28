import { cn } from '@/lib/cn'
import { ShuffleIcon } from './icons/ShuffleIcon'
import { RepeatIcon } from './icons/RepeatIcon'
import { RepeatOneIcon } from './icons/RepeatOneIcon'
import { PreviousIcon } from './icons/PreviousIcon'
import { NextIcon } from './icons/NextIcon'
import { PlayIcon } from './icons/PlayIcon'
import { PauseIcon } from './icons/PauseIcon'

type RepeatMode = 'off' | 'all' | 'one'

interface TransportControlsProps {
  isPlaying?: boolean
  isShuffled?: boolean
  repeatMode?: RepeatMode
  onPlayPause?: () => void
  onNext?: () => void
  onPrevious?: () => void
  onShuffleToggle?: () => void
  onRepeatToggle?: () => void
  className?: string
}

export function TransportControls({
  isPlaying = false,
  isShuffled = false,
  repeatMode = 'off',
  onPlayPause,
  onNext,
  onPrevious,
  onShuffleToggle,
  onRepeatToggle,
  className,
}: TransportControlsProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-sp-2',
        className,
      )}
    >
      {/* Shuffle */}
      <button
        type="button"
        onClick={onShuffleToggle}
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-xl transition-colors',
          isShuffled
            ? 'text-accent-primary'
            : 'text-text-tertiary hover:text-text-secondary hover:bg-glass-200',
        )}
        aria-label="Toggle shuffle"
        aria-pressed={isShuffled}
      >
        <ShuffleIcon size={20} />
      </button>

      {/* Previous */}
      <button
        type="button"
        onClick={onPrevious}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-text-primary hover:bg-glass-200 transition-colors"
        aria-label="Previous track"
      >
        <PreviousIcon size={22} />
      </button>

      {/* Play/Pause (larger) */}
      <button
        type="button"
        onClick={onPlayPause}
        className={cn(
          'flex items-center justify-center w-14 h-14 rounded-full',
          'bg-accent-primary text-white hover:brightness-110 active:brightness-90',
          'transition-all duration-150 shadow-glow',
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} className="ml-0.5" />}
      </button>

      {/* Next */}
      <button
        type="button"
        onClick={onNext}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-text-primary hover:bg-glass-200 transition-colors"
        aria-label="Next track"
      >
        <NextIcon size={22} />
      </button>

      {/* Repeat */}
      <button
        type="button"
        onClick={onRepeatToggle}
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-xl transition-colors',
          repeatMode !== 'off'
            ? 'text-accent-primary'
            : 'text-text-tertiary hover:text-text-secondary hover:bg-glass-200',
        )}
        aria-label="Toggle repeat"
        aria-pressed={repeatMode !== 'off'}
      >
        {repeatMode === 'one' ? (
          <RepeatOneIcon size={20} />
        ) : (
          <RepeatIcon size={20} />
        )}
      </button>
    </div>
  )
}

export default TransportControls
