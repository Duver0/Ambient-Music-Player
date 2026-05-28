import { getDatabase } from './database'

// ---------------------------------------------------------------------------
// Data version management
// ---------------------------------------------------------------------------

const DATA_VERSION_KEY = 'ambient-data-version'

/**
 * Current data version for migration tracking.
 * Increment when schema or data format changes.
 * Stored in localStorage, separate from Dexie's internal schema version.
 */
const CURRENT_DATA_VERSION = 2

// ---------------------------------------------------------------------------
// Migration registry
// ---------------------------------------------------------------------------

interface Migration {
  from: number
  to: number
  migrate: () => Promise<void>
}

/**
 * Registry of data migrations.
 * Each migration upgrades data from one version to the next.
 * Migrations run sequentially — never skip versions.
 */
const migrations: Migration[] = [
  // Seed: initial data population for v1 schema
  {
    from: 0,
    to: 1,
    migrate: async () => {
      // Schema v1 is defined in database.ts.
      // No data transformations needed for fresh install.
      // This migration exists so the data-version tracking is consistent.
    },
  },
  // v2: Added trackAudio table for imported audio binary data
  {
    from: 1,
    to: 2,
    migrate: async () => {
      // Dexie handles the schema change (new trackAudio table) automatically.
      // No data transformation needed — the table starts empty.
      // Existing tracks, playlists, and settings are unaffected.
    },
  },
]

// ---------------------------------------------------------------------------
// Migration runner
// ---------------------------------------------------------------------------

/**
 * Run all pending data migrations.
 *
 * Checks localStorage for the last applied data version and runs any
 * migration functions whose `from` version is greater than the stored
 * version. Handles fresh install (no version key) gracefully.
 */
export async function runMigrations(): Promise<void> {
  const lastVersion = getLastDataVersion()

  // Fresh install — nothing to migrate
  if (lastVersion === null) {
    setDataVersion(CURRENT_DATA_VERSION)
    return
  }

  // Already up to date
  if (lastVersion >= CURRENT_DATA_VERSION) return

  // Run migrations in order
  for (const migration of migrations) {
    if (migration.from >= lastVersion && migration.to <= CURRENT_DATA_VERSION) {
      try {
        await migration.migrate()
        setDataVersion(migration.to)
      } catch (error) {
        console.error(`Migration v${migration.from} → v${migration.to} failed:`, error)
        throw error
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the last applied data version from localStorage.
 * Returns `null` for fresh installs (no key present).
 */
function getLastDataVersion(): number | null {
  try {
    const raw = localStorage.getItem(DATA_VERSION_KEY)
    if (raw === null) return null
    const version = Number(raw)
    return Number.isFinite(version) ? version : null
  } catch {
    return null
  }
}

/**
 * Persist the current data version to localStorage.
 */
function setDataVersion(version: number): void {
  try {
    localStorage.setItem(DATA_VERSION_KEY, String(version))
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
    // This is non-critical — migration will re-run on next start.
  }
}

/**
 * Get the current data version constant.
 */
export function getCurrentDataVersion(): number {
  return CURRENT_DATA_VERSION
}

// ---------------------------------------------------------------------------
// Database stats
// ---------------------------------------------------------------------------

/**
 * Get aggregate database statistics for the UI.
 */
export async function getDatabaseStats(): Promise<{
  trackCount: number
  playlistCount: number
  sessionCount: number
  databaseSize: number | null
}> {
  const database = await getDatabase()
  const trackCount = await database.tracks.count()
  const playlistCount = await database.playlists.count()
  const sessionCount = await database.sessions.count()

  let databaseSize: number | null = null
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate()
      databaseSize = estimate.usage ?? null
    } catch {
      // Storage estimate not available
    }
  }

  return {
    trackCount,
    playlistCount,
    sessionCount,
    databaseSize,
  }
}
