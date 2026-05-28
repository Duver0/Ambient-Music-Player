import type { Track } from './track'

export interface Playlist {
  id: string
  name: string
  description: string | null
  coverArt: string | null
  trackIds: string[]
  createdAt: number
  updatedAt: number
  isSmartPlaylist: boolean
  smartPlaylistRules: SmartPlaylistRule[] | null
}

export interface SmartPlaylistRule {
  field: 'title' | 'artist' | 'album' | 'genre' | 'addedAt' | 'playCount'
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between'
  value: string | number | [number, number]
}

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[]
}
