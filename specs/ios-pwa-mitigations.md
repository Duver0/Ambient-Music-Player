# iOS PWA Mitigations

> **Complete reference for iOS Safari PWA limitations, workarounds, and testing checklist.**
> Owner: pwa-agent | Authority: HIGH | Veto: mobile-ux-agent

---

## Table of Contents

1. [iOS PWA Reality Check](#1-ios-pwa-reality-check)
2. [Storage Limitations](#2-storage-limitations)
3. [Audio Limitations](#3-audio-limitations)
4. [Service Worker Limitations](#4-service-worker-limitations)
5. [Viewport & Layout Issues](#5-viewport--layout-issues)
6. [Install Flow](#6-install-flow)
7. [UI/UX Limitations](#7-uiux-limitations)
8. [Testing Checklist](#8-testing-checklist)
9. [Feature Availability Matrix](#9-feature-availability-matrix)
10. [Defensive Coding Patterns](#10-defensive-coding-patterns)

---

## 1. iOS PWA Reality Check

```yaml
iOS PWA is NOT a first-class citizen on Apple devices.
Apple treats PWAs as "glorified bookmarks" — NOT as apps.

Critical Facts:
  - No beforeinstallprompt event (can't prompt installation)
  - No push notifications (until iOS 16.4+, with limitations)
  - No background audio (Web Audio stops when minimized)
  - No background sync
  - No persistent storage guarantee (iOS can purge data)
  - Service worker lifetime: ~30 seconds after last navigation
  - Storage limit: ~50MB (shared with Safari, not dedicated)
  - No navigator.storage.estimate() (can't check quota)
  - No periodic background sync
  - Dynamic toolbar (address bar) appears on scroll

Mindset:
  - Design for iOS limitations from day 1
  - iOS is the WEAKEST link — test on iOS FIRST
  - What works on Android + Chrome may FAIL on iOS Safari
  - Graceful degradation is not optional — it's mandatory
```

---

## 2. Storage Limitations

### 2.1 The 50MB Problem

```yaml
iOS Storage Reality:
  - Total PWA storage shared with Safari: ~50MB (varies by iOS version)
  - No quota estimation API (navigator.storage.estimate() returns 0)
  - iOS can purge data under memory pressure without warning
  - After purge: IndexedDB tables are EMPTY, no recovery
  
  Risk Analysis:
    - 50MB total for: metadata, settings, audio cache, IndexedDB
    - Audio file: 3min MP3 @ 128kbps ≈ 3MB per track
    - Max audio tracks in cache: ~10-12 (leaving room for other data)
    - Playlist metadata for 100 tracks: < 1MB
    
    Verdict: 50MB is TIGHT but workable for our use case
```

### 2.2 Storage Strategy for iOS

```yaml
Priority Pyramid (top = never purge, bottom = first to purge):

  1. ⬛ SETTINGS & PREFERENCES (essential)
     Storage: localStorage (survives purge better than IndexedDB)
     Data: theme, volume, playback mode, last session
     Size: < 10KB
     
  2. ⬛ PLAYLIST METADATA (essential)
     Storage: IndexedDB (Dexie)
     Data: track titles, artists, album art (small thumbnails)
     Size: < 5MB for 500 tracks
     
  3. ▨ ALBUM ART (important)
     Storage: IndexedDB (Dexie blob)
     Size: 256x256 max, JPEG, < 50KB each
     Max: 100 items → 5MB
     
  4. ▨ SESSION HISTORY (nice to have)
     Storage: IndexedDB
     Data: focus sessions, listening stats
     Size: < 1MB for 1000 sessions
     
  5. ░ AUDIO CACHE (nice to have — first to go)
     Storage: Cache API (SW-managed) — less likely to be purged
     Size: 256x256 max, JPEG, < 50KB each
     Max: 10 tracks → 30MB
     
  iOS Purge Protection:
    - Critical data (settings, metadata) → localStorage + IndexedDB backup
    - Version check on app start: if IndexedDB is empty but shouldn't be
      → Check localStorage for last known state
      → Attempt recovery or show "Welcome back" instead of "First time"
```

### 2.3 Detection & Recovery

```tsx
// iOS storage detection on app start
async function checkStorageIntegrity() {
  const lastVersion = localStorage.getItem('app-version')
  const schemaVersion = localStorage.getItem('schema-version')
  const db = new AppDatabase()
  
  try {
    const trackCount = await db.tracks.count()
    const playlistCount = await db.playlists.count()
    
    if (lastVersion && trackCount === 0 && playlistCount === 0) {
      // Data was purged! Attempt recovery
      await attemptRecovery()
      return { status: 'RECOVERED', from: lastVersion }
    }
    
    // Normal start
    localStorage.setItem('app-version', APP_VERSION)
    return { status: 'OK' }
    
  } catch (e) {
    // IndexedDB unavailable — full fallback
    return { status: 'NO_STORAGE', fallback: 'localStorage-only' }
  }
}
```

---

## 3. Audio Limitations

### 3.1 Web Audio on iOS Safari/PWA

```yaml
Critical Limitations:
  
  1. AudioContext Creation:
    - MUST be created inside a user gesture handler (click/tap)
    - NOT: touchstart, touchmove, scroll, load, timeout
    - If created outside: state = 'suspended', needs resume()
    - resume() also needs user gesture on some iOS versions
    
  2. AudioContext Lifetime:
    - Stays 'running' while app is in foreground
    - Becomes 'suspended' when app is minimized
    - May become 'closed' after extended background time
    - NO way to keep it alive in background
    
  3. AudioContext Resurrection:
    - From 'suspended': resume() works on return to foreground
    - From 'closed': must create NEW AudioContext
    - NEW AudioContext needs user gesture (iOS 17+ relaxes this?)
    
  4. Audio Latency:
    - Higher than Android (~50ms vs ~10ms)
    - Not suitable for real-time monitoring
    - Acceptable for music playback + visualization
    
  5. decodeAudioData:
    - Limit: 30MB per decode (larger files fail silently)
    - Files > 30MB must be split or compressed
    - Background decode can cause "suspended" context state
```

### 3.2 Audio Workarounds

```yaml
WORKAROUND #1 — Graceful Pause/Resume (RECOMMENDED)
  - On minimize: save position, accept that audio stops
  - On return: auto-resume or show "Continue playing" prompt
  - Pro: Simple, predictable, no battery drain
  - Con: Audio stops when minimized

WORKAROUND #2 — <audio> Element for Background (COMPLEX)
  - If background playback is CRITICAL:
    1. Create <audio> element in DOM
    2. Set src to track blob URL
    3. <audio>.play() continues in background on iOS PWA
    4. BUT: no Web Audio graph, no visualizer, no effects
    5. On foreground: switch back to AudioContext
    6. Pro: Audio continues in background
    7. Con: Complex, two playback paths, sync issues
    
  Decision: NOT implementing for v1. Re-evaluate if user demand.

WORKAROUND #3 — AudioContext Auto-Recovery
  Always handle these cases:
  - ctx.state === 'suspended' → ctx.resume()
  - ctx.state === 'closed' → new AudioContext()
  - ctx === null → create on next gesture
  
  This should be transparent to the user.
```

---

## 4. Service Worker Limitations

### 4.1 iOS SW Behavior

```yaml
iOS Service Worker Constraints:
  
  Lifetime:
    - SW stays alive ~30 seconds after PWA is backgrounded
    - After 30s: SW is terminated
    - On next foreground: SW starts fresh
    - No persistent SW process (unlike Android Chrome)
  
  Update Check:
    - SW update IS checked on navigation (page load / route change)
    - But: if no navigation happens (SPA with pushState), update may be delayed
    - Force: navigate to a new route or reload
  
  Cache:
    - Cache API IS available (works as expected)
    - Storage quota shared with IndexedDB (~50MB total)
    - Cache may be purged under memory pressure
  
  Background Sync:
    - NOT available on iOS PWA
    - No sync.periodic registration
    - Mitigation: queue analytics in IndexedDB, send on next foreground
  
  Push:
    - Available from iOS 16.4+ with web push API
    - Requires user permission
    - Not needed for this app (no server)
```

### 4.2 SW Strategy for iOS

```yaml
SW Configuration:
  - registerType: 'autoUpdate' (in vite-plugin-pwa)
  - On install: precache app shell
  - On activate: claim clients, clean old caches
  - On fetch: serve from cache or network
  
  iOS-specific:
    - SW version MUST change with every build (bust SW cache)
    - Use build hash in SW file name
    - On SW activate: force clients.claim() (iOS doesn't auto-claim)
    
  Update Flow:
    1. New SW detected by browser
    2. Install event fires (new cache created)
    3. Wait for existing pages to close (skipWaiting with user prompt)
    4. Activate: delete old caches, claim clients
    5. Page reloads with new SW
    
    On iOS: 
      - SW may not update until user opens PWA twice
      - Mitigation: show "Update available" toast
      - On tap: window.location.reload() activates new SW
```

### 4.3 Cache Strategy for iOS PWA

```yaml
iOS Cache Best Practices:
  
  DO:
    - Precache: app shell (HTML, CSS, JS) — small, essential
    - Cache audio files via CacheFirst with max 10 entries
    - Cache artwork as small thumbnails (256x256 max)
    - Version all cache names with build hash
    
  DON'T:
    - Don't precache audio files (too large for initial load)
    - Don't cache more than 30MB total
    - Don't rely on cache for critical data (use IndexedDB)
    - Don't cache dynamically-generated pages

iOS Cache Audit Checklist:
  - [ ] Precache total < 1MB
  - [ ] Audio cache max 10 tracks
  - [ ] Cache names versioned
  - [ ] Old caches deleted on activate
  - [ ] Offline fallback page works
  - [ ] SW update triggers UI notification
```

---

## 5. Viewport & Layout Issues

### 5.1 The Dynamic Toolbar Problem

```yaml
PROBLEM:
  iOS Safari has a dynamic toolbar (address bar + bottom bar)
  that appears/disappears as user scrolls. This:
    - Changes viewport height
    - Changes safe-area-inset-bottom value
    - Can cause layout shifts
    - Makes 100vh unreliable
    - Makes "bottom: 0" positioning incorrect
  
Impact on our app:
  - Bottom navigation bar may be covered by toolbar
  - Safe area padding may be wrong when toolbar animates
  - Fixed positioning elements jump when toolbar appears
  - Fullscreen player may show/hide toolbar unexpectedly
```

### 5.2 Viewport Mitigations

```yaml
Mitigation #1 — Use dvh (Dynamic Viewport Height):
  height: 100dvh;  /* NOT 100vh */
  min-height: 100dvh;
  
  dvh accounts for the dynamic toolbar.
  Falls back to 100vh on browsers that don't support it.

Mitigation #2 — Safe Area Handling:
  padding-bottom: env(safe-area-inset-bottom, 16px);
  
  IMPORTANT: safe-area-inset-bottom CHANGES when toolbar hides/shows.
  CSS env() updates automatically — no JS needed.
  BUT: if using JavaScript for positioning, listen for visualViewport changes.

Mitigation #3 — visualViewport API:
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      // Toolbar appeared/disappeared
      const viewportHeight = visualViewport.height
      const offsetTop = visualViewport.offsetTop
      // Recalculate layout if needed
    })
  }

Mitigation #4 — Prevent Toolbar Hiding:
  <meta name="apple-mobile-web-app-capable" content="yes">
  
  In standalone mode (installed PWA), the toolbar is ALWAYS hidden.
  This is the BEST mitigation — get users to install the PWA.
  
  For non-installed users (browser mode):
    - Accept toolbar behavior
    - Ensure bottom nav has safe-area-inset-bottom padding
    - Don't use position: fixed without safe area

Mitigation #5 — overscroll-behavior:
  html {
    overscroll-behavior: none;  /* Prevent rubber-banding that shows toolbar */
  }
```

### 5.3 Safe Area Behavior by Context

```yaml
Context                  safe-area-inset-bottom
──────────────────────────────────────────────────
  Safari (browser)       0px (no notch area visible)
  Safari scrolled        50px+ (toolbar visible)
  PWA standalone         34px (home indicator only)
  PWA + home indicator   34px
  PWA landscape          21px (home indicator on side)
  iPadOS PWA             ~20px (no home indicator, minor inset)

Rules:
  - ALWAYS use env(safe-area-inset-bottom) — never hardcode
  - ALWAYS use env(safe-area-inset-top) for notch area
  - Test in ALL contexts (browser, standalone, landscape)
  - Bottom navigation: padding-bottom = sp-4 + env(safe-area-inset-bottom)
  - Fixed UI at bottom: ALWAYS add safe area padding
```

### 5.4 Keyboard Handling

```yaml
iOS Keyboard Behavior:
  - Keyboard pushes viewport UP (not overlay like Android)
  - viewport height changes when keyboard opens
  - safe-area-inset-bottom does NOT account for keyboard
  - Elements near bottom may be covered or pushed off-screen

Mitigation:
  1. Use visualViewport API to detect keyboard:
     if (window.visualViewport) {
       const isKeyboardVisible = visualViewport.height < window.innerHeight
     }
  
  2. On keyboard open → scroll input into view:
     inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  
  3. Don't use position: fixed for input fields
  4. Use a ScrollView wrapper that adjusts when keyboard is visible
  
  Our app has minimal keyboard usage (search bar in library, settings).
  Risk: LOW.
```

---

## 6. Install Flow

### 6.1 iOS Installation UX

```yaml
iOS install flow (no beforeinstallprompt):
  1. User visits PWA in Safari
  2. Tap Share button (bottom center)
  3. Scroll down → "Add to Home Screen"
  4. Confirm name → tap "Add"
  5. PWA appears on home screen with icon
  
  Problems:
    - 4-step process (too many steps)
    - Share button is not obvious for non-tech users
    - Users don't know about "Add to Home Screen"
    - No way to prompt programmatically
```

### 6.2 In-App Install Guide

```yaml
iOS Install Prompt Strategy:
  
  Trigger Conditions:
    - User has visited at least 3 times
    - User has used app for > 5 minutes total
    - User has not already installed (check: !window.navigator.standalone)
    - User has not dismissed prompt in last 30 days
  
  UI Pattern:
    - NOT a popup/modal (too aggressive for iOS)
    - Inline suggestion in bottom sheet or settings
    - "Get the full experience — Add to Home Screen"
    - Show animated arrow pointing to Share button
    - Step-by-step visual guide (3 slides max)
    
  Implementation:
    - Detect: !window.navigator.standalone && /iPhone|iPad|iPod/.test(navigator.userAgent)
    - Show install card after 3 sessions (stored in localStorage)
    - Card: "Install Ambient Player for fullscreen + offline"
    - On tap: show guide, on dismiss: set cookie for 30 days
    
  Anti-Patterns:
    - ❌ Fullscreen install popup
    - ❌ Asking immediately on first visit
    - ❌ "Add to Home Screen" without explanation
    - ❌ Assuming user knows how to install on iOS
```

### 6.3 Install Detection

```tsx
function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true
}

// iOS standalone check
function isIOSPWA(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
    && 'standalone' in window.navigator
    && (window.navigator as any).standalone
}

// Show install prompt if not installed
if (!isInstalled()) {
  trackForInstallPrompt()
}
```

---

## 7. UI/UX Limitations

### 7.1 Touch & Interaction

```yaml
iOS Touch Differences:
  
  Touch Delay:
    - Safari has ~300ms tap delay on legacy pages
    - Fix: <meta name="viewport" content="width=device-width">
    - Modern Safari removes delay with proper viewport
    - Still: ensure touch-action: manipulation on interactive elements
  
  Gesture Conflicts:
    - iOS back swipe (left edge) → conflicts with our swipe-to-dismiss
    - iOS control center (top-right) → conflicts with our top actions
    - iOS notification center (top-left) → conflicts with top nav
    - Solution: avoid left-edge swipes, keep actions in thumb zone
    
  Swipe Conflict Mitigation:
    - Swipe-to-dismiss: only from center of screen (not edges)
    - Swipe distance: min 100px offset (not triggered by system gestures)
    - CSS: touch-action: pan-y on horizontally swipeable elements
  
  Haptic Feedback:
    - iOS haptic: HapticFeedback API works in PWA (iOS 16+)
    - navigator.vibrate() does NOT work on iOS (no vibration hardware exposed)
    - Mitigation: visual feedback (scale animation + opacity) instead of haptic
```

### 7.2 Status Bar & Notch

```yaml
Status Bar Behavior:
  - PWA standalone: status bar overlays the app (not separate)
  - Meta tag: apple-mobile-web-app-status-bar-style
    - default: white text on white bg (use black-translucent)
    - black-translucent: content shows behind status bar
    - black: black background, white text
    
  RECOMMENDED: black-translucent
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    
    - Content extends behind status bar
    - Must add padding-top: env(safe-area-inset-top, 44px) to header
    - Status bar text is white (visible on dark bg)
    - Consistent with fullscreen feel

Notch / Dynamic Island:
  - iPhone 14 Pro+: Dynamic Island replaces notch
  - safe-area-inset-top is ~54px (notch) or ~59px (Dynamic Island)
  - env() handles this — use it, don't hardcode
  
  iPad Pro: no notch, but has a thinner top inset (~24px)
```

### 7.3 Orientation

```yaml
iOS PWA Orientation:
  - Can lock: "orientation": "portrait" in manifest
  - Locked to portrait on iPhone
  - iPad: can support both orientations
  
  Our Strategy:
    - Manifest: "orientation": "portrait-primary" (prefer portrait)
    - Don't lock strictly — allow landscape on tablets
    - On iPhone: design only portrait (thumb zone optimized)
    - On iPad: grid layouts adapt to landscape
```

---

## 8. Testing Checklist

### 8.1 iOS PWA Pre-Release Checklist

```
[ ] INSTALL
   [ ] App installs via "Add to Home Screen"
   [ ] App icon displays correctly (all sizes)
   [ ] Splash screen shows correct color
   [ ] App opens in standalone mode (no Safari chrome)

[ ] LAYOUT
   [ ] No content under notch/Dynamic Island
   [ ] Bottom nav has safe area padding (not covered by home indicator)
   [ ] Fullscreen player fills viewport (100dvh)
   [ ] Layout survives dynamic toolbar show/hide (browser mode)
   [ ] Landscape mode doesn't break layout (iPad)
   [ ] Keyboard doesn't break layout (search/settings)

[ ] AUDIO
   [ ] AudioContext created on first user tap
   [ ] Playback starts within 500ms of tap
   [ ] App minimize → audio stops → position saved
   [ ] App return → audio can resume
   [ ] Media Session shows on lock screen (iOS 16.4+)
   [ ] Lock screen controls work (play/pause/next)
   [ ] No AudioContext errors in console

[ ] STORAGE
   [ ] IndexedDB persists after app close/reopen
   [ ] localStorage persists after app close/reopen
   [ ] Settings survive storage purge simulation
   [ ] QuotaExceededError gracefully handled

[ ] SERVICE WORKER
   [ ] App loads offline (cached shell)
   [ ] SW updates on second visit (after build change)
   [ ] "Update available" prompt appears
   [ ] Old caches cleaned on SW update
   [ ] Offline fallback page displays correctly

[ ] PERFORMANCE
   [ ] 60fps scrolling in library
   [ ] < 100ms touch response
   [ ] < 1.5s initial load (cold cache)
   [ ] < 50ms audio latency (tap → sound)
   [ ] No frame drops during animations
```

### 8.2 iOS Devices to Test

```yaml
Minimum Test Matrix:
  Device                 iOS    Notes
  ─────────────────────────────────────
  iPhone 15 Pro Max      18.x   Primary target — Dynamic Island
  iPhone 14              17.x   Notch, standard size
  iPhone SE (3rd gen)    17.x   Small screen, home button, no notch
  iPad Pro 12.9"         17.x   Tablet, landscape testing
  
  iOS versions to support:
    - iOS 17.0+ (95% of users)
    - iOS 16.4+ (Media Session, Web Push)
    - iOS 16.0+ (PWA behavior baseline)
    
  Bug tracking:
    - iOS 17.4: SW persistence fix
    - iOS 17.2: AudioContext changes
    - iOS 16.4: Media Session introduced
```

---

## 9. Feature Availability Matrix

```yaml
Feature                    iOS PWA    Android PWA    Desktop
──────────────────────────────────────────────────────────────
AudioContext               ✅ yes     ✅ yes          ✅ yes
AudioContext background    ❌ no      ✅ yes          ✅ yes  
Media Session API          ✅ 16.4+   ✅ yes          ✅ yes
Media Session background   ❌ no      ✅ yes          ✅ yes
IndexedDB                  ✅ yes     ✅ yes          ✅ yes
localStorage               ✅ yes     ✅ yes          ✅ yes
Cache API                  ✅ yes     ✅ yes          ✅ yes
SW precache                ✅ yes     ✅ yes          ✅ yes
SW background sync         ❌ no      ✅ yes          ✅ yes
SW periodic sync           ❌ no      ✅ yes          ✅ yes
Push notifications         ✅ 16.4+*  ✅ yes          ✅ yes
beforeinstallprompt        ❌ no      ✅ yes          N/A
Install flow               ❌ manual  ✅ prompt       N/A
Standalone mode            ✅ yes     ✅ yes          ✅ yes
Safe area CSS              ✅ yes     ⚠️ partial      ✅ yes
Dynamic toolbar            ❌ issue   ✅ stable       N/A
dvh units                  ✅ 15.4+   ✅ yes          ✅ yes
navigator.storage.estimate ❌ no      ✅ yes          ✅ yes
Haptic API                 ❌ no      ✅ yes          N/A
WebGL                      ✅ yes     ✅ yes          ✅ yes
Offline audio cache        ✅ yes     ✅ yes          ✅ yes
  
  * Requires server-side push service, not applicable here.
```

---

## 10. Defensive Coding Patterns

### 10.1 iOS Detection

```tsx
// Platform detection utilities
const platform = {
  isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
  isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  isPWA: window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true,
  iOSVersion: (() => {
    const v = navigator.userAgent.match(/OS (\d+)_(\d+)/)
    return v ? parseFloat(`${v[1]}.${v[2]}`) : 0
  })(),
  hasMediaSession: 'mediaSession' in navigator,
  hasStorageEstimate: 'storage' in navigator && 'estimate' in navigator.storage,
}
```

### 10.2 Conditional Feature Loading

```tsx
// Load features based on capability
function initializeApp() {
  if (platform.isIOS && !platform.isPWA) {
    // Browser Safari — dynamic toolbar affects layout
    enableViewportResizeHandler()
  }
  
  if (!platform.hasMediaSession) {
    // Fallback: no lock screen controls
    enableInAppControls()
  }
  
  if (!platform.hasStorageEstimate) {
    // iOS — can't check quota, use defensive storage
    enableStorageWatchdog() // monitor write errors
  }
  
  if (platform.isIOS) {
    // Enable iOS-specific workarounds
    enableAudioContextAutoRecovery()
    enableBackgroundPauseHandler()
  }
}
```

### 10.3 Graceful Degradation Rules

```yaml
ALWAYS degrade gracefully on iOS:
  - Feature not available? Show alternative, not error
  - Storage full? Show message, keep app functional
  - Audio stops? Save position, prompt on return
  - SW outdated? Show update toast, don't force reload
  
  NEVER:
    - Show a blank screen
    - Show "This browser is not supported"
    - Crash or throw unhandled errors
    - Lose user data without warning
```

> **Version:** 1.0.0
> **Last Updated:** 2026-05-27
> **Approved by:** pwa-agent, mobile-ux-agent
