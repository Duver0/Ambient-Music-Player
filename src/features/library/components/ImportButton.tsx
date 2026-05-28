import { useState, useCallback, useRef } from 'react'
import {
  openFilePicker,
  openFolderPicker,
  importAudioFiles,
  filterAudioFiles,
  type ImportResult,
} from '@/services/import/track-importer'
import { Button } from '@/components/ui/Button'
import { DownloadIcon } from '@/components/ui/icons/DownloadIcon'
import { cn } from '@/lib/cn'

interface ImportButtonProps {
  /** Called after import completes with the result. */
  onImportComplete?: (result: ImportResult) => void
  /** Optional className override. */
  className?: string
  /** Show as a full-width block (for empty state). */
  block?: boolean
  /** Label variant. */
  variant?: 'primary' | 'glass'
  /** Custom label text. */
  label?: string
  /** Import mode: files or folder. */
  mode?: 'files' | 'folder'
}

/**
 * ImportButton — Opens a file/folder picker and imports audio files.
 *
 * - `mode="files"`: opens multi-file picker for individual audio files
 * - `mode="folder"`: opens directory picker (webkitdirectory) on supported browsers
 *
 * Shows loading state during import and calls onImportComplete when done.
 * Handles errors gracefully and reports per-file results.
 */
export function ImportButton({
  onImportComplete,
  className,
  block = false,
  variant = 'primary',
  label,
  mode = 'files',
}: ImportButtonProps) {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Default labels based on mode
  const defaultLabel = mode === 'folder' ? 'Import Folder' : 'Choose Music Files'
  const buttonLabel = label ?? defaultLabel

  const handleImport = useCallback(async () => {
    if (importing) return

    setImporting(true)
    setProgress(mode === 'folder' ? 'Selecting folder...' : 'Selecting files...')
    setResult(null)

    try {
      // Open file or folder picker
      const files = mode === 'folder'
        ? await openFolderPicker()
        : await openFilePicker()

      if (!files || files.length === 0) {
        setImporting(false)
        setProgress(null)
        return
      }

      // For folders, filter to audio files only
      const audioFiles = mode === 'folder' ? filterAudioFiles(files) : Array.from(files)

      if (audioFiles.length === 0) {
        setProgress('No audio files found in this folder')
        setImporting(false)
        setTimeout(() => setProgress(null), 3000)
        return
      }

      setProgress(`Importing ${audioFiles.length} file${audioFiles.length > 1 ? 's' : ''}...`)

      const importResult = await importAudioFiles(audioFiles, (p) => {
        setProgress(`Importing ${p.current} of ${p.total}: ${p.fileName}`)
      })

      // Log how many were skipped (non-audio files)
      const skipped = Array.from(files).length - audioFiles.length
      if (skipped > 0) {
        console.debug(`[Importer] Skipped ${skipped} non-audio files from folder`)
      }

      setResult(importResult)
      onImportComplete?.(importResult)

      if (importResult.errors.length === 0) {
        timerRef.current = setTimeout(() => {
          setProgress(null)
          setImporting(false)
        }, 3000)
      } else {
        setImporting(false)
      }
    } catch (err) {
      setProgress(`Error: ${err instanceof Error ? err.message : 'Import failed'}`)
      setImporting(false)
      timerRef.current = setTimeout(() => {
        setProgress(null)
      }, 5000)
    }
  }, [importing, onImportComplete, mode])

  return (
    <div className={cn('flex flex-col items-center gap-sp-2', className)}>
      <Button
        variant={variant}
        size={block ? 'lg' : 'md'}
        onClick={handleImport}
        disabled={importing}
        className={cn(
          block && 'w-full justify-center',
          'gap-sp-2',
        )}
      >
        <DownloadIcon size={20} className="shrink-0" />
        <span className="truncate hidden min-[420px]:inline">
          {importing ? 'Importing...' : buttonLabel}
        </span>
        <span className="truncate inline min-[420px]:hidden">
          {importing ? '...' : mode === 'folder' ? 'Folder' : 'Add'}
        </span>
      </Button>

      {/* Progress or status message */}
      {progress && (
        <p className="text-caption text-text-secondary text-center animate-fade-in">
          {progress}
        </p>
      )}

      {/* Error details */}
      {result && result.errors.length > 0 && (
        <div className="w-full mt-sp-2">
          <p className="text-caption text-status-error font-medium mb-sp-1">
            Failed to import {result.errors.length} file{result.errors.length > 1 ? 's' : ''}:
          </p>
          <ul className="text-caption text-text-secondary space-y-0.5">
            {result.errors.map((err, i) => (
              <li key={i} className="truncate">
                {err.file}: {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success summary */}
      {result && result.success.length > 0 && !progress && (
        <p className="text-caption text-status-success">
          Added {result.success.length} track{result.success.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

export default ImportButton
