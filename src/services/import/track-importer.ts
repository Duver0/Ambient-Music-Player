/**
 * TrackImporter — Import audio files into the app.
 *
 * Handles:
 *   - File selection via <input type="file">
 *   - Metadata extraction (title from filename, duration via AudioContext)
 *   - Storage of audio binary data in IndexedDB (trackAudio table)
 *   - Track metadata in Dexie (tracks table)
 *   - Blob URL creation for playback
 *   - Restoration of blob URLs on app reload
 */

import { getDatabase, type DBTrackAudio } from '@/services/storage/database'
import type { Track } from '@/types/track'
import { nanoid } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportResult {
  success: Track[]
  errors: { file: string; error: string }[]
}

export interface ImportProgress {
  current: number
  total: number
  fileName: string
}

type ProgressCallback = (progress: ImportProgress) => void

// ---------------------------------------------------------------------------
// Blob URL registry — maps trackId → blob URL for playback
// ---------------------------------------------------------------------------

const blobUrlRegistry = new Map<string, string>()

/**
 * Get the playback URL for a track.
 * If the track has imported audio data, returns the stored blob URL.
 * Otherwise returns the original filePath.
 */
export function getTrackPlaybackUrl(track: Track): string {
  const blobUrl = blobUrlRegistry.get(track.id)
  return blobUrl ?? track.filePath
}

/**
 * Create a blob URL from audio data and register it.
 */
function registerBlobUrl(trackId: string, data: ArrayBuffer, mimeType: string): string {
  // Revoke existing URL if any
  const existing = blobUrlRegistry.get(trackId)
  if (existing) {
    URL.revokeObjectURL(existing)
  }

  const blob = new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  blobUrlRegistry.set(trackId, url)
  return url
}

/**
 * Revoke all blob URLs (call on app cleanup if needed).
 */
export function revokeAllBlobUrls(): void {
  for (const url of blobUrlRegistry.values()) {
    URL.revokeObjectURL(url)
  }
  blobUrlRegistry.clear()
}

// ---------------------------------------------------------------------------
// Metadata extraction
// ---------------------------------------------------------------------------

/**
 * Extract a display title from a filename:
 *   - Removes file extension
 *   - Replaces underscores/hyphens with spaces
 *   - Trims and capitalizes
 */
function titleFromFilename(filename: string): string {
  // Remove extension
  const noExt = filename.replace(/\.[^/.]+$/, '')
  // Replace separators with spaces
  const withSpaces = noExt.replace(/[_-]/g, ' ')
  // Trim and return
  return withSpaces.trim() || 'Unknown Track'
}

/**
 * Attempt to extract artist from filename patterns like "Artist - Title.mp3".
 * Returns null if no pattern matches.
 */
function artistFromFilename(filename: string): string | null {
  const noExt = filename.replace(/\.[^/.]+$/, '')
  // Pattern: "Artist - Title" or "Artist – Title"
  const match = noExt.match(/^(.+?)\s*[–-]\s*(.+)$/)
  if (match) {
    return match[1].trim()
  }
  return null
}

/**
 * Guess MIME type from file extension.
 */
function mimeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    wma: 'audio/x-ms-wma',
    webm: 'audio/webm',
  }
  return mimeMap[ext ?? ''] ?? 'audio/mpeg'
}

// ---------------------------------------------------------------------------
// Duration extraction via AudioContext
// ---------------------------------------------------------------------------

/**
 * Decode audio data and return duration in seconds.
 * Uses a temporary OfflineAudioContext for decoding without playback.
 */
async function extractDuration(arrayBuffer: ArrayBuffer): Promise<number> {
  try {
    // Create a temporary AudioContext just for decoding
    const audioCtx = new AudioContext()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
    const duration = audioBuffer.duration
    await audioCtx.close()
    return duration
  } catch {
    // If we can't decode (e.g., format not supported), return 0
    return 0
  }
}

// ---------------------------------------------------------------------------
// File reading
// ---------------------------------------------------------------------------

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsArrayBuffer(file)
  })
}

// ---------------------------------------------------------------------------
// Import logic
// ---------------------------------------------------------------------------

/**
 * Import a single file: read, decode metadata, store in DB.
 */
