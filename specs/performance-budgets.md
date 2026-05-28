# Performance Budgets

> **Measurable performance targets, device tier system, bundle budgets, runtime budgets.**
> Owner: performance-agent | Authority: VETO

---

## Table of Contents

1. [Performance Philosophy](#1-performance-philosophy)
2. [Bundle Budgets](#2-bundle-budgets)
3. [Loading Budgets](#3-loading-budgets)
4. [Runtime Budgets](#4-runtime-budgets)
5. [Memory Budgets](#5-memory-budgets)
6. [Audio Performance Budgets](#6-audio-performance-budgets)
7. [Animation Performance Budgets](#7-animation-performance-budgets)
8. [Device Tier System](#8-device-tier-system)
9. [Budget Enforcement](#9-budget-enforcement)
10. [Measurement Tools](#10-measurement-tools)

---

## 1. Performance Philosophy

```yaml
Principles:
  - Performance is a FEATURE, not an afterthought
  - 60fps is the MINIMUM, not the target
  - Perceived performance > actual performance
  - iOS is the WEAKEST link — test on iPhone SE
  - Animation is expensive — every animation must justify its cost
  - Bundle size is a TAX on the user — keep it low
  - Memory is SHARED with the OS — be a good citizen

Targets:
  - Feels "instant" (user perceives < 100ms response)
  - Feels "native" (no jank, no stutter, no layout shifts)
  - Works on 3-year-old mid-range devices
  - Battery-friendly (audio + animation don't dominate)
```

---

## 2. Bundle Budgets

### 2.1 JavaScript Bundle Targets

```yaml
Bundle              Current    Target(gzip)   Max(gzip)   Tree-shakeable
────────────────────────────────────────────────────────────────────────
  Initial (app)       —          65 KB         80 KB      ✅
  Player route        —          15 KB         20 KB      ✅ (lazy)
  Focus route         —          12 KB         15 KB      ✅ (lazy)
  Library route       —          18 KB         25 KB      ✅ (lazy)
  Settings route      —           8 KB         10 KB      ✅ (lazy)
  Framer Motion       —          25 KB         30 KB      ✅ (dynamic import)
  Zustand             —           3 KB          4 KB      ✅
  Dexie               —          12 KB         15 KB      ✅

  Total (all routes)  —         155 KB        200 KB

  Initial load (critical): React + Zustand + Dexie + router
  Route chunks: loaded on navigation (code splitting)
  Framer Motion: loaded only on pages with animations
```

### 2.2 CSS Bundle Targets

```yaml
CSS              Target      Max      Notes
───────────────────────────────────────────
  Initial         12 KB      15 KB    Tailwind base + components
  Critical CSS     3 KB       5 KB    Above-fold styles (inlined in <head>)
  Total           25 KB      35 KB    With all utility classes

  Strategy:
    - Tailwind CSS purges unused classes (production)
    - Critical CSS inlined in index.html
    - Non-critical CSS loaded asynchronously
    - NO CSS-in-JS (Tailwind has smallest CSS output)
```

### 2.3 Asset Budgets

```yaml
Asset Type            Target   Max      Format
───────────────────────────────────────────────
  App icon (192)       5 KB    10 KB    PNG
  App icon (512)      15 KB    25 KB    PNG
  PWA maskable icon   10 KB    15 KB    PNG
  Font files          30 KB   100 KB    WOFF2 (variable fonts)
  Offline page        10 KB    15 KB    HTML (inline)
  SW file             15 KB    20 KB    JS
```

---

## 3. Loading Budgets

### 3.1 Performance Metrics

```yaml
Metric                   Target       Max          Device
───────────────────────────────────────────────────────────
  First Paint (FP)        0.5s        1.0s         Mid-range
  First Contentful Paint  0.8s        1.5s         Mid-range
  Largest Contentful Paint 1.2s       2.0s         Mid-range
  Time to Interactive      1.5s        2.5s         Mid-range
  First Input Delay        30ms        100ms        Mid-range
  Cumulative Layout Shift  < 0.05      < 0.1        Mid-range
  Speed Index              1.5s        2.5s         Mid-range

  Extra targets:
    Service Worker ready     0.3s        0.5s
    AudioContext ready       0.1s        0.3s
    IndexedDB query (100)    10ms         30ms
    Route transition (SPA)  200ms       400ms
```

### 3.2 Loading Strategy

```yaml
First Load:
  1. HTML + critical CSS (inlined) → First Paint (~0.5s)
  2. Service Worker registers (doesn't block rendering)
  3. Core JS loads (React + router + Zustand) → Interactive (~1.5s)
  4. Routes load lazily on navigation
  5. AudioContext created on first user tap (not on load)
  6. IndexedDB opened in background (non-blocking)

Subsequent Loads (cached):
  1. SW serves app shell from cache → Instant (< 0.3s)
  2. Core JS from cache → Interactive (< 0.5s)
  3. IndexedDB data available immediately

Offline Load:
  1. SW serves from cache → Same as subsequent load
  2. All data from IndexedDB (no network needed)
```

### 3.3 Perceived Performance Tactics

```yaml
Instant Feedback:
  - Button press → visual feedback in < 50ms
  - Tap play → loading state immediately (even if audio isn't ready)
  - Route tap → background transition starts immediately
  
Skeleton Screens:
  - Player page: skeleton of album art + controls
  - Library: skeleton list items
  - Focus: skeleton timer circle
  
Optimistic Updates:
  - Volume change → update UI immediately, sync to engine async
  - Playlist add → show in UI immediately, write to DB async
  
Preemptive Loading:
  - Load next track when current is 70% through
  - Preload library data on app start (in background)
  - Keep SW cache warm
  
Progress Indication:
  - Audio loading: show determinate progress bar
  - Heavy operations: show indeterminate but with animation
  - NEVER show blank screen while loading
```

---

## 4. Runtime Budgets

### 4.1 Render Performance

```yaml
Metric                    Target        Max          Measurement
───────────────────────────────────────────────────────────────
  JS frame time            8ms          16ms         Chrome DevTools
  Render frame time        4ms          10ms         Chrome DevTools
  Total frame budget      12ms          16ms         (60fps = 16ms)
  Component render count   < 5           < 10         React DevTools profiler
  Re-render reason         Props change  —            Why did you render?
  Layout thrashing         0             1/layout     Performance API
  Long tasks               < 50ms       < 100ms      Performance Observer
  Store subscriptions      < 20          < 30         Count manually
```

### 4.2 Re-render Prevention

```yaml
Rules:
  1. ALL Zustand selectors must extract primitive values:
     ✅ const volume = usePlayerStore(s => s.volume)
     ❌ const { volume } = usePlayerStore()
     
  2. Components receiving objects as props MUST use React.memo:
     ✅ const TrackRow = React.memo(({ track }: Props) => ...)
     
  3. Callbacks passed to children MUST be stable (useCallback):
     ✅ const handlePlay = useCallback(() => play(track), [track.id])
     ❌ const handlePlay = () => play(track)
     
  4. Lists MUST have stable keys (track.id, not index):
     ✅ key={track.id}
     ❌ key={index}
     
  5. State colocation: local state in component, not in store:
     ✅ const [isOpen, setIsOpen] = useState(false)
     ❌ const isOpen = useUIStore(s => s.dialogOpen)
     
  6. Derived state: compute, don't store:
     ✅ const progress = currentTime / duration
     ❌ useEffect(() => setProgress(currentTime / duration), [currentTime])
```

---

## 5. Memory Budgets

### 5.1 Memory Targets

```yaml
Category                    Budget        Warning       Critical
───────────────────────────────────────────────────────────────
  JS heap (idle)             10 MB        20 MB         30 MB
  JS heap (playing)          25 MB        40 MB         60 MB
  Decoded audio cache        30 MB        50 MB         80 MB
  IndexedDB data             10 MB        20 MB         30 MB
  Cache API data             30 MB        40 MB         50 MB
  DOM nodes                  500          1000           2000
  Event listeners            50           100            200
  Total PWA storage          70 MB       100 MB         150 MB
```

### 5.2 Memory Management Strategy

```yaml
Decoded Audio Cache:
  - Max 5 decoded AudioBuffers simultaneously
  - LRU eviction: least recently played → free memory
  - AudioBuffer ≈ 10MB per 3-minute track (44.1kHz, float)
  - On memory pressure: reduce to 3 buffers
  
DOM Management:
  - Keep DOM lean (avoid deeply nested trees)
  - Virtualize long lists (library with 1000+ tracks)
  - Unmount hidden components (don't hide with display:none)
  - Cleanup event listeners on unmount
  
IndexedDB:
  - Track metadata: ~1KB per track (negligible)
  - Album art: ~50KB per thumbnail → 5MB for 100 tracks
  - Session history: ~0.5KB per session → 5MB for 10000
  
Cache API:
  - Audio files: ~3MB per track
  - Max 10 on iOS, 50 on Android
  - Total: 30MB (iOS) / 150MB (Android)

Memory Pressure Detection:
  - via performance.memory (Chrome only)
  - via GC frequency (indirect — observe long tasks)
  - On pressure: evict decoded audio cache, clear unused canvases
```

---

## 6. Audio Performance Budgets

### 6.1 Audio Metrics

```yaml
Metric                    Target        Max           Notes
────────────────────────────────────────────────────────────
  AudioContext creation    30ms          100ms         On first user gesture
  Audio decode (3min)      200ms         500ms         44.1kHz, 128kbps
  Audio decode (5min)      400ms         800ms         44.1kHz, 320kbps
  Play latency             20ms          50ms          Tap → sound
  Seek latency             30ms          80ms          Tap → new position
  Visualizer FPS           60fps         30fps(low)    getByteFrequencyData
  Audio file load (local)  10ms          50ms          From file system
  Audio file load (cache)   5ms          20ms          From Cache API
  Crossfade duration       200ms         500ms         Between tracks
```

### 6.2 Audio Optimization Rules

```yaml
Performance Rules:
  1. decodeAudioData runs on audio thread (not main thread)
     - It's async already — don't wrap in Worker unnecessarily
     - But: VERY LARGE files (> 30MB) may block → decode in chunks
     
  2. AnalyserNode getByteFrequencyData() is lightweight
     - Safe to call at 60fps (< 0.1ms per call)
     - Don't create multiple AnalyserNodes (share one)
     
  3. AudioBufferSourceNode creation is cheap (< 1ms)
     - Create on play, disconnect on stop (don't pool)
     
  4. GainNode.linearRampToValueAtTime() is GPU-accelerated
     - Use for fades instead of setValueAtTime + setTimeout
     
  5. Audio graph reconnection on resume is < 5ms
     - Don't pre-create nodes — create on demand

Battery Impact:
  - Audio playback: ~100-200mW (negligible)
  - Visualizer running at 60fps: ~50-100mW
  - On low battery: reduce visualizer to 30fps
  - On critical battery: stop visualizer entirely
```

---

## 7. Animation Performance Budgets

### 7.1 Animation Metrics

```yaml
Metric                    Target        Max           Notes
─────────────────────────────────────────────────────────────
  Animation FPS            60fps         55fps         Measured on mid-range
  Composited layers        < 10          < 15          Chrome Layers panel
  Simultaneous animations  < 12          < 20           Per view
  RAF callback time        < 5ms         < 10ms         Per frame
  will-change elements     < 10          < 15           Excessive = memory
  Paint count per frame    < 3           < 5            Chrome DevTools
  Layout per frame         0             1              Triggers jank
  JS frame time            < 8ms         < 12ms         Leaves room for render
```

### 7.2 Animation Cost Matrix

```yaml
Animation Type            GPU Cost   CPU Cost   Memory    Acceptable?
───────────────────────────────────────────────────────────────
  transform: translate     Free       Low        None      ✅ Always
  transform: scale         Free       Low        None      ✅ Always
  opacity                  Free       Low        None      ✅ Always
  filter: blur             Medium     Medium     Layer     ⚠️ Moderate
  backdrop-filter          High       High       Layer     ❌ Limit
  clip-path                High       High       Layer     ❌ Avoid
  layout (width/height)    ❌         Very High  Layout    ❌ NEVER
  box-shadow               ❌         High       Paint     ❌ NEVER
  color/gradient           ❌         High       Paint     ❌ NEVER
  SVG morphing             Medium     Medium     Layer     ⚠️ Rare
  Canvas (visualizer)      GPU        Low        Texture   ✅ 60fps
  
Layer Promotion Cost:
  - Each composited layer = ~2MB GPU memory
  - 10 layers = 20MB (acceptable)
  - 30 layers = 60MB (too much for mid-range)
```

### 7.3 Device-Tiered Animation Budget

```yaml
Low-Tier (iPhone SE, Moto G):
  - Max 5 simultaneous animations
  - Transform + opacity ONLY (no blur, no filter)
  - No parallax
  - CSS transitions preferred over Framer Motion
  - will-change: transform only
  - Visualizer: 16 bands, 30fps

Mid-Tier (iPhone 13, Pixel 6):
  - Max 12 simultaneous animations
  - Limited blur (max 16px)
  - Select Framer Motion animations
  - Parallax: subtle only
  - Visualizer: 32 bands, 60fps
  - Glassmorphism: blur 16px

High-Tier (iPhone 15 Pro, Galaxy S24):
  - Max 20 simultaneous animations
  - Full blur support (up to 48px)
  - Full Framer Motion (spring, layout animations)
  - Parallax: full
  - Visualizer: 64 bands, 60fps
  - Glassmorphism: full
```

---

## 8. Device Tier System

### 8.1 Tier Detection

```tsx
type DeviceTier = 'low' | 'mid' | 'high'

function detectDeviceTier(): DeviceTier {
  const memory = (navigator as any).deviceMemory
  
  // Low-end: < 4GB RAM, old GPU
  if (memory && memory < 4) return 'low'
  
  // Check for low-end iOS
  if (/iPhone [SE|6|7|8]/.test(navigator.userAgent)) return 'low'
  
  // Mid: 4-6GB RAM
  if (memory && memory < 6) return 'mid'
  
  // Check processor cores
  const cores = navigator.hardwareConcurrency
  if (cores && cores < 6) return 'mid'
  
  // High: 8GB+ RAM, 8+ cores
  return 'high'
}
```

### 8.2 Tier-Based Feature Flags

```tsx
const features = {
  low: {
    blur: false,
    parallax: false,
    framerMotion: 'essential' as const, // only opacity + transform
    glassmorphism: false,
    visualizerBands: 16,
    visualizerFPS: 30,
    pageTransition: 'fade' as const,
    ambientEffects: false,
    maxAnimations: 5,
  },
  mid: {
    blur: true,
    parallax: 'subtle' as const,
    framerMotion: 'selective' as const,
    glassmorphism: true,
    visualizerBands: 32,
    visualizerFPS: 60,
    pageTransition: 'slide' as const,
    ambientEffects: 'minimal' as const,
    maxAnimations: 12,
  },
  high: {
    blur: true,
    parallax: 'full' as const,
    framerMotion: 'all' as const,
    glassmorphism: true,
    visualizerBands: 64,
    visualizerFPS: 60,
    pageTransition: 'cinematic' as const,
    ambientEffects: 'full' as const,
    maxAnimations: 20,
  },
}
```

---

## 9. Budget Enforcement

### 9.1 Enforcement Gates

```yaml
Gate 1 — Build Time:
  Check: Bundle size via rollup-plugin-visualizer
  Enforcer: deployment-agent
  Action: If bundle > budget → BUILD FAILS
  
Gate 2 — Code Review:
  Check: Lazy loading, code splitting, import size
  Enforcer: code-review-agent
  Action: If lazy loading missing → WARNING / BLOCK
  
Gate 3 — Pre-Release:
  Check: Lighthouse CI (LCP, TBT, CLS)
  Enforcer: performance-agent
  Action: If score < target → VETO release
  
Gate 4 — Runtime:
  Check: FPS monitoring (dev only), memory monitoring
  Enforcer: performance-agent
  Action: If FPS < 45 for 5s → flag for optimization
```

### 9.2 Budget Violation Responses

```yaml
Violation Level     Response
───────────────────────────────────────────
  < 5% over budget    Warning — note for next sprint
  5-10% over budget   Must optimize before merge
  10-20% over budget  BLOCK — cannot merge
  > 20% over budget   BLOCK + architecture review

Animation FPS:
  < 55fps           Warning — identify cause
  < 45fps recurring  BLOCK — animation must be removed or optimized
  
Memory:
  > 80% heap usage   Warning — investigate
  > 90% heap usage   BLOCK — memory leak likely
```

---

## 10. Measurement Tools

### 10.1 Tool Configuration

```yaml
Build Analysis:
  - rollup-plugin-visualizer (bundle composition)
  - vite-bundle-analyzer (chunk sizes)
  - knip (dead code detection)

Lighthouse:
  - Lighthouse CI (automated in CI pipeline)
  - Target: Performance ≥ 95, PWA ≥ 95, Accessibility ≥ 95
  - Device: Mobile (emulated)

Runtime Monitoring:
  - Chrome DevTools Performance tab
  - React DevTools Profiler (render count, commit timing)
  - Why Did You Render (re-render debug)
  - fps-emitter (runtime FPS overlay — dev only)

Memory Profiling:
  - Chrome DevTools Memory tab
  - Heap snapshots (before/after operations)
  - Allocation instrumentation (find leaks)
  - performance.memory (Chrome — memory pressure)

Custom Performance Marks:
  - performance.mark('audio:play:start')
  - performance.mark('audio:play:end')
  - performance.measure('audio:play-latency', 'audio:play:start', 'audio:play:end')
```

### 10.2 CI Integration

```yaml
Performance CI Steps:
  1. Build → bundle size check (FAIL if > budget)
  2. Lighthouse CI → score check (FAIL if < target)  
  3. Load test → TTI check (FAIL if > 2s)
  4. Animation test → FPS check (FAIL if < 50)

  Tools:
    - GitHub Actions (or similar)
    - Lighthouse CI server
    - Custom Node.js script for bundle check
```

> **Version:** 1.0.0
> **Last Updated:** 2026-05-27
> **Approved by:** performance-agent, architecture-agent
