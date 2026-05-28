import { usePlayer } from '@/hooks/usePlayer'
import { useUIStore } from '@/stores/ui-store'
import { AlbumArt } from '@/components/ui/AlbumArt'
import { TransportControls } from '@/components/ui/TransportControls'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { VolumeSlider } from '@/components/ui/VolumeSlider'
import { Header } from '@/components/ui/Header'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayIcon } from '@/components/ui/icons/PlayIcon'

/**
 * Format seconds as MM:SS for the progress bar labels.
 */
function formatProgress(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * NowPlayingScreen — Main player view (Tier 2 — SMART).
 *
 * Shows the currently playing track with album art, progress, transport
 * controls, and volume. Delegates visual rendering to dumb UI components.
 */
export function NowPlayingScreen() {
  const {
    isPlaying,
    currentTrack,
    volume,
    playbackMode,
    currentTime,
    duration,
    pause,
    resume,
    seek,
    next,
    previous,
    setVolume,
    setPlaybackMode,
  } = usePlayer()

  const toggleQueue = useUIStore((s) => s.toggleQueue)

  // ── Empty state ───────────────────────────────────────────────────────

  if (!currentTrack) {
    return (
      <EmptyState
        icon={<PlayIcon size={48} />}
        title="No Track Playing"
        description="Select a track from your library to start listening"
      />
    )
  }

  // ── Derived state ─────────────────────────────────────────────────────

  const progress = duration > 0 ? currentTime / duration : 0
  const repeatMode =
    playbackMode === 'repeat-all'
      ? 'all'
      : playbackMode === 'repeat-one'
        ? 'one'
        : 'off'

  // ── Handlers ──────────────────────────────────────────────────────────

  const handlePlayPause = () => {
    if (isPlaying) pause()
    else if (currentTrack) resume()
  }

  const handleSeek = (value: number) => {
    seek(value * duration)
  }

  const handleShuffleToggle = () => {
    setPlaybackMode(playbackMode === 'shuffle' ? 'normal' : 'shuffle')
  }

  const handleRepeatToggle = () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one']
    const current =
      playbackMode === 'repeat-all'
        ? 'all'
        : playbackMode === 'repeat-one'
          ? 'one'
          : 'off'
    const nextMode = modes[(modes.indexOf(current) + 1) % modes.length]
    setPlaybackMode(
      nextMode === 'off'
        ? 'normal'
        : nextMode === 'all'
          ? 'repeat-all'
          : 'repeat-one',
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header with queue toggle */}
      <Header
        title="Now Playing"
        action={
          <button
            type="button"
            onClick={toggleQueue}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-200 transition-colors"
            aria-label="Toggle queue"
          >
            <span className="text-body-sm font-medium">Queue</span>
          </button>
        }
      />

      {/* Centered player content */}
      <div className="flex-1 flex flex-col items-center justify-center px-sp-8 gap-sp-6">
        {/* Album Art */}
        <AlbumArt
          src={currentTrack.albumArt}
          size="xl"
          isPlaying={isPlaying}
        />

        {/* Track Info */}
        <div className="text-center w-full max-w-sm">
          <h2 className="text-heading-lg font-display font-semibold text-text-primary truncate">
            {currentTrack.title}
          </h2>
          <p className="text-body text-text-secondary truncate mt-sp-1">
            {currentTrack.artist}
          </p>
        </div>

        {/* Progress Bar with time labels */}
        <div className="w-full max-w-sm flex flex-col gap-sp-2">
          <ProgressBar
            progress={progress}
            onSeek={handleSeek}
            height="sm"
          />
          <div className="flex justify-between">
            <span className="text-caption text-text-tertiary tabular-nums">
              {formatProgress(currentTime)}
            </span>
            <span className="text-caption text-text-tertiary tabular-nums">
              {formatProgress(duration)}
            </span>
          </div>
        </div>

        {/* Transport Controls */}
        <TransportControls
          isPlaying={isPlaying}
          isShuffled={playbackMode === 'shuffle'}
          repeatMode={repeatMode}
          onPlayPause={handlePlayPause}
          onNext={next}
          onPrevious={previous}
          onShuffleToggle={handleShuffleToggle}
          onRepeatToggle={handleRepeatToggle}
        />
      </div>

      {/* Volume Slider (bottom) */}
      <div className="px-sp-6 pb-sp-6">
        <VolumeSlider value={volume} onChange={setVolume} />
      </div>
    </div>
  )
}

export default NowPlayingScreen
