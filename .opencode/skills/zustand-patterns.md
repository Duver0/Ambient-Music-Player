# Skill: Zustand Patterns

> Predictable, performant state management with Zustand.

---

## Purpose

Standardize how Zustand stores are structured. Ensure state is minimal, actions are typed, and selectors prevent unnecessary re-renders.

## Triggers

Loaded when:
- state-management-agent creates/modifies stores
- frontend-agent consumes stores in components

## Rules

### Store Structure

```ts
interface PlayerState {
  // 1. State (flat, minimal)
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  playlist: Track[]

  // 2. Actions (functions)
  play: (track: Track) => void
  pause: () => void
  setVolume: (volume: number) => void
}
```

### Store Creation

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const usePlayerStore = create<PlayerState>()(
  devtools(
    (set, get) => ({
      // State
      currentTrack: null,
      isPlaying: false,
      volume: 0.75,

      // Actions (use set, not direct mutation)
      play: (track) => set({ currentTrack: track, isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      setVolume: (volume) => set({ volume }),
    }),
    { name: 'player-store' }
  )
)
```

### Selector Pattern (Prevent Re-renders)

```tsx
// GOOD: Extracts only what's needed
const volume = usePlayerStore((s) => s.volume)
const isPlaying = usePlayerStore((s) => s.isPlaying)

// BAD: Subscribes to entire store
const { volume, isPlaying } = usePlayerStore()
```

### Action Pattern

- Actions are functions on the store, not exported separately
- Use `get()` for reading current state inside actions
- Use `set()` for partial updates (Zustand merges shallowly)
- Use `set({...})` not `set(state => {...})` unless needed

### Store Composition (Slices)

For stores > 200 lines, use the slice pattern:

```ts
const createPlayerSlice: StateCreator<AppState> = (set) => ({
  // player state + actions
})
const createPlaylistSlice: StateCreator<AppState> = (set) => ({
  // playlist state + actions
})

export const useAppStore = create<AppState>()(
  devtools((...a) => ({
    ...createPlayerSlice(...a),
    ...createPlaylistSlice(...a),
  }))
)
```

## Re-Render Prevention Rules

| Pattern | Re-renders? | When to use |
|---------|-------------|-------------|
| `useStore(s => s.primitive)` | Only on change | DEFAULT |
| `useStore(s => s.obj)` | On obj change | For single objects |
| `useStore(s => s.obj.nested)` | On parent change | ⚠️ Use shallow |
| `useStore(s => s.field)` | ✅ Best | For specific fields |
| `useStore(s => [a, b], shallow)` | On a or b change | For multiple fields |
| `useStore()` | On ANY change | ❌ Avoid |

## Anti-Patterns

- ❌ Storing derived state (compute in selectors)
- ❌ Store > 200 lines (split into slices)
- ❌ `useStore()` without selector
- ❌ Mutating state directly (must use set())
- ❌ Async actions outside store (use store actions)
- ❌ Storing non-serializable data (AudioContext, DOM refs)
- ❌ Subscribe in components for non-rendering logic (use `useStore.subscribe`)
- ❌ Multiple small stores when one slice pattern suffices

## Implementation Notes

- Use `devtools` middleware for debugging
- Use `persist` middleware only for critical state (coordinate with offline-storage-agent)
- Actions are the ONLY way to modify state
- Selectors should be co-located or exported from store file
- Store files: `src/stores/player-store.ts`
