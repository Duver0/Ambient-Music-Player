import { NowPlayingScreen } from '@/features/player/components/NowPlayingScreen'

/**
 * PlayerPage — Now Playing screen (default tab).
 *
 * Tier 1 — SMART component (page).
 * Routes to this page render the full player view with album art,
 * transport controls, progress, and volume.
 *
 * The AppShell (layout) provides the bottom navigation — this page
 * only renders the player-specific content.
 */
export default function PlayerPage() {
  return <NowPlayingScreen />
}
