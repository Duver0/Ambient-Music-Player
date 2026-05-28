import { usePlayer } from '@/hooks/usePlayer'
import { useUIStore } from '@/stores/ui-store'
import { AlbumArt } from '@/components/ui/AlbumArt'
import { PlayIcon } from '@/components/ui/icons/PlayIcon'
import { PauseIcon } from '@/components/ui/icons/PauseIcon'

/**
 * MiniPlayer — Compact player bar displayed at the bottom when navigating
 * away from the player tab while a track is playing (Tier 2 — SMART).
 *
 * Shows album art, track title, artist, and a play/pause button.
 * Tap opens the full player.
 */
export function MiniPlayer() {
  const { currentTrack, isPlaying, play, pause } = usePlayer()
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  if (!currentTrack) return null

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPlaying) pause()
    else play()
  }

  const handleOpenPlayer = () => {
    setActiveTab('player')
  }

  return (
    <div
      className="flex items-center gap-sp-3 px-sp-4 h-16 safe-area-footer bg-glass-200 backdrop-blur-glass border-t border-glass-300 cursor-pointer active:bg-glass-300 transition-colors focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-inset"
      onClick={handleOpenPlayer}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleOpenPlayer()
        }
      }}
    >
      {/* Album Art */}
      <AlbumArt
        src={currentTrack.albumArt}
        size="sm"
        isPlaying={isPlaying}
      />

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-text-primary truncate">
          {currentTrack.title}
        </p>
        <p className="text-caption text-text-secondary truncate">
          {currentTrack.artist}
        </p>
      </div>

      {/* Play/Pause */}
      <button
        type="button"
        onClick={handlePlayPause}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-text-primary hover:bg-glass-300 active:bg-glass-400 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
      </button>
    </div>
  )
}

export default MiniPlayer
