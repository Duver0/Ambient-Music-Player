import type { Playlist } from '@/types/playlist'
import { cn } from '@/lib/cn'
import { PlaylistIcon } from './icons/PlaylistIcon'

interface PlaylistCardProps {
  playlist: Playlist
  onSelect?: () => void
  isActive?: boolean
  className?: string
}

export function PlaylistCard({
  playlist,
  onSelect,
  isActive = false,
  className,
}: PlaylistCardProps) {
  const trackCount = playlist.trackIds.length

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-sp-4 p-sp-4 rounded-2xl w-full text-left',
        'transition-all duration-200 select-none',
        'bg-glass-200 hover:bg-glass-300 active:bg-glass-400',
        isActive && 'ring-1 ring-accent-primary bg-glass-300',
        className,
      )}
    >
      {/* Artwork thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-glass-300 flex items-center justify-center">
        {playlist.coverArt ? (
          <img
            src={playlist.coverArt}
            alt={playlist.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <PlaylistIcon className="text-text-tertiary" size={24} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-body font-medium text-text-primary truncate">
          {playlist.name}
        </h3>
        {playlist.description && (
          <p className="text-body-sm text-text-secondary truncate mt-sp-1">
            {playlist.description}
          </p>
        )}
        <p className="text-caption text-text-tertiary mt-sp-1">
          {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
        </p>
      </div>
    </button>
  )
}

export default PlaylistCard
