import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActiveTab = 'library' | 'player' | 'focus' | 'settings'

export interface UIState {
  // Data
  activeTab: ActiveTab
  isFullscreen: boolean
  isQueueOpen: boolean
  isSearchOpen: boolean
  searchQuery: string
  showMiniPlayer: boolean
  isBottomSheetOpen: boolean
  bottomSheetContent: string | null

  // Actions
  setActiveTab: (tab: ActiveTab) => void
  setFullscreen: (fullscreen: boolean) => void
  toggleQueue: () => void
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setShowMiniPlayer: (show: boolean) => void
  openBottomSheet: (content: string) => void
  closeBottomSheet: () => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * UI state store.
 *
 * Ephemeral UI state — NO persist middleware.
 * `activeTab` is synced with URL search params via TanStack Router
 * (handled by the frontend-agent in feature/page components).
 */
export const useUIStore = create<UIState>()((set) => ({
  // ── Initial state ──────────────────────────────────────────────────────
  activeTab: 'player',
  isFullscreen: false,
  isQueueOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  showMiniPlayer: false,
  isBottomSheetOpen: false,
  bottomSheetContent: null,

  // ── Actions ────────────────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

  toggleQueue: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),

  setSearchOpen: (open) =>
    set({
      isSearchOpen: open,
      // Clear search query when closing
      ...(open ? {} : { searchQuery: '' }),
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setShowMiniPlayer: (show) => set({ showMiniPlayer: show }),

  openBottomSheet: (content) =>
    set({
      isBottomSheetOpen: true,
      bottomSheetContent: content,
    }),

  closeBottomSheet: () =>
    set({
      isBottomSheetOpen: false,
      bottomSheetContent: null,
    }),
}))
