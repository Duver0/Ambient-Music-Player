import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getDatabase, type DBSession } from '@/services/storage/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FocusSession {
  id: number
  startedAt: number
  endedAt: number | null
  duration: number
  actualDuration: number
  completed: boolean
  timerMode: 'focus' | 'break'
  ambientSoundType: string | null
}

export type TimerMode = 'focus' | 'break'

export interface FocusState {
  // Data
  timerDuration: number
  timerRemaining: number
  isTimerRunning: boolean
  isTimerPaused: boolean
  timerMode: TimerMode
  ambientMixLevel: number
  ambientSoundType: string | null
  sessions: FocusSession[]

  // Actions
  startTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  setTimerDuration: (seconds: number) => void
  setAmbientMixLevel: (level: number) => void
  setAmbientSoundType: (type: string | null) => void
  resetTimer: () => void
  tick: () => void
  completeSession: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_FOCUS_DURATION = 1500 // 25 minutes

const DEFAULT_AMBIENT_MIX_LEVEL = 0.3
const DEFAULT_AMBIENT_SOUND_TYPE: string | null = null

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      timerDuration: DEFAULT_FOCUS_DURATION,
      timerRemaining: DEFAULT_FOCUS_DURATION,
      isTimerRunning: false,
      isTimerPaused: false,
      timerMode: 'focus',
      ambientMixLevel: DEFAULT_AMBIENT_MIX_LEVEL,
      ambientSoundType: DEFAULT_AMBIENT_SOUND_TYPE,
      sessions: [],

      // ── Timer actions ──────────────────────────────────────────────────

      startTimer: () => {
        const { timerDuration } = get()
        set({
          isTimerRunning: true,
          isTimerPaused: false,
          timerRemaining: timerDuration,
        })
      },

      pauseTimer: () => {
        set({ isTimerPaused: true, isTimerRunning: false })
      },

      resumeTimer: () => {
        set({ isTimerPaused: false, isTimerRunning: true })
      },

      stopTimer: () => {
        set({
          isTimerRunning: false,
          isTimerPaused: false,
          timerRemaining: get().timerDuration,
        })
      },

      setTimerDuration: (seconds) =>
        set({
          timerDuration: seconds,
          timerRemaining: seconds,
        }),

      setAmbientMixLevel: (level) =>
        set({ ambientMixLevel: Math.max(0, Math.min(1, level)) }),

      setAmbientSoundType: (type) => set({ ambientSoundType: type }),

      resetTimer: () => {
        const { timerDuration } = get()
        set({
          timerRemaining: timerDuration,
          isTimerRunning: false,
          isTimerPaused: false,
        })
      },

      tick: () => {
        const { isTimerRunning, isTimerPaused, timerRemaining } = get()
        if (!isTimerRunning || isTimerPaused) return

        const newRemaining = timerRemaining - 1
        if (newRemaining <= 0) {
          // Timer completed — trigger session completion
          set({ timerRemaining: 0, isTimerRunning: false })
          get().completeSession()
        } else {
          set({ timerRemaining: newRemaining })
        }
      },

      completeSession: async () => {
        const { timerDuration, timerRemaining, timerMode, ambientSoundType, sessions } = get()
        const actualDuration = timerDuration - timerRemaining
        const now = Date.now()

        const session: FocusSession = {
          id: now, // Use timestamp as simple unique ID
          startedAt: now - actualDuration * 1000,
          endedAt: now,
          duration: timerDuration,
          actualDuration,
          completed: true,
          timerMode,
          ambientSoundType,
        }

        // Persist to IndexedDB via Dexie
        const dbSession: DBSession = {
          type: timerMode === 'focus' ? 'focus' : 'break',
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          duration: timerDuration,
          focusMode: timerMode,
        }

        try {
          const database = await getDatabase()
          await database.sessions.add(dbSession)
        } catch {
          // Non-critical — session still stored in-memory
        }

        set({
          sessions: [...sessions, session],
          timerRemaining: 0,
          isTimerRunning: false,
          isTimerPaused: false,
        })
      },
    }),
    {
      name: 'ambient-focus-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        timerDuration: state.timerDuration,
        ambientMixLevel: state.ambientMixLevel,
        ambientSoundType: state.ambientSoundType,
      }),
    },
  ),
)
