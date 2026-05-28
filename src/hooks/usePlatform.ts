/**
 * usePlatform — Comprehensive platform detection hook.
 *
 * Spec: ios-pwa-mitigations.md §10.1 (iOS Detection),
 *       §7.1 (Touch & Interaction), §5.3 (Safe Area Behavior by Context)
 *
 * Provides device, OS, browser, PWA, and capability detection for
 * platform-adaptive UI and feature toggling.
 */

export type Platform = 'ios' | 'android' | 'web'
export type PWAState = 'standalone' | 'browser' | 'unknown'
export type DeviceTier = 'low' | 'mid' | 'high'

export interface PlatformInfo {
  /** General platform classification */
  platform: Platform
  /** PWA display mode */
  pwaState: PWAState
  /** Whether running on a mobile device */
  isMobile: boolean
  /** Whether the device supports touch events */
  isTouchDevice: boolean

  /* ── OS / Browser Detection ── */
  /** Running on iOS (iPhone, iPad, iPod) */
  isIOS: boolean
  /** Running on Android */
  isAndroid: boolean
  /** Browser is Safari (desktop or mobile) */
  isSafari: boolean
  /** Parsed iOS version (e.g., 17.4). Returns 0 if not iOS. */
  iOSVersion: number

  /* ── PWA / Standalone Detection ── */
  /** App is running as an installed PWA (standalone display mode) */
  isPWA: boolean
  /** Alias for isPWA — installed via "Add to Home Screen" */
  isStandalone: boolean

  /* ── Hardware / Device Features ── */
  /** Device likely has a notch or Dynamic Island (safe-area-inset-top > 20) */
  hasNotch: boolean
  /** Media Session API available (lock screen controls) */
  hasMediaSession: boolean
  /** navigator.vibrate() available (does NOT work on iOS) */
  hasVibrate: boolean
  /** Haptic feedback available via HapticFeedback API */
  hasHaptic: boolean
  /** Reduced motion preference */
  isReducedMotion: boolean
  /** Device performance tier based on memory / cores / GPU */
  deviceTier: DeviceTier

  /* ── Safe Area Insets (read from CSS) ── */
  safeAreaInsets: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

/**
 * Parse iOS version from user agent string.
 * Returns 0 if not iOS.
 */
function parseIOSVersion(ua: string): number {
  const match = ua.match(/OS (\d+)[_-](\d+)/)
  if (!match) return 0
  return parseFloat(`${match[1]}.${match[2]}`)
}

/**
 * Determine device tier based on available hardware info.
 * Uses navigator.deviceMemory, hardwareConcurrency, and user-agent heuristics.
 */
function getDeviceTier(): DeviceTier {
  // Low-end device heuristics
  const isLowEnd =
    // Check device memory API (Chrome)
    ('deviceMemory' in navigator && (navigator as any).deviceMemory <= 2) ||
    // Check for low CPU cores
    ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency <= 4) ||
    // iPhone SE, older iPhone models
    /iPhone [5-8]|iPhone SE|iPod/.test(navigator.userAgent) ||
    // Low-end Android
    /Android.*(Moto [CEG]|Galaxy J|Galaxy A0)/.test(navigator.userAgent)

  if (isLowEnd) return 'low'

  // High-end device heuristics
  const isHighEnd =
    ('deviceMemory' in navigator && (navigator as any).deviceMemory >= 8) ||
    ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency >= 8) ||
    /iPhone (1[5-9]|Pro|Max)/.test(navigator.userAgent) ||
    /iPad Pro/.test(navigator.userAgent) ||
    /Android.*(Galaxy S2[3-9]|Pixel [8-9]|OnePlus 1[2-9])/.test(navigator.userAgent)

  if (isHighEnd) return 'high'

  return 'mid'
}

/**
 * Check for iOS status bar / notch by reading computed safe area.
 * Called once at initialization — safe-area-inset-top for a notched
 * iPhone is typically 44–59px, while non-notched is 0–20px.
 */
function detectNotch(): boolean {
  const div = document.createElement('div')
  div.style.cssText = 'padding-top: env(safe-area-inset-top, 0px); position: absolute; visibility: hidden;'
  document.body.appendChild(div)
  const computed = parseInt(getComputedStyle(div).paddingTop, 10)
  document.body.removeChild(div)
  return computed > 20
}

let notchCache: boolean | null = null

/**
 * Hook that provides platform information for responsive/mobile-aware components.
 * Detects iOS, Android, PWA standalone mode, and safe area insets.
 */
export function usePlatform(): PlatformInfo {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const platform: Platform = isIOS ? 'ios' : isAndroid ? 'android' : 'web'
  const pwaState: PWAState = isStandalone ? 'standalone' : 'browser'
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Compute safe area insets from CSS env() variables
  const getSafeArea = (variable: string): number => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable)
    const match = value.match(/(\d+)px/)
    return match ? parseInt(match[1], 10) : 0
  }

  // Detect notch — cache result since it won't change
  if (notchCache === null) {
    // Only detect on iOS to avoid false positives from CSS env() in unsupported browsers
    notchCache = isIOS ? detectNotch() : false
  }

  return {
    platform,
    pwaState,
    isMobile: isIOS || isAndroid,
    isTouchDevice,
    isReducedMotion,

    // OS/Browser
    isIOS,
    isAndroid,
    isSafari,
    iOSVersion: parseIOSVersion(ua),

    // PWA
    isPWA: isStandalone,
    isStandalone,

    // Hardware
    hasNotch: notchCache ?? false,
    hasMediaSession: 'mediaSession' in navigator,
    hasVibrate: 'vibrate' in navigator,
    hasHaptic: false, // iOS doesn't expose haptic API to web; reserved for future use
    deviceTier: getDeviceTier(),

    // Safe areas
    safeAreaInsets: {
      top: getSafeArea('--safe-area-top'),
      bottom: getSafeArea('--safe-area-bottom'),
      left: getSafeArea('--safe-area-left'),
      right: getSafeArea('--safe-area-right'),
    },
  }
}

export default usePlatform
