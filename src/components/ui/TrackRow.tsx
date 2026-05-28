import type { Track } from '@/types/track'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/utils'
import { PlayIcon } from './icons/PlayIcon'
import { MoreHorizontalIcon } from './icons/MoreHorizontalIcon'
import { AlbumArt } from './AlbumArt'

interface TrackRowProps {
  track: Track
  isActive?: boolean
  onPlay?: () => void
  onAddToQueue?: () => void
  onRemoveFromQueue?: () => void
  showArtwork?: boolean
  className?: string
}

export function TrackRow({
  track,
  isActive = false,
  onPlay,
  showArtwork = true,
  className,
}: TrackRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-sp-3 px-sp-4 py-sp-3 min-h-[48px] rounded-xl transition-colors duration-150',
        'group cursor-pointer hover:bg-glass-100 focus-visible:ring-2 focus-visible:ring-accent-primary',
        isActive && 'bg-glass-100',
        className,
      )}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlay?.()
        }
      }}
    >
      {showArtwork && (
        <AlbumArt
          src={track.albumArt}
          size="sm"
          isPlaying={isActive}
          className="shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-body text-text-primary truncate font-medium',
            isActive && 'text-accent-primary',
          )}
        >
          {track.title}
        </p>
        <p className="text-body-sm text-text-secondary truncate">
          {track.artist}
          {track.album && ` · ${track.album}`}
        </p>
      </div>

      <span className="text-caption text-text-tertiary tabular-nums shrink-0 mr-sp-2">
        {formatTime(track.duration)}
      </span>

      <button
        type="button"
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-xl',
          'text-text-tertiary hover:text-text-primary hover:bg-glass-200',
          'opacity-0 group-hover:opacity-100 transition-all duration-150',
          isActive && 'opacity-100',
        )}
        onClick={(e) => {
          e.stopPropagation()
          onPlay?.()
        }}
        aria-label={`Play ${track.title}`}
      >
        {isActive ? (
          <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-sm" />
          </div>
        ) : (
          <PlayIcon size={20} />
        )}
      </button>

      <button
        type="button"
        className="flex items-center justify-center w-11 h-11 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-glass-200 opacity-0 group-hover:opacity-100 transition-all duration-150"
        onClick={(e) => e.stopPropagation()}
        aria-label="More options"
      >
        <MoreHorizontalIcon size={20} />
      </button>
    </div>
  )
}

export default TrackRow
