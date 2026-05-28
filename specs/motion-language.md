# Motion Language

> **Animation principles, timing, easing, GPU rules, and motion philosophy.**
> Owner: motion-agent | Authority: HIGH | Veto: performance-agent

---

## Table of Contents

1. [Motion Philosophy](#1-motion-philosophy)
2. [Timing Scale](#2-timing-scale)
3. [Easing System](#3-easing-system)
4. [Animation Categories](#4-animation-categories)
5. [GPU & Performance Rules](#5-gpu--performance-rules)
6. [When NOT to Animate](#6-when-not-to-animate)
7. [Reduced Motion Strategy](#7-reduced-motion-strategy)
8. [Device Tier Strategy](#8-device-tier-strategy)
9. [Battery-Aware Animations](#9-battery-aware-animations)
10. [Implementation Standards](#10-implementation-standards)

---

## 1. Motion Philosophy

```yaml
Personality: "Ambient but responsive"

Principles:
  - Slow, smooth, never abrupt
  - No bouncy/playful (this is not a kid's app)
  - Every animation has a purpose:
      • Spatial: helps user understand where things are
      • Attentional: guides focus to what changed
      • Expressive: conveys mood and quality
  - Minimalist: if an animation doesn't serve one of the above, remove it
  - Motion should feel like the UI is breathing, not dancing

Anti-Principles:
  - No elastic/bounce easings (not playful)
  - No spinning/rotating loaders (too web-like)
  - No parallax that induces motion sickness
  - No staggered animations that delay user interaction
  - No hover-only animations on mobile (they don't exist)

References:
  - Apple Music: smooth crossfades, album art transitions
  - Nothing OS: glyph animations, icon morphing
  - Arc Browser: spatial navigation, tab transitions
  - iOS SpringBoard: icon press, app open transitions
```

---

## 2. Timing Scale

```yaml
All durations in milliseconds.

Token          Duration   Usage
─────────────────────────────────────
  instant        50ms     Visual feedback (press, tap)
  micro         100ms     Toggle, switch, checkbox
  quick         200ms     List item enter, card hover
  default       300ms     Standard transitions (panels, sheets)
  ambient       500ms     Mood changes, gradient shifts
  slow          800ms     Page transitions, hero animations
  cinematic    1200ms     Scene changes, dramatic reveals

Context-Specific Timing:
  Button press → instant (50ms) — immediate feedback
  Bottom sheet → default (300ms) — natural slide
  Page transition → slow (800ms) — cinematic feel
  Album art swap → ambient (500ms) — crossfade feel
  Visualizer bars → real-time (no artificial delay)
  Toast appear → quick (200ms), disappear → slow (500ms)
  Skeleton load → micro to quick (stagger children)
```

### 2.1 Timing Rules

```yaml
Rules:
  - Interactions requiring feedback: ≤ 100ms (perceived as instant)
  - UI element transitions: ≤ 300ms (keeps UI feeling responsive)
  - Atmospheric transitions: up to 800ms (user is not interacting)
  - NEVER exceed 1200ms for any animation (user perceives as slow)
  - Enter animations should be faster than exit (user wants to see content)
  - Exit can be slightly slower than enter (provides closure)
  - Stagger delays: max 50ms between children, max 300ms total stagger
```

---

## 3. Easing System

```yaml
Token            Cubic Bezier                    Usage
──────────────────────────────────────────────────────────────
  ease-default    [0.25, 0.1, 0.25, 1.0]        Standard UI motion
  ease-enter      [0.0, 0.0, 0.2, 1.0]          Elements appearing
  ease-exit       [0.4, 0.0, 1.0, 1.0]           Elements disappearing
  ease-cinematic  [0.6, 0.01, -0.05, 0.95]       Dramatic transitions
  ease-spring     { damping: 20, stiffness: 200 } Gestures, natural feel
  ease-smooth     [0.45, 0, 0.55, 1]             Continuous motion

Easing Rules:
  Enter: ease-out (fast start, slow end) — content appears quickly
  Exit:  ease-in  (slow start, fast end) — content disappears discreetly
  Move:  ease-in-out — natural between states
  Gesture: spring — feels physical, responsive
  
  NEVER use:
    - ease-in for enter (feels sluggish)
    - ease-out for exit (linger feels wrong)
    - linear for anything (robotic, unnatural)
    - cubic-bezier with overshoot > 1.0 (bouncy)
```

---

## 4. Animation Categories

### 4.1 Page Transitions

```yaml
Type: Shared layout animations with AnimatePresence
Duration: 800ms
Easing: ease-cinematic
Pattern:
  - Each route has a layoutId for shared elements
  - fade + scale(0.95→1) for route enter
  - fade + scale(1→0.95) for route exit
  - Album art: shared layoutId (seamless transition between pages)
  - Bottom nav: no transition (instant swap)

Implementation:
  <AnimatePresence mode="wait">
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8, ease: [0.6, 0.01, -0.05, 0.95] }}
    >
      {page}
    </motion.div>
  </AnimatePresence>
```

### 4.2 Micro-Interactions

```yaml
Type: whileHover / whileTap (Framer Motion)
Duration: 50–150ms
Easing: ease-spring (very subtle)

Elements:
  Buttons:
    press: scale(0.96) + opacity to 0.9 (100ms)
    release: scale(1) + opacity to 1 (200ms, spring)
    
  Cards:
    press: scale(0.98)
    hover (desktop only): translateY(-2px) + shadow intensify
    
  Sliders:
    thumb: scale(1→1.2) on drag start
    track: color fill animation (200ms)
    
  Tabs:
    active indicator: spring slide (damping: 25, stiffness: 300)
    
  Icons:
    state change: rotate, morph, or fade (200ms)
    like: subtle scale pulse (150ms)
```

### 4.3 List & Stagger Animations

```yaml
Type: staggerChildren variants
Total stagger duration: max 300ms
Delay between items: 25–50ms (based on list density)

Pattern:
  container: {
    animate: { transition: { staggerChildren: 0.05 } }
  }
  item: {
    initial: { opacity: 0, y: 12 }
    animate: { opacity: 1, y: 0 }
  }

Rules:
  - Only stagger on INITIAL mount, not on re-renders
  - Lists > 10 items: disable stagger (instant show)
  - Search results: no stagger (instant is better)
  - Playlist items: stagger (25ms) for premium feel
```

### 4.4 Gesture Animations

```yaml
Swipe-to-dismiss:
  - drag="x" with dragConstraints
  - dragElastic: 0.1 (stiff, not bouncy)
  - onDragEnd: if offset > 100px || velocity > 500px/s → dismiss
  - Background: opacity based on drag progress
  
Pull-to-refresh:
  - drag="y" with dragConstraints={{ top: 0 }}
  - Refresh indicator: rotation based on drag distance
  - On release: spring back, then loading state
  
Bottom Sheet:
  - drag="y" with snap points (40%, 70%, 100%)
  - dragElastic: 0 at bottom (stops at snap), 0.3 at top
  - Background scrim: opacity based on sheet position
  - Snap animation: spring (damping: 30, stiffness: 300)

Slider seek:
  - Horizontal drag on progress bar
  - Thumb follows finger immediately (no delay)
  - Time label appears above thumb on drag
```

### 4.5 Ambient & Background Animations

```yaml
Type: Slow, atmospheric, non-interactive
Duration: 2000ms+ (continuous or very slow)
FPS target: 30fps (not 60fps — reduces battery impact)

Elements:
  Gradient shifts:
    - Background gradient slowly shifts hue (10s+ cycle)
    - CSS animation, not JS (GPU composited)
    - Only on high-end devices
    
  Visualizer:
    - Real-time (sync'd to audio analyser)
    - RAF loop, capped at 30fps on low battery
    
  Glow pulse:
    - Subtle opacity oscillation on accent glows
    - 4s cycle, 10% opacity range
    - CSS animation
    
  "Now Playing" marquee:
    - Scroll text for long titles
    - 20px/s scroll speed
    - Only when text overflows
    
Rules for background animations:
  1. ALWAYS pause when page is not visible (Page Visibility API)
  2. NEVER run at 60fps (30fps is sufficient for ambient)
  3. Use CSS animations where possible (GPU)
  4. Stop entirely on low battery mode
```

---

## 5. GPU & Performance Rules

### 5.1 What to Animate

```yaml
✅ SAFE (GPU composited — use these):
  transform (translate, scale, rotate)
  opacity
  filter (blur — moderate cost)

⚠️ CAUTION (GPU with overhead):
  clip-path (creates new render layer)
  border-radius + transform (layer promotion cost)
  backdrop-filter (expensive — use sparingly)

❌ AVOID (CPU rasterization — causes jank):
  width, height
  top, left, right, bottom (use transform: translate)
  margin, padding
  box-shadow (repaints on every frame)
  color, background-color (repaints)

❌ NEVER animate:
  display (can't be animated — flickers)
  visibility (use opacity instead)
  z-index (no visual transition)
  overflow (causes layout recalculation)
```

### 5.2 Performance Budgets

```yaml
Per Animation:
  - Composite layers: < 10 simultaneous
  - Animated elements per view: < 20
  - JS frame time: < 10ms (leaves 6ms for other work)
  - Paint count: < 5 per frame
  - FPS: ≥ 55 (target), ≥ 30 (acceptable on low tier)

Per Page:
  - Total animated elements: < 30
  - Active RAF loops: < 3 (visualizer, ambient, gesture)
  - will-change declarations: < 15

Measurement:
  - Chrome DevTools Performance tab
  - fps-emitter package (runtime overlay, dev only)
  - Layers panel (check composited layer count)
```

### 5.3 will-change Rules

```yaml
Rules:
  - ALWAYS specify exact property: will-change: transform (NOT will-change: all)
  - Apply BEFORE animation starts (50-100ms before)
  - Remove AFTER animation ends (prevents memory bloat)
  - Max 10 elements with will-change simultaneously
  
  Correct:
    .animated {
      will-change: transform;
      transition: transform 300ms ease;
    }
    .animated.ready {
      will-change: auto;  /* removed when done */
    }

  Framer Motion handles this automatically for motion components
```

---

## 6. When NOT to Animate

### 6.1 Hard Rules

```yaml
NEVER animate when:
  1. prefers-reduced-motion is set to "reduce"
  2. Page is in background (tab not visible)
  3. User is rapidly interacting (scrolling, typing)
  4. Battery is in low power mode
  5. Device is classified as "low-tier"
  6. Animation would delay user interaction
  7. Component mounts off-screen (below fold)
```

### 6.2 Throttling Rules

```yaml
Scroll-based animations:
  - Throttle to RAF (requestAnimationFrame)
  - No scroll listeners that trigger layout (use IntersectionObserver)
  
Rapid interactions:
  - Debounce animation triggers (300ms window)
  - Cancel in-progress animations if new one starts
  
Background tabs:
  - Pause ALL animations (use Page Visibility API)
  - Resume from current state (don't skip)
  - Only RAF-based animations need manual pause
```

---

## 7. Reduced Motion Strategy

### 7.1 Implementation

```tsx
import { useReducedMotion } from 'framer-motion'

function AnimatedComponent({ children }) {
  const shouldReduce = useReducedMotion()
  
  if (shouldReduce) {
    return <div className="transition-opacity duration-200">{children}</div>
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
```

### 7.2 What Stays vs What Goes

```yaml
✅ KEEP (essential — use CSS transitions instead):
  - Fade in/out (transform: none, only opacity)
  - Collapse/expand (height changes — use CSS)
  - Progress/loading indicators (motion is functional)
  - Button press feedback (CSS :active)
  - Page visibility (instant, no animation)

❌ REMOVE (non-essential):
  - Staggered list reveals
  - Parallax backgrounds
  - Scale/bounce effects
  - Gradient shifts
  - Glow animations
  - Particle/ambient effects
```

---

## 8. Device Tier Strategy

```yaml
Tiers determined by:
  - Device memory
  - GPU capabilities
  - Screen refresh rate
  - Battery status

High-Tier (iPhone 15 Pro, Galaxy S24, iPad Pro):
  - Full motion language
  - 60fps visualizer (64 bands)
  - Glassmorphism with blur
  - Parallax backgrounds
  - Fluid page transitions
  - Gradient shifts

Mid-Tier (iPhone 13, Pixel 6, iPad Air):
  - Reduced blur (cap at 16px)
  - 30fps visualizer (32 bands)
  - No parallax
  - Standard page transitions
  - No gradient shifts
  - will-change: transform only

Low-Tier (iPhone SE, Moto G, older devices):
  - NO Framer Motion (CSS transitions only)
  - NO blur effects
  - NO visualizer animation (static bars)
  - NO glassmorphism (solid backgrounds)
  - Opacity-only transitions
  - 200ms max transitions
```

---

## 9. Battery-Aware Animations

### 9.1 Battery API Integration

```tsx
// Check battery status
const battery = await navigator.getBattery()
const isLowPower = battery.level < 0.2 || battery.charging === false

// Battery monitor
battery.addEventListener('levelchange', () => {
  if (battery.level < 0.15) {
    disableAllAnimations()
  }
})
```

### 9.2 Battery Optimization Rules

```yaml
Normal battery (> 50%):
  - Full motion capability
  
Low battery (20-50%):
  - Disable ambient animations (gradients, glow)
  - Reduce visualizer to 30fps
  - Remove parallax
  
Critical battery (< 20%):
  - Disable ALL non-essential animations
  - CSS transitions only (no Framer Motion RAF)
  - Static visualizer
  - Reduce screen brightness (via CSS filter)
  
Charging:
  - Full motion restored
```

---

## 10. Implementation Standards

### 10.1 Framer Motion Configuration

```tsx
// Shared animation config — all agents import from this
// src/lib/motion/config.ts

const transition = {
  default: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] },
  enter: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1.0] },
  exit: { duration: 0.2, ease: [0.4, 0.0, 1.0, 1.0] },
  cinematic: { duration: 0.8, ease: [0.6, 0.01, -0.05, 0.95] },
}

const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
}
```

### 10.2 Motion Component Boundaries

```yaml
Architecture rules:
  - motion-agent creates ALL motion variants (src/lib/motion/variants.ts)
  - motion-agent creates ALL animated wrapper components
  - ui-agent and frontend-agent NEVER import framer-motion
  - Components use motion wrappers, not direct motion.div
  
  WRONG (ui-agent adds motion):
    import { motion } from 'framer-motion'
    <motion.div animate={...}>
  
  CORRECT (ui-agent uses motion wrapper):
    import { AnimatedContainer } from '@/components/motion/AnimatedContainer'
    <AnimatedContainer variant="slideUp">
```

> **Version:** 1.0.0
> **Last Updated:** 2026-05-27
> **Approved by:** motion-agent, performance-agent
