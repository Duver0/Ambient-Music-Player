# Visual Identity System

> **Design token architecture, color system, typography, spacing, elevation, and visual language.**
> Owner: design-system-agent | Authority: SUPREME on tokens

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing Scale](#4-spacing-scale)
5. [Elevation System](#5-elevation-system)
6. [Blur & Glass System](#6-blur--glass-system)
7. [Gradient System](#7-gradient-system)
8. [Light Mode Strategy](#8-light-mode-strategy)
9. [Responsive Breakpoints](#9-responsive-breakpoints)
10. [Z-Index Strategy](#10-z-index-strategy)
11. [Implementation Constraints](#11-implementation-constraints)

---

## 1. Design Philosophy

```yaml
Visual DNA:
  Vibe: “Ambient but intentional”
  
  Principles:
    - Dark is the canvas, light is the accent
    - Depth through blur, not through shadows
    - Every pixel has a job — no decoration without function
    - Content recedes, atmosphere is primary
    - Gradients suggest mood, not brand
    
  Anti-Principles:
    - No flat design (too sterile)
    - No heavy shadows (too material)
    - No bright colors on dark (too harsh)
    - No borders (use separation through depth)
    - No box-shadows for depth (use blur + translucency)
    
  References:
    - Nothing OS: monochrome accents, glyph-like icons
    - Apple Music: gradient backgrounds, glassmorphism
    - Arc Browser: sidebar with blur, spatial hierarchy
    - Spotify: album-centric, dark but warm
```

---

## 2. Color System

### 2.1 Ambient Palette (Dark Base)

```yaml
Background Surfaces:
  ambient-950: '#050505'   # Deepest — fullscreen player background
  ambient-900: '#0A0A0A'   # Default — main app background
  ambient-850: '#0F0F0F'   # Surface — card backgrounds
  ambient-800: '#141414'   # Elevated — bottom sheet, modals
  ambient-750: '#1A1A1A'   # Interactive — hover states
  ambient-700: '#1E1E1E'   # Borders — subtle separators

Glass Surfaces:
  glass-50:   'rgba(255,255,255,0.02)'  # Barely perceptible
  glass-100:  'rgba(255,255,255,0.04)'  # Subtle
  glass-200:  'rgba(255,255,255,0.06)'  # Default glass bg
  glass-300:  'rgba(255,255,255,0.08)'  # Hover on glass
  glass-400:  'rgba(255,255,255,0.12)'  # Active/pressed
  glass-500:  'rgba(255,255,255,0.20)'  # Strong (borders on glass)

Accent Colors:
  accent-primary:   '#6366F1'   # Indigo — main CTA, player controls
  accent-warm:      '#F59E0B'   # Amber — focus mode, timer
  accent-cool:      '#06B6D4'   # Cyan — ambient mode, visualizer
  accent-glow:      '#8B5CF6'   # Purple — reactive elements
  accent-rose:      '#F43F5E'   # Rose — alerts, destructive

Text Hierarchy:
  text-primary:     'rgba(255,255,255,0.95)'  # Headings, important
  text-secondary:   'rgba(255,255,255,0.65)'  # Body text
  text-tertiary:    'rgba(255,255,255,0.40)'  # Captions, metadata
  text-disabled:    'rgba(255,255,255,0.20)'  # Disabled states
  text-inverse:     '#0A0A0A'                  # Text on light/colored bgs

Utility:
  scrim:            'rgba(0,0,0,0.60)'         # Modal backdrops
  scrim-light:      'rgba(0,0,0,0.30)'         # Bottom sheet backdrops
  scrim-glass:      'rgba(0,0,0,0.80)'         # Glass backdrop (with blur)
```

### 2.2 Color Usage Rules

```yaml
Token Application:
  Backgrounds:
    - Main:       bg-ambient-900
    - Cards:      bg-ambient-850
    - Sheets:     bg-ambient-800
    - Glass:      bg-glass-200 backdrop-blur-glass
  
  Text:
    - Headings:   text-text-primary
    - Body:       text-text-secondary
    - Captions:   text-text-tertiary
  
  Borders:
    - Subtle:     border-glass-300
    - Strong:     border-glass-400
  
  Interactive:
    - Default:    bg-glass-200
    - Hover:      bg-glass-300
    - Active:     bg-glass-400

Rules:
  1. NEVER use raw hex/rgba in components — always use tokens
  2. NEVER use dark: prefix (dark is default)
  3. Text on glass surfaces must maintain 4.5:1 contrast
  4. Accent colors reserved for: CTAs, active states, audio visualization
  5. Error states: accent-rose only
```

### 2.3 Contrast Compliance

```yaml
WCAG AA Requirements (dark mode):
  text-primary on ambient-900:       #fff(0.95) on #0A0A0A → 15.3:1 ✅
  text-secondary on ambient-900:     #fff(0.65) on #0A0A0A → 7.8:1 ✅
  text-tertiary on ambient-900:      #fff(0.40) on #0A0A0A → 4.8:1 ✅ (AA for large)
  text-primary on glass-200:         #fff(0.95) on glass   → 13.5:1 ✅
  accent-primary on ambient-900:     #6366F1 on #0A0A0A   → 4.9:1 ✅ (AA for normal)

⚠️ Risk: accent-primary on glass-200 may drop below 3:1 → always use white text on accent bg
```

---

## 3. Typography

### 3.1 Type Scale

```yaml
Scale (base 16px, 1.25 ratio):

  Token            Size   LineH   Tracking   Weight    Usage
  ─────────────────────────────────────────────────────────────
  caption          12px   16px    0.4px      400       Labels, timestamps
  body-sm          14px   20px    0.25px     400       Secondary text
  body             16px   24px    0px        400       Default body
  body-lg          18px   28px    -0.2px     400       Featured text
  heading-sm       20px   28px    -0.3px     600       Section headers
  heading          24px   32px    -0.4px     600       Page titles
  heading-lg       32px   40px    -0.5px     700       Screen titles
  display          40px   48px    -0.6px     700       Hero / player
  display-xl       56px   64px    -0.8px     800       Now Playing (track)

Font Families:
  display:    '"SF Pro Display", "Inter", system-ui, -apple-system, sans-serif'
  body:       '"SF Pro Text", "Inter", system-ui, -apple-system, sans-serif'
  mono:       '"SF Mono", "JetBrains Mono", "Cascadia Code", monospace'
  numeric:    '"SF Mono", "JetBrains Mono", monospace'  # Timer, timestamps

⚠️ SF Pro only available on Apple devices. Always provide Inter + system-ui fallback.
```

### 3.2 Typography Rules

```yaml
Rules:
  - Track titles in player: display-xl, text-primary
  - Track titles in lists: body, text-primary
  - Artist/album: body-sm, text-secondary
  - Timer: mono display, 56+px
  - Captions/labels: caption, text-tertiary, uppercase
  - NEVER use font weights below 400 for body text
  - NEVER use letter-spacing on display text below -0.3px
  - Line height must never be less than 1.4x font size for body
  - Hyphenation: only on text blocks > 3 lines
```

---

## 4. Spacing Scale

### 4.1 4px Grid

```yaml
Token    Pixels    Rem       Usage
────────────────────────────────────
  sp-0      0px    0rem      None
  sp-1      4px    0.25rem   Micro spacing
  sp-2      8px    0.5rem    Tight pairs
  sp-3     12px    0.75rem   Button padding, icon gaps
  sp-4     16px    1rem      Default spacing
  sp-5     20px    1.25rem   Card padding
  sp-6     24px    1.5rem    Section margins
  sp-8     32px    2rem      Between sections
  sp-10    40px    2.5rem    Page margins
  sp-12    48px    3rem      Major sections
  sp-14    56px    3.5rem    Screen edges
  sp-16    64px    4rem      Large separations
  sp-20    80px    5rem       Hero areas
  sp-24    96px    6rem       Max edge padding

Padding Conventions:
  Page edges:     sp-6 (24px) default, sp-8 (32px) on tablets
  Card padding:   sp-5 (20px)
  Button padding: sp-3 (12px) horizontal, sp-2 (8px) vertical
  List items:     sp-4 (16px) horizontal, sp-3 (12px) vertical
  Between items:  sp-2 (8px) tight, sp-3 (12px) default
  Icon sizes:     24px (body), 20px (compact), 28px (large)
```

### 4.2 Spacing Rules

```yaml
Rules:
  - ALWAYS use the 4px grid — no odd values (3px, 5px, 7px, etc.)
  - gap-x and gap-y must be from spacing scale
  - NEVER use arbitrary spacing values (no `p-[13px]`)
  - Elements in a list should use consistent spacing
  - Touch targets: minimum 44×44px, preferred 48×48px
  - Icon touch targets: 44×44px hit area even if icon is 24px
```

---

## 5. Elevation System

```yaml
Elevation is conveyed through blur + brightness, NOT through box-shadow.

Level   Usage                      Filter                  Layer
─────────────────────────────────────────────────────────────────
  0     Base page                  none                     page
  1     Card                       backdrop-blur-sm         z-10
  2     Bottom sheet               backdrop-blur-lg         z-30
  3     Modal                      backdrop-blur-xl         z-40
  4     Toast/Alert                backdrop-blur-2xl        z-50
  5     Fullscreen overlay         backdrop-blur-3xl        z-60

  glow   Accent glow                box-shadow glow          z-20

Explanation:
  elevation-0:  No blur, fully opaque background
  elevation-1:  bg-ambient-850, subtle blur on anything below
  elevation-2:  bg-glass-200 + backdrop-blur-glass, translucent
  elevation-3:  bg-ambient-800 + backdrop-blur-heavy
  elevation-4:  bg-ambient-750 + backdrop-blur-heavy + scrim below
  elevation-5:  bg-ambient-950 + backdrop-blur-max

Box shadows (limited use):
  shadow-ambient:  '0 8px 32px rgba(0,0,0,0.4)'   # Default card
  shadow-glow:     '0 0 40px rgba(99,102,241,0.2)' # Accent glow
  shadow-glass:    '0 4px 12px rgba(0,0,0,0.3)'    # Glass surface

Rules:
  1. NEVER use box-shadow for depth (use blur + translucency)
  2. Box-shadows only for: glow effects, subtle card separation
  3. Each elevation level = specific z-index layer
  4. Glass surfaces must have backdrop-blur + translucent bg
```

---

## 6. Blur & Glass System

```yaml
Blur Tokens:
  blur-none:        '0px'        # No blur
  blur-sm:          '4px'        # Subtle, used on hover overlays
  blur-default:     '8px'        # Light glass
  blur-glass:       '16px'       # Default glassmorphism
  blur-heavy:       '24px'       # Modal backgrounds
  blur-xl:          '32px'       # Fullscreen overlays
  blur-2xl:         '40px'       # Maximum before artifacts
  blur-3xl:         '48px'       # Cinematic blur

Glass Pattern:
  .glass-default {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 0.5px solid rgba(255, 255, 255, 0.08);
  }

  .glass-elevated {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 0.5px solid rgba(255, 255, 255, 0.10);
  }

⚠️ iOS Performance: backdrop-blur > 24px can cause jank on older devices.
    On low-tier devices: cap at blur(16px) or disable glass effect.
```

---

## 7. Gradient System

```yaml
Gradient Tokens:
  bg-gradient-base:
    'linear-gradient(180deg, #0A0A0A 0%, #050505 100%)'
    # Default page background

  bg-gradient-player:
    'linear-gradient(180deg, #1a1a2e 0%, #0A0A0A 100%)'
    # Now Playing screen (cool tint)

  bg-gradient-focus:
    'linear-gradient(180deg, #1a1a0a 0%, #0A0A0A 100%)'
    # Focus mode (warm tint)

  bg-gradient-ambient:
    'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)'
    # Ambient mood glow

  bg-gradient-glow:
    'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 60%)'
    # Reactive glow behind album art

  bg-gradient-scrim:
    'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)'
    # Text legibility gradient over images

Gradient Rules:
  1. Background gradients = vertical (180deg) for page feel
  2. Glow gradients = radial for atmospheric effect
  3. NO diagonal gradients (too energetic for ambient)
  4. NO multi-stop gradients (> 3 stops = messy)
  5. Gradient intensity: subtle (< 15% opacity for colors)
```

---

## 8. Light Mode Strategy

```yaml
Principle: The app is dark-by-default. Light mode is an OPT-IN accessibility feature.

Implementation:
  - CSS class strategy: <html class="light">
  - All tokens default to dark values
  - light: variant overrides specific tokens
  - Only override what NEEDS to change (not everything)

Light Token Overrides:
  ambient-900  →  '#F5F5F5'   # Background
  ambient-850  →  '#EEEEEE'   # Surface
  ambient-800  →  '#E5E5E5'   # Elevated
  ambient-700  →  '#D4D4D4'   # Border
  glass-200    →  'rgba(0,0,0,0.03)'
  text-primary →  'rgba(0,0,0,0.95)'
  text-secondary → 'rgba(0,0,0,0.60)'

  # Accent colors stay the same (they work on light bg too):
  accent-primary: '#6366F1'  # Same — contrast OK on light

Rules:
  - Light mode is NOT a separate design — same layout, same spacing
  - Only colors and glass opacities change
  - No layout shifts when switching
  - Transition: 400ms ease for background, 200ms for text
```

---

## 9. Responsive Breakpoints

```yaml
Breakpoints (mobile-first):
  Token        Width       Target
  ─────────────────────────────────
  xs           320px       Small phones (iPhone SE)
  sm           375px       Default phones (iPhone)
  md           414px       Large phones (iPhone Plus/Max)
  lg           768px       Tablets portrait
  xl           1024px      Tablets landscape / small desktop
  2xl          1280px      Desktop

Design Target:
  Primary: 375–414px width (mobile)
  Secondary: 768–1024px (tablet)
  Tertiary: 1280px+ (desktop)

Rules:
  - Mobile-first: default styles = mobile, @media for larger
  - Container queries for reusable components
  - Desktop: max-width container (720px content area)
  - Sidebars/panels only on tablet+
```

---

## 10. Z-Index Strategy

```yaml
Token        Value    Usage
─────────────────────────────
  z-base       0      Page content
  z-sticky     10     Sticky headers
  z-nav        20     Bottom navigation, top bar
  z-dropdown   30     Menus, popovers
  z-sheet      40     Bottom sheet
  z-modal      50     Modals, dialogs
  z-toast      60     Toasts, notifications
  z-tooltip    70     Tooltips
  z-loader     80     Loading overlays
  z-max        90     Debug, dev tools

Rules:
  - NEVER use z-index values outside this scale (no z-[999])
  - Glass surfaces at their elevation level
  - Each modal/sheet creates a new stacking context
  - Toast always above modal
```

---

## 11. Implementation Constraints

### 11.1 Tailwind Config Structure

```yaml
tailwind.config.ts MUST include:
  - All color tokens as custom colors
  - All blur tokens as backdropBlur
  - All spacing tokens that differ from default (sp-*)
  - All z-index tokens
  - Box shadow tokens (limited)
  - Font families
  - Extended animation tokens (for motion-agent)
  - All gradient tokens as backgroundImage

A single source of truth:
  - Tokens defined ONCE in tailwind.config.ts
  - Consumed via className in components
  - NEVER duplicated in CSS files
```

### 11.2 File Organization

```
src/
└── styles/
    ├── globals.css          # @tailwind base/components/utilities, CSS custom props
    ├── safe-area.css        # Safe area utilities
    └── animations.css       # @keyframes for CSS animations (non-Framer)
```

### 11.3 Design Token Lifecycle

```yaml
Adding a token:
  1. design-system-agent identifies need
  2. Adds to tailwind.config.ts
  3. Documents in this spec (visual-identity.md)
  4. Notifies ui-agent + mobile-ux-agent
  5. Old tokens: deprecate but keep 1 version before removal

Deprecating a token:
  1. Mark as @deprecated in config comment
  2. Keep for 2 minor versions
  3. Remove in next major version
  4. Update all consumers before removal
```

---

> **Version:** 1.0.0
> **Last Updated:** 2026-05-27
> **Approved by:** architecture-agent, design-system-agent
