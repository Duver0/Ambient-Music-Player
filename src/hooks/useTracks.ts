import { useLiveQuery } from 'dexie-react-hooks'
import { getDatabase } from '@/services/storage/database'
import type { Track } from '@/types/track'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseTracksOptions {
  /** Search filter (matches title, artist, album). */
  query?: string
  /** Field to sort by. */
  sortBy?: 'title' | 'artist' | 'album' | 'addedAt' | 'lastPlayedAt' | 'duration'
  /** Sort direction. */
  sortOrder?: 'asc' | 'desc'
  /** Max results. */
  limit?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesQuery(track: Track, lowerQuery: string): boolean {
  return (
    track.title.toLowerCase().includes(lowerQuery) ||
    track.artist.toLowerCase().includes(lowerQuery) ||
    (track.album !== null && track.album.toLowerCase().includes(lowerQuery))
  )
}

function compareValues(aVal: unknown, bVal: unknown): number {
  if (aVal === null) return 1
  if (bVal === null) return -1
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return aVal.localeCompare(bVal)
  }
  return Number(aVal) - Number(bVal)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Reactive tracks list backed by Dexie liveQuery.
 *
 * Automatically re-renders when tracks are added, updated, or removed
 * from IndexedDB. Supports search filtering and sorting.
 *
 * Usage:
 *   const { tracks, isLoading } = useTracks({ query: 'ambient', sortBy: 'title' })
 */
export function useTracks(options: UseTracksOptions = {}): {
  tracks: Track[]
  isLoading: boolean
  error: Error | null
} {
  const { query, sortBy = 'addedAt', sortOrder = 'desc', limit } = options

  const tracks = useLiveQuery(
    async () => {
      const database = await getDatabase()
      let collection = database.tracks.orderBy(sortBy)

      // If searching, filter in-memory after fetching
      if (query && query.trim().length > 0) {
        const lowerQuery = query.toLowerCase().trim()
        const all = await collection.toArray()
        const filtered = all.filter((track) => matchesQuery(track, lowerQuery))

        const sorted = filtered.sort((a, b) => {
          if (sortBy === 'title') return a.title.localeCompare(b.title)
          return compareValues(a[sortBy], b[sortBy])
        })

        return sortOrder === 'desc' ? sorted.reverse() : sorted
      }

      // No search — just order and optionally limit
      const all = await collection.toArray()

      if (sortOrder === 'desc') {
        all.reverse()
      }

      return limit ? all.slice(0, limit) : all
    },
    [query, sortBy, sortOrder, limit],
    [], // Fallback while loading
  )

  const isLoading = tracks === undefined
  const error = null

  return {
    tracks: tracks ?? [],
    isLoading,
    error,
  }
}

/**
 * Get a single track by ID via liveQuery.
 */
export function useTrack(id: string | undefined): {
  track: Track | undefined
  isLoading: boolean
} {
  const track = useLiveQuery(
    async () => {
      if (!id) return undefined
      const database = await getDatabase()
      return database.tracks.get(id)
    },
    [id],
    undefined,
  )

  return {
    track,
    isLoading: track === undefined,
  }
}

/**
 * Get the total count of tracks (reactively).
 */
export function useTrackCount(): number {
  const count = useLiveQuery(async () => {
    const database = await getDatabase()
    return database.tracks.count()
  }, [], 0)
  return count ?? 0
}
