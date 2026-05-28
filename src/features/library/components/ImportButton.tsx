import { useState, useCallback, useRef } from 'react'
import { openFilePicker, importAudioFiles, type ImportResult } from '@/services/import/track-importer'
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
}

/**
 * ImportButton — Opens a file picker and imports audio files.
 *
 * Shows loading state during import and calls onImportComplete when done.
 * Handles errors gracefully and reports per-file results.
 */
export function ImportButton({
  onImportComplete,
  className,
  block = false,
  variant = 'primary',
  label = 'Import Music',
}: ImportButtonProps) {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleImport = useCallback(async () => {
    if (importing) return

    setImporting(true)
    setProgress('Selecting files...')
    setResult(null)

    try {
      // Open native file picker
      const files = await openFilePicker()
      if (!files || files.length === 0) {
        setImporting(false)
        setProgress(null)
        return
      }

      setProgress(`Importing ${files.length} file${files.length > 1 ? 's' : ''}...`)

      // Import each file
      const importResult = await importAudioFiles(files, (p) => {
        setProgress(`Importing ${p.current} of ${p.total}: ${p.fileName}`)
      })

      setResult(importResult)
      onImportComplete?.(importResult)

      // Clear progress after 3 seconds on success
      if (importResult.errors.length === 0) {
        timerRef.current = setTimeout(() => {
          setProgress(null)
          setImporting(false)
        }, 3000)
      } else {
        // Keep showing result if there were errors
        setImporting(false)
      }
    } catch (err) {
      setProgress(`Error: ${err instanceof Error ? err.message : 'Import failed'}`)
      setImporting(false)

      // Clear error after 5 seconds
      timerRef.current = setTimeout(() => {
        setProgress(null)
      }, 5000)
    }
  }, [importing, onImportComplete])

  return (
    <div className={cn('flex flex-col items-center gap-sp-2', className)}>
      {/* Import button */}
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
        <DownloadIcon size={20} />
        <span>{importing ? 'Importing...' : label}</span>
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
