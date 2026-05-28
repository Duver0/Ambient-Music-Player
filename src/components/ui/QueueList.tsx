import type { Track } from '@/types/track'
import { cn } from '@/lib/cn'
import { TrackRow } from './TrackRow'

interface QueueListProps {
  tracks: Track[]
  currentIndex?: number
  onSelect?: (index: number) => void
  onRemove?: (index: number) => void
  className?: string
}

export function QueueList({
  tracks,
  currentIndex = -1,
  onSelect,
  className,
}: QueueListProps) {
  if (tracks.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {tracks.map((track, index) => (
        <div key={track.id} className="relative group">
          {/* Drag handle indicator */}
          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex flex-col gap-0.5">
              <div className="w-1 h-1 rounded-full bg-text-tertiary" />
              <div className="w-1 h-1 rounded-full bg-text-tertiary" />
              <div className="w-1 h-1 rounded-full bg-text-tertiary" />
            </div>
          </div>

          <div className="pl-4">
            <TrackRow
              track={track}
              isActive={index === currentIndex}
              onPlay={() => onSelect?.(index)}
              showArtwork
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default QueueList
