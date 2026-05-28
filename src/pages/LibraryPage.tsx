import { PlaylistView } from '@/features/library/components/PlaylistView'

/**
 * LibraryPage — Tracks, playlists, and search.
 *
 * Tier 1 — SMART component (page).
 * Routes to this page render the track library with search
 * filtering, sort controls, and a list of tracks.
 *
 * The AppShell (layout) provides the bottom navigation and
 * mini-player if a track is playing.
 */
export default function LibraryPage() {
  return <PlaylistView />
}