async function importFile(
  file: File,
  index: number,
  onProgress?: ProgressCallback,
): Promise<Track> {
  onProgress?.({ current: index, total: index, fileName: file.name })

  // Read file data
  const arrayBuffer = await readFileAsArrayBuffer(file)

  // Extract metadata
  const title = titleFromFilename(file.name)
  const artist = artistFromFilename(file.name) ?? 'Unknown Artist'
  const mimeType = mimeFromExtension(file.name)

  onProgress?.({ current: index, total: index, fileName: `Decoding ${file.name}...` })

  // Decode to get duration
  const duration = await extractDuration(arrayBuffer)

  // Generate a unique ID
  const trackId = `imported-${nanoid(10)}`

  // Create blob URL for immediate playback
  const blobUrl = registerBlobUrl(trackId, arrayBuffer, mimeType)

  // Build track metadata
  const now = Date.now()
  const track: Track = {
    id: trackId,
    title,
    artist,
    album: null,
    albumArt: null,
    duration: Math.round(duration),
    filePath: blobUrl,
    fileSize: file.size,
    mimeType,
    sampleRate: 44100, // Will be updated if decoded
    bitRate: 0,
    addedAt: now,
    lastPlayedAt: null,
    playCount: 0,
    isFavorite: false,
  }

  // Store in Dexie
  const database = await getDatabase()
  await database.tracks.add(track)

  // Store audio binary data for persistence across page reloads
  const trackAudioData: DBTrackAudio = {
    trackId,
    data: arrayBuffer,
    mimeType,
    importedAt: now,
  }
  await database.trackAudio.add(trackAudioData)

  return track
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Import audio files into the app.
 *
 * Usage:
 *   ```ts
 *   const result = await importAudioFiles(fileList, (p) => setProgress(p))
 *   ```
 *
 * Returns imported tracks and any errors per file.
 */
export async function importAudioFiles(
  files: FileList | File[],
  onProgress?: ProgressCallback,
): Promise<ImportResult> {
  const fileArray = Array.from(files)
  const result: ImportResult = { success: [], errors: [] }

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i]
    try {
      const track = await importFile(file, i + 1, onProgress)
      result.success.push(track)
    } catch (err) {
      result.errors.push({
        file: file.name,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return result
}

/**
 * Open a native file picker and import selected audio files.
 *
 * Uses extension-based accept (no MIME wildcard) to avoid issues
 * with single-file restriction on iOS/mobile browsers.
 * Detects cancel via window focus event.
 *
 * Usage:
 *   ```ts
 *   const result = await openFilePicker((p) => setProgress(p))
 *   ```
 */
export function openFilePicker(): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    // Use only extensions (no audio/* MIME wildcard) to avoid
    // single-file restriction on iOS and some mobile browsers
    input.accept = '.mp3,.wav,.ogg,.flac,.m4a,.aac,.wma,.webm'
    input.multiple = true

    let resolved = false

    // When files are selected (works with multi-select on all browsers)
    input.addEventListener('change', () => {
      if (resolved) return
      resolved = true
      window.removeEventListener('focus', onFocus)
      resolve(input.files)
    })

    // Detect cancellation: when the window regains focus after
    // the file dialog closes without selecting files
    const onFocus = () => {
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          window.removeEventListener('focus', onFocus)
          resolve(null)
        }
      }, 300)
    }
    window.addEventListener('focus', onFocus)

    input.click()
  })
}

// ---------------------------------------------------------------------------
// Restoration on app start
// ---------------------------------------------------------------------------

/**
 * Restore blob URLs from stored audio data on app start.
 * Call this once when the app initializes (e.g., in a provider or layout).
 */
export async function restoreImportedAudio(): Promise<void> {
  try {
    const database = await getDatabase()
    const allAudio = await database.trackAudio.toArray()

    for (const entry of allAudio) {
      const url = registerBlobUrl(entry.trackId, entry.data, entry.mimeType)

      // Update the track's filePath to the new blob URL
      const track = await database.tracks.get(entry.trackId)
      if (track) {
        await database.tracks.update(entry.trackId, { filePath: url })
      }
    }

    if (allAudio.length > 0) {
      console.debug(`[Importer] Restored ${allAudio.length} imported tracks`)
    }
  } catch (err) {
    console.error('[Importer] Failed to restore imported audio:', err)
  }
}

/**
 * Delete an imported track and its audio data.
 */
export async function deleteImportedTrack(trackId: string): Promise<void> {
  // Revoke blob URL
  const url = blobUrlRegistry.get(trackId)
  if (url) {
    URL.revokeObjectURL(url)
    blobUrlRegistry.delete(trackId)
  }

  // Remove from Dexie
  const database = await getDatabase()
  await database.tracks.delete(trackId)
  await database.trackAudio.delete(trackId)
}

/**
 * Get total storage usage of imported audio in bytes.
 */
export async function getImportedAudioSize(): Promise<number> {
  const database = await getDatabase()
  const allAudio = await database.trackAudio.toArray()
  return allAudio.reduce((total, entry) => total + entry.data.byteLength, 0)
}
