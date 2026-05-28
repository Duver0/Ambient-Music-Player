import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemeMode = 'dark' | 'light'
export type AudioQuality = 'high' | 'medium' | 'low'

export interface SettingsState {
  // Data
  theme: ThemeMode
  audioQuality: AudioQuality
  crossfadeEnabled: boolean
  crossfadeDuration: number
  rememberPlaybackPosition: boolean
  autoResumeOnStart: boolean
  storageUsage: number
  storageQuota: number

  // Actions
  setTheme: (theme: ThemeMode) => void
  setAudioQuality: (quality: AudioQuality) => void
  setCrossfadeEnabled: (enabled: boolean) => void
  setCrossfadeDuration: (duration: number) => void
  setRememberPlaybackPosition: (remember: boolean) => void
  setAutoResumeOnStart: (autoResume: boolean) => void
  updateStorageInfo: () => Promise<void>
  clearAllData: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
  theme: 'dark' as ThemeMode,
  audioQuality: 'high' as AudioQuality,
  crossfadeEnabled: true,
  crossfadeDuration: 3,
  rememberPlaybackPosition: true,
  autoResumeOnStart: false,
  storageUsage: 0,
  storageQuota: 0,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ── Initial state ──────────────────────────────────────────────────
      ...DEFAULT_SETTINGS,

      // ── Actions ────────────────────────────────────────────────────────

      setTheme: (theme) => set({ theme }),

      setAudioQuality: (quality) => set({ audioQuality: quality }),

      setCrossfadeEnabled: (enabled) => set({ crossfadeEnabled: enabled }),

      setCrossfadeDuration: (duration) =>
        set({ crossfadeDuration: Math.max(0, Math.min(30, duration)) }),

      setRememberPlaybackPosition: (remember) =>
        set({ rememberPlaybackPosition: remember }),

      setAutoResumeOnStart: (autoResume) =>
        set({ autoResumeOnStart: autoResume }),

      updateStorageInfo: async () => {
        let usage = 0
        let quota = 0

        if (navigator.storage && navigator.storage.estimate) {
          try {
            const estimate = await navigator.storage.estimate()
            usage = estimate.usage ?? 0
            quota = estimate.quota ?? 0
          } catch {
            // StorageManager not available
          }
        }

        set({
          storageUsage: usage,
          storageQuota: quota,
        })
      },

      clearAllData: async () => {
        try {
          // 1. Clear IndexedDB
          const databases = await indexedDB.databases?.() ?? []
          await Promise.all(
            databases
              .filter((d) => d.name && d.name.startsWith('Ambient'))
              .map((d) => indexedDB.deleteDatabase(d.name!)),
          )

          // 2. Clear Cache API
          const cacheKeys = await caches.keys()
          await Promise.all(
            cacheKeys
              .filter((key) => key.startsWith('ambient-'))
              .map((key) => caches.delete(key)),
          )

          // 3. Clear localStorage (preserve this session's settings if needed)
          const settingsKeys = [
            'ambient-player-storage',
            'ambient-focus-storage',
            'ambient-settings-storage',
            'ambient-data-version',
          ]
          for (const key of settingsKeys) {
            localStorage.removeItem(key)
          }
        } catch {
          // Partial failure is acceptable — some caches may not clear
        }

        // Reset to defaults
        set(DEFAULT_SETTINGS)
      },
    }),
    {
      name: 'ambient-settings-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist ALL settings
    },
  ),
)
