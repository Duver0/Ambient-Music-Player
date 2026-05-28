# Component Boundaries

> **Smart vs Dumb components, animation ownership, state ownership, layout ownership.**
> Owner: architecture-agent | Authority: SUPREME

---

## Table of Contents

1. [Component Philosophy](#1-component-philosophy)
2. [Component Tiers](#2-component-tiers)
3. [Smart vs Dumb Rules](#3-smart-vs-dumb-rules)
4. [Animation Ownership](#4-animation-ownership)
5. [State Ownership](#5-state-ownership)
6. [Layout Ownership](#6-layout-ownership)
7. [Hook Boundaries](#7-hook-boundaries)
8. [File Structure Standards](#8-file-structure-standards)
9. [Anti-Patterns](#9-anti-patterns)
10. [Implementation Examples](#10-implementation-examples)

---

## 1. Component Philosophy

```yaml
Principles:
  - Every component has ONE job
  - A component is either SMART (connects to state) or DUMB (only props)
  - Animation is a LAYER on top, not baked into components
  - Layout is a SEPARATE concern from content
  - State lives in the MINIMUM necessary scope

Three Layers:
  1. DATA LAYER  — services, stores, engine (no JSX)
  2. LOGIC LAYER — smart components, hooks (connect data → UI)
  3. VISUAL LAYER — dumb components, animation wrappers (pure JSX)
```

---

## 2. Component Tiers

```yaml
TIER 1 — PAGE COMPONENTS (frontend-agent)
  Role: Route-level composition
  What they do:
    - Compose layout + feature components
    - Connect to stores (top-level selectors)
    - Handle page-level lifecycle
    - Set document title, meta
  Examples: PlayerPage, FocusPage, LibraryPage, SettingsPage
  
  Rules:
    - ONE page per route
    - Pages are NOT reusable
    - Pages connect to multiple stores
    - Pages handle loading states (Suspense boundaries)

TIER 2 — FEATURE COMPONENTS (frontend-agent)
  Role: Feature-specific logic + composition
  What they do:
    - Contain business logic
    - Connect to ONE primary store
    - Compose presentation components
    - Implement feature-specific behavior
  Examples: NowPlayingBar, PlaylistView, TimerDisplay, QueueView
  
  Rules:
    - Feature components are reusable WITHIN their feature
    - Can import hooks from their feature domain
    - Can connect to ONE store directly
    - Should NOT contain raw Tailwind for visual design

TIER 3 — PRESENTATION COMPONENTS (ui-agent)
  Role: Pure visual rendering
  What they do:
    - Only props in, JSX out
    - NO store access
    - NO business logic
    - NO side effects
    - Apply design tokens via Tailwind
  Examples: PlayButton, TrackRow, ProgressBar, Card, Header
  
  Rules:
    - PURE components (React.memo where beneficial)
    - Props interface only — no store, no hooks
    - Visual states (hover, active, disabled) handled via CSS
    - NO animation imports

TIER 4 — MOTION COMPONENTS (motion-agent)
  Role: Animation layer
  What they do:
    - Wrap dumb components with Framer Motion
    - Define variants, transitions, gestures
    - No visual styling (no colors, spacing)
    - No business logic
  Examples: AnimatedPress, AnimatedSlideUp, SwipeableRow, FadeInView
  
  Rules:
    - ONLY file that imports framer-motion
    - Animation variants defined in shared config
    - No className changes — only motion props
    - Must respect reduced-motion

TIER 5 — LAYOUT COMPONENTS (ui-agent + mobile-ux-agent)
  Role: Structural scaffolding
  What they do:
    - Define page structure
    - Handle safe areas, responsive breakpoints
    - Compose header, content, footer areas
    - No business logic, no data fetching
  Examples: PageShell, SafeAreaView, BottomNav, HeaderBar, GridLayout
  
  Rules:
    - Layout is PLATFORM-AWARE (safe areas, notch)
    - Responsive via container queries
    - NO margin/padding on children (use gap)
    - Layout components don't know what children they hold
```

---

## 3. Smart vs Dumb Rules

### 3.1 Decision Tree

```
Is the component connecting to a Zustand store?
├── YES → Is it a page?
│   ├── YES → SMART (Tier 1 — Page Component)
│   └── NO  → Is it feature-specific?
│       ├── YES → SMART (Tier 2 — Feature Component)
│       └── NO  → WRONG — presentation components shouldn't connect to stores
└── NO  → Does it have business logic?
    ├── YES → Extract logic to hook, component stays DUMB
    └── NO  → Is it visual only?
        ├── YES → DUMB (Tier 3 — Presentation)
        └── NO  → Is it animation?
            ├── YES → DUMB (Tier 4 — Motion Wrapper)
            └── NO  → Is it layout?
                ├── YES → DUMB (Tier 5 — Layout)
                └── NO  → Is it needed?
```

### 3.2 Smart Component Rules

```yaml
Smart components:
  - Connect to EXACTLY ONE primary store (exceptions for pages)
  - Use selectors, not full store subscription:
    ✅ const isPlaying = usePlayerStore(s => s.isPlaying)
    ❌ const { isPlaying, volume, currentTrack } = usePlayerStore()
  - Delegate rendering to dumb components
  - Handle loading, error, empty states
  - Live in features/ directory
  
  Limitations:
    - NO direct framer-motion imports
    - NO raw Tailwind for visual design (use presentational components)
    - NO component-local state that should be in store
    - MAX 200 lines per smart component
```

### 3.3 Dumb Component Rules

```yaml
Dumb components:
  - ONLY receive data via props
  - ONLY emit events via callbacks
  - NO useEffect (unless animation-related for motion wrappers)
  - NO useState (unless trivial UI state like accordion open)
  - React.memo wrapped for components that render often
  - Live in components/ directory
  
  Props conventions:
    interface Props {
      // Required data props first
      // Optional data props second
      // Event handlers third (on*)
      // className last (for layout composition)
    }
    
    function TrackRow({ track, isActive, onPlay, className }: Props) {
      return (...)
    }
  
  Rules:
    - Props should be PRIMITIVES or simple objects (not full store state)
    - Callbacks should be (event: UIEvent) => void, not dispatch calls
    - Visual-only state (isHovered, isPressed) handled via CSS :hover, :active
```

---

## 4. Animation Ownership

### 4.1 Import Chain

```
framer-motion is imported ONLY by:
  ✅ src/lib/motion/config.ts (variants, transitions)
  ✅ src/components/motion/*.tsx (motion wrappers)
  ✅ src/features/*/motion/*.tsx (feature-specific motion)

framer-motion is NEVER imported by:
  ❌ Any file in src/components/ui/
  ❌ Any file in src/features/ (except motion/ subdirectory)
  ❌ Any file in src/stores/
  ❌ Any file in src/services/
  ❌ Any file in src/pages/ (pages use motion wrappers)
```

### 4.2 Component + Animation Composition

```tsx
// CORRECT: Separation of concerns
// ui-agent creates the visual component:
// Button.tsx
function Button({ children, onClick, className }: Props) {
  return (
    <button onClick={onClick} className={cn("px-4 py-2 rounded-lg", className)}>
      {children}
    </button>
  )
}

// motion-agent creates the animated wrapper:
// AnimatedButton.tsx
import { motion } from 'framer-motion'
import { pressAnimation } from '@/lib/motion/variants'

function AnimatedButton(props: ButtonProps) {
  return (
    <motion.div whileTap={pressAnimation} whileHover={hoverAnimation}>
      <Button {...props} />
    </motion.div>
  )
}

// frontend-agent uses the animated button:
// PlayerControls.tsx
function PlayerControls() {
  return (
    <AnimatedButton onClick={handlePlay}>
      <PlayIcon />
    </AnimatedButton>
  )
}
```

### 4.3 Animation Boundary Rules

```yaml
Who creates what:
  motion-agent:
    - Global animation variants (src/lib/motion/variants.ts)
    - Reusable motion wrappers (AnimatedPress, FadeIn, SlideUp)
    - Gesture handlers (SwipeableRow, DragToDismiss)
    - Page transition definitions
    - Shared element layout animations
    
  mobile-ux-agent:
    - Mobile-specific gesture wrappers (BottomSheet, PullToRefresh)
    - Touch feedback animations (with mobile-ux input)
    
  frontend-agent:
    - Feature-level animation composition (uses motion wrappers)
    - Should NOT create new animations
    
  ui-agent:
    - NO animation work (static styles only)
    - CSS transitions for simple hover/active states (not Framer Motion)

Rules:
  1. motion-agent MUST approve any new animation variant
  2. Animations are NOT coupled to components — they wrap them
  3. A dumb component should work WITHOUT its motion wrapper
  4. Exit animations must be defined for every AnimatePresence usage
```

---

## 5. State Ownership

### 5.1 State Location Map

```yaml
┌─────────────────────────────────────────────────────────────────┐
│                    STATE LOCATION MAP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ZUSTAND STORES (state-management-agent)                        │
│  ├── playerStore: currentTrack, queue, isPlaying, volume...     │
│  ├── uiStore: activeView, isFullscreen, theme...                │
│  ├── focusStore: timer, sessions, ambientMix...                 │
│  └── settingsStore: preferences, audio quality...               │
│                                                                 │
│  INDEXEDDB / DEXIE (offline-storage-agent)                      │
│  ├── Tracks metadata, playlists                                 │
│  ├── Settings (persisted)                                       │
│  ├── Session history                                            │
│  └── Audio cache (Blob)                                         │
│                                                                 │
│  AUDIO ENGINE (audio-engine-agent)                              │
│  ├── AudioContext reference (NOT in React state)                │
│  ├── AudioNode graph                                            │
│  ├── AudioBuffer cache (decoded)                                │
│  └── AnalyserNode data (frequency array)                        │
│                                                                 │
│  URL STATE (browser — frontend-agent)                           │
│  ├── Current route                                              │
│  └── Search params (query, filter)                              │
│                                                                 │
│  LOCAL STATE (component — NOT stored globally)                  │
│  ├── Accordion open/close                                       │
│  ├── Text input value (before submit)                           │
│  └── Tooltip visibility                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Store Communication Rules

```yaml
Communication flows:
  User taps Play:
    1. AnimatedButton → onClick → handlePlay()
    2. Feature component → playerStore.play(track)
    3. playerStore → calls audioEngine.play(track)
    4. audioEngine → creates AudioContext → loads → plays
    5. audioEngine → emits 'stateChange' → playerStore updates isPlaying
    6. UI re-renders via selector (isPlaying changed)

  Data flows DOWN (store → component → child component):
    playerStore.currentTrack → NowPlayingBar → TrackInfo display
    
  Events flow UP (child → parent → store):
    TrackRow.onPlay → PlaylistView.handlePlay → playerStore.play
    
  Audio data is SHARED, not stored:
    - audioEngine.getAnalyserData() called in RAF loop
    - Not stored in Zustand (would cause excessive re-renders)
    - Visualizer component calls engine directly
    - Zero-copy: engine gives reference to frequency array

Rules:
  - NEVER store derived data in Zustand (compute in selectors)
  - NEVER store non-serializable data in Zustand (AudioContext, DOM refs)
  - NEVER access audioEngine directly from UI — use store actions
  - NEVER read from Dexie in component render — use hooks
  - Store actions are the ONLY mutation path
```

### 5.3 Hook Boundaries

```yaml
Hook Categories:
  Data Hooks (frontend-agent + offline-storage-agent):
    - useTracks() → reads from Dexie via liveQuery
    - usePlaylist(id) → reads playlist + tracks
    - usePlaybackState() → subscribes to playerStore selectors
    
  Feature Hooks (frontend-agent):
    - usePlayer() → orchestrate play/pause/next/prev
    - useFocusTimer() → timer logic, session management
    - useSearch() → search with debounce
    
  UI Hooks (ui-agent + mobile-ux-agent):
    - useSafeArea() → safe area values (only if env() insufficient)
    - usePlatform() → platform detection
    - useReducedMotion() → from framer-motion (only motion-agent)
    
  Animation Hooks (motion-agent):
    - useAnimation() → scroll-driven, gesture-based
    - useReducedMotion() → from framer-motion

Rules:
  - Hooks follow component tier ownership:
    - Page/feature hooks → frontend-agent
    - Presentation/data hooks → ui-agent / offline-storage-agent
    - Animation hooks → motion-agent
  - Hooks don't render anything — they return values
  - HOOKS CAN CROSS DOMAINS — they orchestrate (e.g., usePlayer calls store + engine)
```

---

## 6. Layout Ownership

### 6.1 Layout Hierarchy

```
PageShell (layout — mobile-ux-agent)
├── SafeAreaView (layout — mobile-ux-agent)
│   ├── HeaderBar (layout — ui-agent)
│   ├── MainContent (layout — ui-agent)
│   │   └── Feature/Page component (smart — frontend-agent)
│   │       └── Presentation components (dumb — ui-agent)
│   └── BottomNav (layout — mobile-ux-agent)
└── NowPlayingBar (feature — frontend-agent)
    └── TrackInfo (presentation — ui-agent)
```

### 6.2 Layout Rules

```yaml
Layout components:
  - Own the STRUCTURE of the page
  - Define: headers, footers, sidebars, content areas
  - Handle: safe areas, responsive breakpoints
  - Use CSS Grid or Flexbox for structural arrangement
  - NO knowledge of what children they contain
  - Children receive layout via className prop
  
  Example:
    // PageShell — owns the page layout
    function PageShell({ header, children, bottomNav }: PageShellProps) {
      return (
        <div className="flex flex-col h-dvh">
          <SafeAreaTop />
          {header}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <SafeAreaBottom />
          {bottomNav}
        </div>
      )
    }

  Rules:
    - Layout components NEVER import from features/*
    - Layout components use generic slot props (header, children, footer)
    - Safe area handling is CENTRALIZED in layout components
    - Responsive breakpoints are handled in layout, not in feature components
```

---

## 7. File Structure Standards

### 7.1 Directory Structure

```
src/
├── app/
│   ├── App.tsx                  # Root component, providers
│   ├── providers.tsx            # Context providers (theme, audio, etc.)
│   └── router.tsx               # Route definitions
│
├── pages/                       # Page components (Tier 1 — SMART)
│   ├── PlayerPage.tsx
│   ├── FocusPage.tsx
│   ├── LibraryPage.tsx
│   └── SettingsPage.tsx
│
├── features/                    # Feature modules (Tier 2 — SMART)
│   ├── player/
│   │   ├── components/          # Feature-specific smart components
│   │   ├── hooks/               # Feature hooks
│   │   └── motion/              # Feature-specific animation (if any)
│   ├── focus-timer/
│   └── library/
│
├── components/                  # Shared components
│   ├── ui/                      # Presentation components (Tier 3 — DUMB)
│   │   ├── Button/
│   │   ├── Slider/
│   │   ├── TrackRow/
│   │   └── PlaylistCard/
│   ├── motion/                  # Motion wrappers (Tier 4 — DUMB)
│   │   ├── AnimatedPress.tsx
│   │   ├── FadeIn.tsx
│   │   └── SwipeableRow.tsx
│   └── layout/                  # Layout components (Tier 5 — DUMB)
│       ├── PageShell.tsx
│       ├── SafeAreaView.tsx
│       ├── BottomNav.tsx
│       └── HeaderBar.tsx
│
├── stores/                      # Zustand stores
│   ├── player-store.ts
│   ├── ui-store.ts
│   ├── focus-store.ts
│   └── settings-store.ts
│
├── services/                    # Business logic (no JSX)
│   ├── audio-engine/
│   │   ├── AudioEngine.ts
│   │   ├── AudioContextManager.ts
│   │   └── types.ts
│   ├── storage/
│   │   ├── database.ts
│   │   ├── migrations.ts
│   │   └── services/
│   └── focus-timer/
│
├── hooks/                       # Shared hooks
│   ├── usePlatform.ts
│   └── useReducedMotion.ts
│
├── lib/
│   ├── motion/
│   │   ├── config.ts            # Variants, transitions
│   │   └── easings.ts           # Easing definitions
│   ├── utils.ts
│   └── cn.ts                    # className utility
│
├── pwa/
│   ├── install.ts               # Install prompt logic
│   └── update.ts                # SW update handling
│
└── types/
    ├── track.ts
    ├── playlist.ts
    └── audio.ts
```

### 7.2 File Naming

```yaml
Conventions:
  Components: PascalCase → PlayerPage.tsx, TrackRow.tsx
  Hooks: camelCase with 'use' prefix → usePlayer.ts, useTracks.ts
  Stores: kebab-case → player-store.ts, ui-store.ts
  Services: PascalCase (class) → AudioEngine.ts
  Utils: camelCase → formatTime.ts, cn.ts
  Types: PascalCase → Track.ts, Playlist.ts
  Styles: kebab-case → globals.css, animations.css

  Folder for component with multiple files:
    ComponentName/
    ├── ComponentName.tsx
    ├── ComponentName.test.tsx
    ├── useComponentName.ts     (co-located hook)
    └── ComponentName.types.ts  (complex types only)
```

---

## 8. Anti-Patterns

```yaml
❌ SMART COMPONENT DOING VISUAL WORK:
  function PlayerPage() {
    const isPlaying = usePlayerStore(s => s.isPlaying)
    return (
      <div className="bg-ambient-900 p-6 rounded-xl">  ← VISUAL in SMART
        <PlayButton isPlaying={isPlaying} />
      </div>
    )
  }
  ✅ CORRECT: Smart component connects store, delegates visual to Dumb component:
  function PlayerPage() {
    const isPlaying = usePlayerStore(s => s.isPlaying)
    return <PlayerView isPlaying={isPlaying} />
  }

❌ DUMB COMPONENT FETCHING DATA:
  function TrackRow({ trackId }: { trackId: string }) {
    const track = useTrack(trackId)  ← DATA FETCHING in DUMB
    return <div>{track?.title}</div>
  }
  ✅ CORRECT: TrackRow receives track data as props:
  function TrackRow({ track }: { track: Track }) {
    return <div>{track.title}</div>
  }

❌ ANIMATION IN FEATURE COMPONENT:
  import { motion } from 'framer-motion'  ← WRONG import location
  function PlayButton() { ... }
  ✅ CORRECT: Motion wrapper:
  <AnimatedPress>
    <PlayButton />
  </AnimatedPress>

❌ STORE IN DUMB COMPONENT:
  function VolumeSlider() {
    const volume = usePlayerStore(s => s.volume)  ← STORE in DUMB
    return <Slider value={volume} />
  }
  ✅ CORRECT: VolumeSlider receives value as prop:
  function VolumeSlider({ volume, onChange }: Props) { ... }

❌ LAYOUT INSIDE FEATURE COMPONENT:
  function PlayerPage() {
    return (
      <div className="flex flex-col h-screen">  ← LAYOUT in FEATURE
        <PlayerContent />
      </div>
    )
  }
  ✅ CORRECT: Use layout component:
  function PlayerPage() {
    return (
      <PageShell bottomNav={<NowPlayingBar />}>
        <PlayerContent />
      </PageShell>
    )
  }
```

> **Version:** 1.0.0
> **Last Updated:** 2026-05-27
> **Approved by:** architecture-agent, frontend-agent
