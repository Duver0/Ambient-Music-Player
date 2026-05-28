import { useState, useCallback } from 'react'
import { useTracks } from '@/hooks/useTracks'
import { usePlayer } from '@/hooks/usePlayer'
import { useUIStore } from '@/stores/ui-store'
import { SearchBar } from '@/components/ui/SearchBar'
import { TrackRow } from '@/components/ui/TrackRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PlaylistIcon } from '@/components/ui/icons/PlaylistIcon'
import { ImportButton } from './ImportButton'
import type { Track } from '@/types/track'
import type { ImportResult } from '@/services/import/track-importer'

type SortField = 'title' | 'artist' | 'addedAt' | 'lastPlayedAt' | 'duration'

const SORT_OPTIONS: { value: SortField; label: string; shortLabel: string }[] = [
  { value: 'title', label: 'Title', shortLabel: 'A–Z' },
  { value: 'artist', label: 'Artist', shortLabel: 'Artist' },
  { value: 'addedAt', label: 'Date Added', shortLabel: 'Added' },
  { value: 'lastPlayedAt', label: 'Last Played', shortLabel: 'Played' },
  { value: 'duration', label: 'Duration', shortLabel: 'Length' },
]

/**
 * PlaylistView — Library main view (Tier 2 — SMART).
 *
 * Displays all tracks with search filtering and sort controls.
 * Delegates track rendering to TrackRow dumb components.
 * Shows ImportButton when no tracks are present.
 */
export function PlaylistView() {
  const [sortBy, setSortBy] = useState<SortField>('addedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [refreshKey, setRefreshKey] = useState(0)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)

  const { tracks, isLoading } = useTracks({
    query: searchQuery,
    sortBy,
    sortOrder,
  })
  const { play, setQueue, currentTrack } = usePlayer()

  // ── Handlers ──────────────────────────────────────────────────────────

  const handlePlayTrack = (track: Track) => {
    const trackIndex = tracks.indexOf(track)
    setQueue(tracks, trackIndex)
    play(track)
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder(field === 'addedAt' || field === 'lastPlayedAt' ? 'desc' : 'asc')
    }
  }

  const handleImportComplete = useCallback((_result: ImportResult) => {
    // Force refresh by incrementing key
    setRefreshKey((k) => k + 1)
  }, [])

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // ── Empty state (no tracks) ───────────────────────────────────────────

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-sp-4 pt-sp-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search tracks..."
          />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-sp-6 gap-sp-6">
          <EmptyState
            icon={<PlaylistIcon size={48} />}
            title={searchQuery ? 'No Results Found' : 'No Tracks Yet'}
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Select audio files from your device to get started'
            }
          />
          {!searchQuery && (
            <div className="flex flex-col sm:flex-row gap-sp-3 w-full max-w-sm">
              <div className="flex-1">
                <ImportButton
                  variant="primary"
                  block
                  label="Choose Files"
                  mode="files"
                  onImportComplete={handleImportComplete}
                />
              </div>
              <div className="flex-1">
                <ImportButton
                  variant="glass"
                  block
                  label="Import Folder"
                  mode="folder"
                  onImportComplete={handleImportComplete}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render (tracks available) ─────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" key={refreshKey}>
      {/* Search Bar */}
      <div className="px-sp-4 pt-sp-4 pb-sp-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search tracks..."
        />
      </div>

      {/* Sort Options + Import button */}
      <div className="flex items-center gap-sp-2 px-sp-4 pb-sp-3 overflow-x-auto">
        {SORT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={sortBy === option.value ? 'primary' : 'glass'}
            size="sm"
            onClick={() => toggleSort(option.value)}
            className="shrink-0"
          >
            <span className="hidden min-[420px]:inline truncate">{option.label}</span>
            <span className="inline min-[420px]:hidden truncate">{option.shortLabel}</span>
            {sortBy === option.value && (
              <span className="shrink-0">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Button>
        ))}
        <div className="ml-auto shrink-0">
          <ImportButton
            variant="glass"
            label="+ Add"
            onImportComplete={handleImportComplete}
          />
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto pb-sp-4">
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isActive={currentTrack?.id === track.id}
            onPlay={() => handlePlayTrack(track)}
            showArtwork
          />
        ))}
      </div>
    </div>
  )
}

export default PlaylistView
