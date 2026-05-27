# Skill: IndexedDB Patterns (Dexie.js)

> Structured, reactive, performant IndexedDB access patterns.

---

## Purpose

Standardize how Dexie.js is used for IndexedDB access. Ensure schemas are versioned, queries are indexed, and data access is reactive.

## Triggers

Loaded when:
- offline-storage-agent defines database schemas
- frontend-agent needs to consume data

## Rules

1. **Single database instance** — one Dexie instance per app
2. **Schema versioning** — always use versioned schemas:
   ```ts
   class AppDatabase extends Dexie {
     constructor() {
       super('AmbientPlayer')
       this.version(1).stores({
         playlists: '++id, name, &slug',
         tracks: '++id, playlistId, title, artist',
         settings: '&key',
       })
     }
   }
   ```
3. **Primary key patterns**:
   - `++id` — auto-increment
   - `&key` — unique constraint
   - `[compound+key]` — compound primary key
4. **Indexes** — index fields used in WHERE clauses:
   ```ts
   '++id, playlistId, title, *tags'
   // *tags = multi-entry index for arrays
   ```
5. **Reactive queries** — use `liveQuery()` for React integration:
   ```ts
   const playlists = useLiveQuery(() => db.playlists.toArray())
   ```
6. **Batch operations** — use `bulkAdd`, `bulkPut`, `bulkDelete`
7. **Transactions** — use `db.transaction()` for multi-table operations
8. **Migrations** — never mutate schema without version bump

## Schema Design Rules

| Data type | Table | Key | Indexes |
|-----------|-------|-----|---------|
| Playlists | playlists | ++id | name, slug (unique) |
| Tracks | tracks | ++id | playlistId, title, artist |
| Settings | settings | key | (none needed) |
| Sessions | sessions | ++id | startedAt, type |
| Audio cache | audioCache | &url | addedAt |

## Anti-Patterns

- ❌ Multiple Dexie instances (use one singleton)
- ❌ Missing indexes on query fields
- ❌ Storing large files without blob support
- ❌ Mutating schema without migration function
- ❌ Raw IndexedDB API (always use Dexie wrapper)
- ❌ Loading entire tables into memory when pagination suffices
- ❌ Not handling `QuotaExceededError`

## Implementation Notes

- Wrap `liveQuery` in custom hooks for reusability
- Use `useObservable` pattern for real-time updates
- Export typed table types for store integration
- Cache audio files as Blob in dedicated table
- Storage quota: check `navigator.storage.estimate()` periodically
