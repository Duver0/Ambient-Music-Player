import type Dexie from 'dexie'
import type { Track } from '@/types/track'

// Lazy Dexie import — deferred until first database access
let DexiePromise: Promise<typeof import('dexie')> | null = null
async function getDexie() {
  if (!DexiePromise) {
    DexiePromise = import('dexie')
  }
  return (await DexiePromise).default
}

// ---------------------------------------------------------------------------
// Storage-specific types
// ---------------------------------------------------------------------------

/** Playlist row in IndexedDB (no `trackIds` — stored in join table). */
export interface DBPlaylist {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: number
  updatedAt: number
  trackCount: number
  artworkUrl: string | null
}

/** Join table linking playlists ↔ tracks. */
export interface DBPlaylistTrack {
  playlistId: string
  trackId: string
  position: number
  addedAt: number
}

/** Key-value setting stored in IndexedDB. */
export interface DBAppSetting {
  key: string
  value: unknown
  updatedAt: number
}

/** A completed focus or listening session. */
export interface DBSession {
  id?: number
  type: 'focus' | 'break' | 'listening'
  startedAt: number
  endedAt: number | null
  duration: number
  focusMode?: 'focus' | 'break'
  tracksPlayed?: string[]
}

/** Cached artwork blobs for a track. */
export interface DBArtworkCache {
  trackId: string
  thumbnail: Blob | null
  fullsize: Blob | null
  updatedAt: number
}

/** Raw audio binary data for an imported track (persisted for offline playback). */
export interface DBTrackAudio {
  trackId: string
  data: ArrayBuffer
  mimeType: string
  importedAt: number
}

/** Analytics / telemetry event. */
export interface DBAnalyticsEvent {
  id?: number
  event: string
  timestamp: number
  data?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Lazy Database Initialization
// ---------------------------------------------------------------------------

/**
 * Ambient Music Player IndexedDB database.
 *
 * Schema defined in storage-strategy.md §3.
 * All IndexedDB access goes through this singleton.
 * Dexie is lazy-loaded on first access to avoid bloating the initial bundle.
 */

// Track types for external consumption
export interface AppDatabase {
  tracks: Dexie.Table<Track, string>
  playlists: Dexie.Table<DBPlaylist, string>
  playlistTracks: Dexie.Table<DBPlaylistTrack, string>
  settings: Dexie.Table<DBAppSetting, string>
  sessions: Dexie.Table<DBSession, number>
  artwork: Dexie.Table<DBArtworkCache, string>
  analytics: Dexie.Table<DBAnalyticsEvent, number>
  trackAudio: Dexie.Table<DBTrackAudio, string>
}

let _db: AppDatabase | null = null
let _initPromise: Promise<AppDatabase> | null = null

/**
 * Get or initialize the database singleton.
 * Dexie is dynamically imported only when this function is first called.
 */
export async function getDatabase(): Promise<AppDatabase> {
  if (_db) return _db
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const DexieClass = await getDexie()
    // Need to use type assertion since we're dynamically creating the class
    const instance = await createDatabase(DexieClass)
    _db = instance
    return instance
  })()

  return _initPromise
}

async function createDatabase(DexieClass: typeof Dexie): Promise<AppDatabase> {
  // Dynamically create a Dexie subclass
  class AmbientDatabase extends DexieClass {
    tracks!: Dexie.Table<Track, string>
    playlists!: Dexie.Table<DBPlaylist, string>
    playlistTracks!: Dexie.Table<DBPlaylistTrack, string>
    settings!: Dexie.Table<DBAppSetting, string>
    sessions!: Dexie.Table<DBSession, number>
    artwork!: Dexie.Table<DBArtworkCache, string>
    analytics!: Dexie.Table<DBAnalyticsEvent, number>
    trackAudio!: Dexie.Table<DBTrackAudio, string>

    constructor() {
      super('AmbientPlayer')

      this.version(2).stores({
        tracks: '&id, title, artist, album, duration, addedAt, lastPlayedAt',
        playlists: '&id, name, &slug, createdAt, updatedAt',
        playlistTracks: '[playlistId+trackId], playlistId, trackId, position',
        settings: '&key',
        sessions: '++id, type, startedAt, endedAt, duration',
        artwork: '&trackId',
        analytics: '++id, event, timestamp',
        trackAudio: '&trackId',
      })
    }
  }

  return new AmbientDatabase() as unknown as AppDatabase
}

/** Convenience singleton for synchronous access (throws if not initialized). */
export function getDbSync(): AppDatabase {
  if (!_db) throw new Error('Database not initialized. Call getDatabase() first.')
  return _db
}

export type Database = AppDatabase
