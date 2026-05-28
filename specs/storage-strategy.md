# Storage Strategy

> **Cache invalidation, data persistence, quota management, corruption recovery.**
> Owner: offline-storage-agent | Authority: HIGH | Sharing: pwa-agent

---

## Table of Contents

1. [Storage Architecture](#1-storage-architecture)
2. [Storage Categories](#2-storage-categories)
3. [IndexedDB Schema](#3-indexeddb-schema)
4. [Cache API Strategy](#4-cache-api-strategy)
5. [Cache Invalidation](#5-cache-invalidation)
6. [Quota Management](#6-quota-management)
7. [Storage Cleanup](#7-storage-cleanup)
8. [Corruption Recovery](#8-corruption-recovery)
9. [Versioning Strategy](#9-versioning-strategy)
10. [iOS Specific Storage](#10-ios-specific-storage)
11. [Anti-Patterns](#11-anti-patterns)

---

## 1. Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  APPLICATION LAYER (React/Zustand)                              │
│  ├── Zustand stores (in-memory state)                          │
│  ├── persist middleware (critical settings → localStorage)      │
│  └── Dexie liveQuery hooks (reactive IndexedDB)                │
│                                                                 │
│  SERVICE LAYER (services/storage/)                               │
│  ├── Database class (Dexie singleton)                           │
│  ├── CRUD services (tracks, playlists, settings, sessions)      │
│  ├── AudioCache service (Cache API wrapper)                     │
│  └── StorageManager (quota, cleanup, watchdog)                  │
│                                                                 │
│  PERSISTENCE LAYER                                              │
│  ├── IndexedDB (Dexie)                                          │
│  │   ├── tracks, playlists, settings, sessions                  │
│  │   └── audioCache (optional — Blob storage)                   │
│  ├── Cache API (Service Worker)                                 │
│  │   ├── app shell (precache)                                   │
│  │   └── audio files (runtime cache)                            │
│  └── localStorage                                               │
│       └── critical settings (backup for IndexedDB failures)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Storage Categories

### 2.1 Data Priority Matrix

```yaml
Priority: CRITICAL (must never lose)
  Data: Settings, preferences, current session state
  Storage: localStorage (primary) + IndexedDB (backup)
  Size: < 50KB
  Backup: ✅ Zustand persist middleware writes to both

Priority: HIGH (important but recoverable)
  Data: Playlist metadata, track titles, artists, album art
  Storage: IndexedDB (Dexie)
  Size: < 10MB for 1000 tracks
  Backup: None (manual export option)

Priority: MEDIUM (nice to have)
  Data: Session history, listening stats
  Storage: IndexedDB (Dexie)
  Size: < 5MB for 10000 sessions
  Backup: None

Priority: LOW (purgable)
  Data: Audio files (decoded), album art (full size)
  Storage: Cache API (SW) or IndexedDB Blob
  Size: Variable (budget: 50MB max)
  Backup: Re-download from file system (user must re-import)
```

### 2.2 Storage Decision Matrix

```yaml
Data Type              Storage          Why
──────────────────────────────────────────────────────
Settings/preferences   localStorage     Sync, fast, survives purge
Playlist metadata      IndexedDB        Queryable, indexed, structured
Tracks metadata        IndexedDB        Queryable, indexed, structured
Album art (thumb)      IndexedDB        Fast access, needs query
Album art (full)       Cache API        Large, cache-friendly
Audio files            Cache API        Large, stream-friendly
Session history        IndexedDB        Structured, queryable
Focus stats            IndexedDB        Structured, queryable
Last playback pos      localStorage     Fast, critical on restart
App state (persist)    localStorage     Sync Zustand middleware
```

---

## 3. IndexedDB Schema

### 3.1 Database Schema

```ts
// services/storage/database.ts
class AppDatabase extends Dexie {
  tracks!: Dexie.Table<Track, string>
  playlists!: Dexie.Table<Playlist, string>
  playlistTracks!: Dexie.Table<PlaylistTrack, string>
  settings!: Dexie.Table<AppSetting, string>
  sessions!: Dexie.Table<Session, number>
  artwork!: Dexie.Table<ArtworkCache, string>
  analytics!: Dexie.Table<AnalyticsEvent, number>

  constructor() {
    super('AmbientPlayer')
    
    this.version(1).stores({
      tracks: '&id, title, artist, album, duration, addedAt, lastPlayedAt',
      playlists: '&id, name, &slug, createdAt, updatedAt',
      playlistTracks: '[playlistId+trackId], playlistId, trackId, position',
      settings: '&key',
      sessions: '++id, type, startedAt, endedAt, duration',
      artwork: '&trackId',
      analytics: '++id, event, timestamp',
    })
  }
}
```

### 3.2 Table Definitions

```yaml
tracks:
  Key: id (string — unique, could be file hash)
  Indexes:
    - title (multiEntry for search)
    - artist
    - album
    - addedAt (for sorting by recency)
    - lastPlayedAt (for "recently played")
  Fields:
    id, title, artist, album, duration, filePath,
    fileSize, mimeType, artworkUrl, addedAt, lastPlayedAt,
    playCount, bitrate, sampleRate

playlists:
  Key: id (string — UUID)
  Indexes:
    - name (for sorting)
    - slug (unique, for URLs)
  Fields:
    id, name, slug, description, createdAt, updatedAt,
    trackCount, artworkUrl (first track's art)

playlistTracks:
  Key: [playlistId+trackId] (compound)
  Indexes:
    - playlistId (all tracks in playlist)
    - trackId (all playlists containing track)
    - position (sort order)
  Fields:
    playlistId, trackId, position, addedAt

settings:
  Key: key (string — setting name)
  Fields:
    key, value (JSON), updatedAt

sessions:
  Key: ++id (auto-increment)
  Indexes:
    - type (focus, listening)
    - startedAt (for time-based queries)
    - endedAt
  Fields:
    id, type, startedAt, endedAt, duration,
    focusMode (if applicable), tracksPlayed (array of track IDs)

artwork:
  Key: trackId (string — same as track)
  Fields:
    trackId, thumbnail (Blob), fullsize (Blob),
    thumbnailUrl (ObjectURL), updatedAt
```

### 3.3 Migration Strategy

```yaml
Schema Migration Rules:
  1. NEVER mutate existing schema — always create new version:
     this.version(2).stores({ ...newSchema })
     
  2. Migration functions go between versions:
     this.version(2).stores({ ... }).upgrade(tx => {
       // Transform data from v1 to v2
     })
     
  3. Backward compatible: new code reads old schema
  4. Forward compatible: old code can't read new schema (app must update)
  5. Test migrations with real data before release

  Migration Checklist:
    - [ ] New schema defined in new version()
    - [ ] upgrade() function transforms existing data
    - [ ] Old tables removed when data migrated
    - [ ] Tests verify migration from every schema version
```

---

## 4. Cache API Strategy

### 4.1 Cache Name Convention

```yaml
Cache Naming:
  ambient-precache-v{build}      → App shell (JS, CSS, HTML)
  ambient-audio-v1               → Audio files
  ambient-artwork-v1             → Album artwork
  ambient-static-v1              → Static assets (icons, fonts)

Build version is injected at build time:
  const BUILD_HASH = import.meta.env.VITE_BUILD_HASH
  const PRECACHE = `ambient-precache-${BUILD_HASH}`
```

### 4.2 Cache Strategies by Asset

```yaml
Precache (app shell):
  Strategy: CacheFirst (installed at SW install)
  Files: JS, CSS, HTML, manifest, icons, fonts
  Size: < 1MB total
  TTL: Until next build (versioned by hash)
  
Runtime Cache (audio files):
  Strategy: CacheFirst (after first fetch)
  Pattern: MP3, WAV, OGG, FLAC, M4A
  Limit: 10 files (iOS) / 50 files (Android)
  Max File Size: 30MB per file
  TTL: 30 days since last access
  
Runtime Cache (artwork):
  Strategy: CacheFirst
  Pattern: JPG, PNG, WebP
  Limit: 100 items
  Max File Size: 500KB per image
  TTL: 60 days

Network First (playlist data if online):
  Strategy: NetworkFirst (fallback to cache)
  Note: This app has NO server — data is always local
  Kept for future extensibility

StaleWhileRevalidate (fonts):
  Strategy: StaleWhileRevalidate
  TTL: 90 days (fonts rarely change)
```

### 4.3 vite-plugin-pwa Configuration

```ts
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['fonts/*.woff2', 'icons/*.png'],
  
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /\.(mp3|wav|ogg|flac|m4a)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'ambient-audio-v1',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            purgeOnQuotaError: true,
          },
          rangeRequests: true, // enable seeking in audio
        },
      },
      {
        urlPattern: /\.(jpg|jpeg|png|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'ambient-artwork-v1',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
          },
        },
      },
    ],
  },
  
  manifest: {
    name: 'Ambient Music Player',
    short_name: 'Ambient',
    description: 'Ambient Music Player + Focus Experience',
    theme_color: '#0A0A0A',
    background_color: '#0A0A0A',
    display: 'standalone',
    orientation: 'portrait-primary',
    start_url: '/',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
})
```

---

## 5. Cache Invalidation

### 5.1 Invalidation Triggers

```yaml
Precache Invalidation:
  Trigger: New build (new build hash)
  Detection: SW 'install' event with new precache manifest
  Action: 
    1. New SW installs with new precache
    2. Old SW stays in 'waiting' state
    3. User prompted to update
    4. On update: new SW activates, old caches deleted
    
Audio Cache Invalidation:
  Time-based: 30 days since last access
  Count-based: LRU eviction when maxEntries exceeded
  Manual: User can "Clear cache" in Settings
  Space-based: When quota is low, oldest files deleted first

Artwork Cache Invalidation:
  Time-based: 60 days since creation
  Count-based: LRU eviction when maxEntries exceeded

IndexedDB Cleanup:
  Sessions older than 90 days: archived then deleted
  Playlists marked as deleted: purged after 30 days
  Orphaned tracks (not in any playlist): kept (user may re-add)
```

### 5.2 Cache Cleanup Process

```tsx
// services/storage/StorageManager.ts
class StorageManager {
  async cleanup(): Promise<CleanupReport> {
    const report: CleanupReport = { freed: 0, actions: [] }
    
    // 1. Clean expired audio cache
    const audioCache = await caches.open('ambient-audio-v1')
    const audioRequests = await audioCache.keys()
    const now = Date.now()
    
    for (const request of audioRequests) {
      const response = await audioCache.match(request)
      const dateHeader = response?.headers.get('sw-cache-date')
      if (dateHeader && (now - new Date(dateHeader).getTime()) > 30 * 24 * 60 * 60 * 1000) {
        await audioCache.delete(request)
        report.freed += parseInt(response?.headers.get('content-length') || '0')
        report.actions.push('deleted-expired-audio')
      }
    }
    
    // 2. Clean expired artwork
    // 3. Archive old sessions
    // 4. Compact IndexedDB (if supported)
    
    return report
  }
}
```

---

## 6. Quota Management

### 6.1 Quota Monitoring

```tsx
class QuotaManager {
  async checkQuota(): Promise<QuotaStatus> {
    // iOS: estimate() returns 0 — use write-test instead
    if (!navigator.storage || !navigator.storage.estimate) {
      return this.iOSQuotaCheck()
    }
    
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentUsed = (usage / quota) * 100
    
    return {
      usage,
      quota,
      percentUsed,
      level: percentUsed > 80 ? 'critical' 
           : percentUsed > 60 ? 'warning'
           : 'healthy',
    }
  }
  
  // iOS fallback: write a test blob, check for QuotaExceededError
  private async iOSQuotaCheck(): Promise<QuotaStatus> {
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      // Try writing to IndexedDB or Cache API
      // If it fails with QuotaExceededError, storage is full
      return { status: 'unknown', level: 'healthy' } // optimistic
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        return { status: 'full', level: 'critical' }
      }
      throw e
    }
  }
}
```

### 6.2 Quota Threshold Actions

```yaml
Threshold: < 50% used
  Status: Healthy
  Actions: Normal caching allowed

Threshold: 50–70% used
  Status: Warning
  Actions:
    - Cache new audio but with smaller budget
    - Skip caching full-size artwork (thumbnail only)
    - Subtle notification in Settings

Threshold: 70–85% used
  Status: Elevated
  Actions:
    - Trigger cleanup (delete expired caches)
    - Stop caching new audio files
    - Show warning in UI (Settings badge)
    - Suggest user cleanup

Threshold: > 85% used
  Status: Critical
  Actions:
    - Emergency cleanup (delete LRU audio, full artwork)
    - Block new audio caching
    - Show persistent warning
    - Provide "Free up space" one-tap action

iOS Special Case:
  - No estimate API → assume healthy until write fails
  - On QuotaExceededError → emergency cleanup
  - Keep cache intentionally small (10 audio files max)
```

---

## 7. Storage Cleanup

### 7.1 Cleanup Schedule

```yaml
On App Start (always):
  - Run quick quota check
  - If quota > 70% → trigger cleanup
  
On App Background (Page Visibility):
  - If was playing audio → keep caches
  - If idle for 5 minutes → run maintenance cleanup
  
Weekly (if app used):
  - Full cleanup cycle
  - Archive old sessions
  - Remove orphaned data
  
On QuotaExceededError:
  - IMMEDIATE emergency cleanup
  - Delete: LRU audio, full artwork, old sessions
  - Keep: metadata, settings, playlists
```

### 7.2 Cleanup Priority

```yaml
When freeing space, delete in this order (first = first to go):

1. Analytics events (old, non-essential)
2. Full-size artwork (keep thumbnails)
3. Old sessions (> 90 days)
4. Least recently played audio
5. Audio not in any playlist
6. Deleted playlist data (in trash)
7. Audio not played in 30+ days

NEVER delete:
  - Settings / preferences
  - Playlist metadata
  - Track metadata
  - Current playlist's audio (actively using)
  - Recently played audio (last 5)
```

---

## 8. Corruption Recovery

### 8.1 Corruption Detection

```yaml
Corruption Scenarios:
  1. IndexedDB file corrupt (iOS common)
     - Symptoms: Dexie throws VersionError, DatabaseClosedError
     - Detection: try/around database operations
     
  2. Storage purged (iOS, low memory)
     - Symptoms: Tables exist but are empty
     - Detection: expected track count vs actual
     
  3. Data inconsistency
     - Symptoms: Track references playlist that doesn't exist
     - Detection: cross-table validation
     
  4. Migration failure
     - Symptoms: Schema version mismatch
     - Detection: VersionError on upgrade
```

### 8.2 Recovery Procedures

```yaml
Recovery Level 1 — Soft Recovery:
  When: VersionError during migration
  Action:
    1. Close database
    2. Delete database entirely
    3. Recreate with latest schema
    4. Restore data from backup (if available)
  
Recovery Level 2 — Hard Recovery:
  When: Database is corrupt or purged
  Action:
    1. Delete database
    2. Recreate from scratch
    3. Notify user: "App data was reset"
    4. Offer: Import from backup (future feature)
  
Recovery Level 3 — Full Reset:
  When: Unrecoverable error
  Action:
    1. Delete IndexedDB database
    2. Clear all caches
    3. Clear localStorage backup
    4. Fresh start — show onboarding

Backup Strategy:
  - Critical data (settings) → localStorage
  - Important data (playlists) → JSON export (manual)
  - Future: auto-backup to file system
```

### 8.3 Recovery Implementation

```tsx
async function recoverFromCorruption(error: DexieError): Promise<boolean> {
  console.warn('Storage corruption detected:', error.name)
  
  // Level 1: Delete and recreate
  try {
    await db.delete()
    await db.open()
    
    // Try restoring critical settings
    const savedSettings = localStorage.getItem('ambient-settings-backup')
    if (savedSettings) {
      await db.settings.bulkPut(JSON.parse(savedSettings))
    }
    
    return true // recovered
  } catch (e) {
    // Level 2: Hard reset
    try {
      // Clear everything
      localStorage.clear()
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map(key => caches.delete(key)))
      await db.delete()
      await db.open()
      return true // full reset
    } catch {
      return false // unrecoverable
    }
  }
}
```

---

## 9. Versioning Strategy

### 9.1 Version Sources

```yaml
App Version (package.json):
  Format: semver (1.2.3)
  Storage: localStorage 'app-version'
  Changes: On every build
  
Schema Version (Dexie):
  Format: integer (1, 2, 3...)
  Storage: Dexie manages this internally
  Changes: When schema changes
  
Cache Version (SW):
  Format: build hash
  Storage: Cache name includes version
  Changes: On every build
  
Data Version (migrations):
  Format: integer
  Storage: localStorage 'data-version'  
  Changes: When data format changes
```

### 9.2 Version Checking

```tsx
async function checkVersion() {
  const lastVersion = localStorage.getItem('data-version')
  const currentVersion = APP_DATA_VERSION
  
  if (!lastVersion) {
    // Fresh install
    await initializeFreshDatabase()
  } else if (lastVersion !== currentVersion) {
    // Need migration
    await migrateData(lastVersion, currentVersion)
  }
  
  localStorage.setItem('data-version', currentVersion)
}
```

---

## 10. iOS Specific Storage

### 10.1 iOS Storage Behaviors

```yaml
Critical iOS storage behaviors:
  1. localStorage persists across PWA close/reopen ✅
  2. IndexedDB persists across PWA close/reopen ✅
  3. Cache API persists across PWA close/reopen ✅
  4. ALL storage may be PURGED under memory pressure ⚠️
  5. No notification when storage is purged ⚠️
  6. navigator.storage.estimate() returns incorrect values ⚠️
  7. Storage is shared with Safari (not dedicated to PWA) ⚠️
  8. Clearing Safari data ALSO clears PWA data ⚠️
```

### 10.2 iOS Storage Defenses

```yaml
Defense Strategy:
  1. DUAL WRITE critical data:
     - Write to IndexedDB (primary)
     - Backup to localStorage (sync after every change)
     - On app start: primary available? great. No? recover from backup.
     
  2. STORAGE WATCHDOG:
     - Monitor every write operation for QuotaExceededError
     - Maintain a "last known good" state file in localStorage
     - If writes start failing → trigger emergency cleanup
     
  3. CACHE FIRST for audio:
     - Audio files → Cache API (less likely to be purged than IndexedDB)
     - Metadata → IndexedDB
     - On purged: user sees empty library → can re-import files
     
  4. DATA INTEGRITY CHECK:
     - On start: count tracks in IndexedDB
     - If count is suspiciously low (0 when expected > 0):
       → Check localStorage backup
       → Show "Looks like your data was reset" message
       → Offer to restore from backup
```

---

## 11. Anti-Patterns

```yaml
❌ STORING DERIVED DATA:
  Store: 'totalPlayTime' 
  Problem: Derive from session logs, don't store separately
  ✅: SELECT SUM(duration) FROM sessions

❌ STORING NON-SERIALIZABLE DATA:
  Store: AudioBuffer (decoded audio) in Zustand
  Problem: Large, non-serializable, GC pressure
  ✅: AudioEngine holds decoded buffers, IndexedDB holds source files

❌ MISSING INDEX ON QUERY FIELD:
  Query: db.tracks.where('artist').equals('Moby')
  Problem: Full table scan if 'artist' not indexed
  ✅: Index 'artist' in schema

❌ LARGE PRECACHE (> 1MB):
  Problem: Slow initial install, SW timeout
  ✅: Precache only app shell (< 1MB), cache audio at runtime

❌ NO QUOTA CHECK ON iOS:
  Problem: Write fails silently, user loses data
  ✅: Wrap writes in try/catch, react to QuotaExceededError

❌ STALE CACHES ACCUMULATING:
  Problem: Old caches consume space, never cleaned
  ✅: Delete old caches on SW 'activate' event

❌ RAW INDEXEDDB ACCESS FROM COMPONENTS:
  Problem: Business logic in UI, hard to test
  ✅: Always use Dexie service layer (offline-storage-agent)

❌ HARDCODING STORAGE NAMES:
  Problem: Version conflicts, wrong caches
  ✅: Version all cache names and database names
```

> **Version:** 1.0.0
> **Last Updated:** 2026-05-27
> **Approved by:** offline-storage-agent, pwa-agent
