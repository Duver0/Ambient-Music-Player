import { usePlayer } from '@/hooks/usePlayer'
import { useUIStore } from '@/stores/ui-store'
import { QueueList } from '@/components/ui/QueueList'
import { CloseIcon } from '@/components/ui/icons/CloseIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlaylistIcon } from '@/components/ui/icons/PlaylistIcon'

/**
 * QueueView — Queue bottom sheet content (Tier 2 — SMART).
 *
 * Shows the current playback queue with the ability to select tracks.
 * Designed to be rendered inside a bottom sheet or modal overlay.
 */
export function QueueView() {
  const { queue, queueIndex, play } = usePlayer()
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet)

  const handleSelect = (index: number) => {
    play(queue[index])
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-sp-6 py-sp-4">
          <h2 className="text-heading font-display font-semibold text-text-primary">
            Queue
          </h2>
          <button
            type="button"
            onClick={closeBottomSheet}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-200 transition-colors"
            aria-label="Close queue"
          >
            <CloseIcon size={22} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<PlaylistIcon size={40} />}
            title="Queue is Empty"
            description="Add tracks from your library to build a queue"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-sp-6 py-sp-4">
        <h2 className="text-heading font-display font-semibold text-text-primary">
          Queue
        </h2>
        <button
          type="button"
          onClick={closeBottomSheet}
          className="flex items-center justify-center w-11 h-11 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-200 transition-colors"
          aria-label="Close queue"
        >
          <CloseIcon size={22} />
        </button>
      </div>

      {/* "Now Playing" section header */}
      <div className="px-sp-6 pb-sp-2">
        <p className="text-caption text-text-tertiary uppercase tracking-wider">
          Up Next
        </p>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto px-sp-4 pb-sp-4">
        <QueueList
          tracks={queue}
          currentIndex={queueIndex}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}

export default QueueView
