# Navigation & Routing Architecture

> **Bottom tabs, gesture navigation, routing strategy, deep linking, URL state.**
> Owner: mobile-ux-agent / frontend-agent | Authority: HIGH

---

## Table of Contents

1. [Navigation Philosophy](#1-navigation-philosophy)
2. [Tab Architecture](#2-tab-architecture)
3. [Route Definitions](#3-route-definitions)
4. [Routing Strategy](#4-routing-strategy)
5. [Gesture Navigation](#5-gesture-navigation)
6. [Deep Linking](#6-deep-linking)
7. [State & URL Sync](#7-state--url-sync)
8. [Mobile-Specific Patterns](#8-mobile-specific-patterns)
9. [Implementation Constraints](#9-implementation-constraints)

---

## 1. Navigation Philosophy

```yaml
Principles:
  - Thumb zone FIRST: primary navigation at the bottom
  - Content is king: navigation recedes when not needed
  - Gesture-native: swipe, tap, drag feel like iOS/Android
  - Instant: tab switches in < 50ms, page transitions in < 300ms
  - Contextual: fullscreen player hides nav, focus mode simplifies it

Navigation Hierarchy:
  1. Bottom Tabs (primary — always accessible)
  2. In-page navigation (sub-views within a tab)
  3. Modals / Bottom Sheets (temporary context)
  4. Fullscreen (immersive — player, focus)

Gesture Priority:
  1. System gestures (iOS back swipe, control center)
  2. Tab bar switch
  3. In-page gestures (swipe between tracks)
  4. Pull-to-refresh
  5. Long press context menu
```

---

## 2. Tab Architecture

### 2.1 Bottom Tab Bar

```yaml
Tabs (left to right):
  [1] Library     — tracks, playlists, browse
  [2] Player      — now playing (default)
  [3] Focus       — timer + ambient mix
  [4] Settings    — preferences, storage, about

Tab Bar Design:
  Position: Bottom (thumb zone)
  Height: 64px total (including safe area)
  Safe area: padding-bottom: env(safe-area-inset-bottom, 16px)
  Background: glass effect (bg-glass-200 + backdrop-blur-glass)
  Border top: 0.5px glass-300
  Active state: accent-primary icon + text
  Inactive state: text-tertiary icon only
  Icons: 24px, outlined, filled when active
  Labels: Show on larger screens (> 360px width), hide on small
  
Tab Bar Behavior:
  - Always visible (except fullscreen modes)
  - On scroll: tab bar stays fixed (iOS Safari behavior)
  - In fullscreen player: tab bar hidden, replaced by mini-player
  - In fullscreen focus: tab bar hidden, shown on swipe up
  - Double-tap tab: scroll to top of content
  
Mini-Player (replaces tab bar in player mode):
  - Height: 64px
  - Shows: album art (40px), track title, artist, play/pause
  - Tap: opens full player
  - Swipe up: opens full player with animation
  - Located at bottom (replaces tab bar position)
```

### 2.2 Tab Content Structure

```yaml
Library Tab:
  Default: "Playlists" view
  Sub-views:
    - Playlists (grid/list)
    - Tracks (all tracks, sortable)
    - Search (overlay, not separate page)
  
Player Tab:
  Default: Now Playing (current track)
  Sub-views:
    - Now Playing (fullscreen)
    - Queue (bottom sheet)
    - Up Next (drag up from bottom)

Focus Tab:
  Default: Timer + Ambient Mix
  Sub-views:
    - Timer (main view)
    - Ambient Mix (sheet/panel)
    - Session History (scrollable)

Settings Tab:
  Default: Settings list
  Sub-views:
    - Audio Quality
    - Storage Management
    - About
    - Theme (dark/light)
```

---

## 3. Route Definitions

### 3.1 Route Map

```yaml
Hash-based routing (required for PWA SW interception):

  #/library                    → Library page
  #/library/playlist/:id       → Playlist detail
  #/library/track/:id          → Track detail (optional)
  
  #/player                     → Now Playing (default)
  #/player/queue               → Queue overlay
  
  #/focus                      → Focus page
  #/focus/history              → Session history
  
  #/settings                   → Settings
  #/settings/storage           → Storage management
  #/settings/about             → About screen
  
  #/ (default)                 → Redirect to player

Route nesting:
  - /library, /player, /focus, /settings are TAB roots
  - Nested routes show within their tab container
  - Tab bar persists across nested routes
  - Fullscreen modes (/player/fullscreen) hide tab bar
```

### 3.2 Router Choice

```yaml
RECOMMENDED: TanStack Router
  Reasons:
    - Type-safe routes (params, search params)
    - Built-in search param handling
    - Lazy loading built-in
    - Devtools included
    - PWA-friendly (hash or history mode)
    
  Configuration:
    - hash-routing: true (for PWA SW compatibility)
    - basepath: '/' (or subpath if hosted in subdirectory)
    - trailingSlash: false
    
  Alternative: React Router v7
    - More ecosystem support
    - Slightly larger bundle
    - hash router available via createHashRouter

FINAL DECISION: Use TanStack Router for type safety + hash mode.
```

### 3.3 Route Configuration

```tsx
import { createRouter, Route } from '@tanstack/react-router'

const rootRoute = new Route({ 
  component: AppShell,
})

const libraryRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: lazy(() => import('@/pages/LibraryPage')),
})

const playerRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/player',
  component: lazy(() => import('@/pages/PlayerPage')),
})

const focusRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/focus',
  component: lazy(() => import('@/pages/FocusPage')),
})

const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: lazy(() => import('@/pages/SettingsPage')),
})

const routeTree = rootRoute.addChildren([
  libraryRoute,
  playerRoute,
  focusRoute,
  settingsRoute,
])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // preload on hover/tap intent
})
```

---

## 4. Routing Strategy

### 4.1 Why Hash Routing

```yaml
Hash routing is REQUIRED for PWA compatibility:
  1. Service Worker cannot intercept all routes in history mode
     - When SW serves offline page, history mode routes cause 404
     - Hash routes (#/player) work because SW serves index.html for offline
     
  2. No server-side fallback needed
     - Hash routing doesn't send hash to server
     - No need for 404.html redirect (required for history mode PWAs)
     
  3. Consistent behavior across platforms
     - Works identically in Safari, Chrome, Firefox
     - No special server config for iOS

Concession:
  - URLs include # (less clean)
  - Tradeoff worth it for PWA reliability
```

### 4.2 Code Splitting

```yaml
Route-based code splitting:
  Each tab route is a separate chunk (lazy loaded):
  
  Chunk          Size    Loaded
  ─────────────────────────────────
  main.js        65KB    Always (app shell)
  player.js      15KB    On /player navigation
  library.js     18KB    On /library navigation  
  focus.js       12KB    On /focus navigation
  settings.js     8KB    On /settings navigation

  Implementation:
    - React.lazy() + Suspense for each page
    - Suspense boundary shows skeleton screen
    - Preload on hover (TanStack Router: defaultPreload: 'intent')
```

### 4.3 Navigation Transitions

```yaml
Tab Switch:
  - INSTANT (no animation) — user wants content immediately
  - Previous tab content stays mounted briefly (React KeepAlive pattern)
  
Page Transition (in-page):
  - fade + scale (300ms, ease-enter)
  - Shared layout animations for album art
  
Fullscreen Toggle:
  - Player: slide up (400ms, ease-cinematic)
  - Focus: fade + scale (300ms)
  - Exit: slide down (300ms, ease-exit)

Modal / Sheet:
  - Bottom sheet: slide up (350ms, spring)
  - Overlay: fade (200ms)
```

---

## 5. Gesture Navigation

### 5.1 Gesture Map

```yaml
Context             Gesture              Action
─────────────────────────────────────────────────────────
  Player screen      Swipe left           Next track
  Player screen      Swipe right          Previous track
  Player screen      Tap center           Play/Pause
  Player screen      Swipe down           Minimize to mini-player
  Player screen      Tap album art        Fullscreen artwork
  Mini-player        Swipe up             Expand to full player
  Mini-player        Tap                  Expand to full player
  Library            Swipe left on track  Add to playlist or delete
  Library            Pull down            Refresh (re-scan files)
  Focus              Swipe up             Show settings
  Any                Long press           Context menu
  Any                Swipe up from bottom  Open queue (player)
```

### 5.2 Gesture Conflict Mitigation

```yaml
iOS System Gestures (must not conflict):
  - Left edge swipe → iOS back navigation
    → Our left-swipe actions start > 30px from edge
    → Swipe-to-dismiss: only triggered from center 70% of screen
    
  - Bottom edge swipe → iOS Control Center / App Switcher
    → Our bottom-sheet drag: starts > 20px from bottom
    → Only vertical drag on sheet handle, not on edge
    
  - Top edge (notch) → iOS Notification Center / Control Center
    → Our top area is non-interactive (padding only)

Gesture Priority Resolution:
  1. System gesture (iOS/Android) — always wins
  2. Drag on scrollable content — wins over swipe
  3. Horizontal swipe on player — wins over vertical
  4. Tap — lowest priority (fired after other gestures cancelled)

  touch-action CSS:
    - Swipeable player: touch-action: pan-y (only vertical scroll allowed)
    - Library list: touch-action: pan-y (horizontal swipe still detected)
    - Bottom sheet: touch-action: none (handle only)
```

### 5.3 Haptic Feedback (Simulated)

```yaml
Since iOS doesn't support navigator.vibrate(), we simulate haptics visually:

  Interaction          Visual Feedback
  ──────────────────────────────────────────
  Tap                  scale(0.96) + opacity(0.9) for 100ms
  Long press           scale(0.95) + subtle glow for 300ms
  Swipe dismiss        Follow finger + spring back or dismiss
  Drag snap            Quick scale(1.02) when snapping to position
  Tab switch           Quick opacity flicker (0.9 → 1)
  Slider               Thumb scales up on touch, shrinks on release

  These are NOT animations — they are SUB-100ms micro-feedback
```

---

## 6. Deep Linking

### 6.1 Supported Deep Links

```yaml
Not applicable for v1. This app has NO server, NO external sharing.
  
Future consideration:
  - open.ambientplayer.com/playlist/:id
  - Handle via custom protocol or universal links
  - Not needed until sharing feature is added
```

---

## 7. State & URL Sync

### 7.1 What Goes in URL

```yaml
URL Search Params (TanStack Router):
  - ?tab=player | library | focus | settings  (current tab)
  - ?playlist=:id  (selected playlist)
  - ?q=:query      (search query — library)
  - ?mode=focus | ambient (player mode)

What does NOT go in URL:
  - isPlaying (transient state)
  - currentTime (transient)
  - volume (in store + persisted)
  - Timer state (in store)
  
Rules:
  - URL reflects NAVIGATION state only
  - User can bookmark or share a URL → app opens in that state
  - URL is NOT the source of truth — store is
  - On app start: URL overrides default store values
```

### 7.2 URL ↔ Store Synchronization

```tsx
// On route change → update store
router.subscribe('onResolved', () => {
  const { tab, playlist } = router.state.location.search
  useUIStore.getState().setActiveTab(tab || 'player')
})

// On store change → update URL (selectively)
const activeTab = useUIStore(s => s.activeTab)
useEffect(() => {
  router.navigate({ 
    to: '.', 
    search: { tab: activeTab },
    replace: true, // don't add to history
  })
}, [activeTab])
```

---

## 8. Mobile-Specific Patterns

### 8.1 Bottom Sheet

```yaml
Usage:
  - Queue view (player tab)
  - Playlist options (library)
  - Settings sub-menus
  - Context menus on long press

Behavior:
  - Snap points: 30% (peek), 70% (half), 95% (full)
  - Drag handle at top (visual indicator)
  - Background scrim fades with drag position
  - Swipe down dismisses (below 25%)
  - Content scrolls independently when sheet is at full height

Implementation:
  - Framer Motion drag="y" with snap points
  - dragElastic: 0 at bottom, 0.2 at top
  - onDragEnd: snap to nearest point
  - spring transition for snap (damping: 30, stiffness: 300)
```

### 8.2 Fullscreen Mode

```yaml
Player Fullscreen:
  - Hides: tab bar, status bar content (safe area still respected)
  - Shows: album art (large), controls overlay on swipe
  - Background: gradient derived from album art colors
  - Exit: swipe down or tap mini-player icon

Focus Fullscreen:
  - Hides: everything except timer
  - Shows: timer, ambient controls (hybrid)
  - Background: warm gradient (focus mode)
  - Exit: swipe out
  - NO notifications, NO distractions

Rules:
  - Fullscreen mode is OPT-IN (user action, not auto)
  - System bars (battery, time) still visible in standalone PWA
  - Hardware back button (Android): exits fullscreen
  - Tab bar reappears on "pull up" gesture
```

### 8.3 Search (Library)

```yaml
Search Behavior:
  - Trigger: tap search icon in library header
  - Opens: inline search bar (animates header transition)
  - Input: auto-focused, keyboard opens
  - Results: filtered in real-time (debounced 200ms)
  - Clear: tap X or empty search
  - Dismiss: tap outside or tap back

  Search scope:
    - Track titles
    - Artist names
    - Album names
    - Playlist names

  No network search (all local)
```

---

## 9. Implementation Constraints

### 9.1 File Structure

```
src/
├── app/
│   ├── router.tsx              # Route definitions (TanStack Router)
│   ├── App.tsx                 # RouterProvider + QueryClientProvider
│   └── providers.tsx           # ThemeProvider, AudioProvider, etc.
│
├── pages/
│   ├── PlayerPage.tsx          # Lazy loaded route component
│   ├── LibraryPage.tsx         # Lazy loaded
│   ├── FocusPage.tsx           # Lazy loaded
│   └── SettingsPage.tsx        # Lazy loaded
│
├── components/
│   └── layout/
│       ├── BottomNav.tsx       # Tab bar (4 tabs)
│       ├── MiniPlayer.tsx      # Mini player (replaces tab bar)
│       ├── AppShell.tsx        # Layout wrapper (nav + content)
│       ├── BottomSheet.tsx     # Reusable bottom sheet
│       └── HeaderBar.tsx       # Top header with safe area
```

### 9.2 Responsive Adaptation

```yaml
Mobile (< 768px):
  - Bottom tab bar
  - Single column layouts
  - Full-width cards
  - Gesture navigation primary

Tablet (768-1024px):
  - Bottom tab bar (wider spacing)
  - Two-column layouts (library: sidebar + content)
  - Side panels instead of bottom sheets
  - Keyboard shortcuts (if keyboard connected)

Desktop (> 1024px):
  - Sidebar navigation (left) instead of bottom tabs
  - Max content width: 720px
  - Mouse hover states
  - Resizable panels
```

> **Version:** 1.0.0
> **Last Updated:** 2026-05-27
> **Approved by:** mobile-ux-agent, frontend-agent
