export interface Track {
  id: string
  title: string
  artist: string
  album: string | null
  albumArt: string | null
  duration: number // seconds
  filePath: string
  fileSize: number
  mimeType: string
  sampleRate: number
  bitRate: number
  addedAt: number // timestamp
  lastPlayedAt: number | null
  playCount: number
  isFavorite: boolean

  // Media Session artwork (optional, generated on import)
  artworkUrl?: string
  artwork96?: string
  artwork128?: string
  artwork256?: string
  artwork512?: string
}

export type TrackSortField = 'title' | 'artist' | 'album' | 'addedAt' | 'lastPlayedAt' | 'playCount'
export type TrackSortOrder = 'asc' | 'desc'
