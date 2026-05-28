/**
 * PWA install prompt handler.
 * Manages install detection, visit tracking, iOS instructions, and cooldown.
 */

import type { Platform } from '@/hooks/usePlatform'

// ── Types ────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export interface InstallState {
  /** Whether the app is installable (beforeinstallprompt fired) */
  canInstall: boolean
  /** Whether the app is already installed as PWA */
  isInstalled: boolean
  /** Whether to show the install prompt (visit count + cooldown met) */
  shouldPrompt: boolean
  /** The detected platform */
  platform: Platform | null
  /** Whether the current device is iOS */
  isIOS: boolean
}

// ── Constants ─────────────────────────────────────────────────────

const STORAGE_KEYS = {
  VISIT_COUNT: 'ambient-pwa-visit-count',
  LAST_DISMISSED: 'ambient-pwa-last-dismissed',
  INSTALLED: 'ambient-pwa-installed',
} as const

const MIN_VISITS_BEFORE_PROMPT = 1
const COOLDOWN_DAYS = 7
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000

// ── State ─────────────────────────────────────────────────────────

let deferredPrompt: BeforeInstallPromptEvent | null = null
let isInstallable = false

// ── Detection ─────────────────────────────────────────────────────

/**
 * Check if the app is running in standalone/PWA mode.
 */
export function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Platform detection for iOS install flow.
 */
export function isIOSDevice(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}

/**
 * Get install state for the UI layer.
 */
export function getInstallState(): InstallState {
  const installed = isInstalled()
  const platform: Platform = isIOSDevice() ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'web'

  return {
    canInstall: isInstallable && deferredPrompt !== null,
    isInstalled: installed,
    shouldPrompt: shouldShowPrompt(installed),
    platform,
    isIOS: isIOSDevice(),
  }
}

// ── Visit Tracking ────────────────────────────────────────────────

/**
 * Increment the visit counter and return the current count.
 */
export function trackVisit(): number {
  const raw = localStorage.getItem(STORAGE_KEYS.VISIT_COUNT)
  const count = raw ? parseInt(raw, 10) + 1 : 1
  localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, String(count))
  return count
}

/**
 * Get the current visit count without incrementing.
 */
export function getVisitCount(): number {
  const raw = localStorage.getItem(STORAGE_KEYS.VISIT_COUNT)
  return raw ? parseInt(raw, 10) : 0
}

// ── Cooldown Management ──────────────────────────────────────────

/**
 * Check if the install prompt cooldown has expired.
 */
function isCooldownExpired(): boolean {
  const lastDismissed = localStorage.getItem(STORAGE_KEYS.LAST_DISMISSED)
  if (!lastDismissed) return true
  const elapsed = Date.now() - parseInt(lastDismissed, 10)
  return elapsed >= COOLDOWN_MS
}

/**
 * Set the cooldown for the install prompt (e.g., on dismiss).
 */
export function setCooldown(): void {
  localStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, String(Date.now()))
}

/**
 * Mark the app as installed (prevents future prompts).
 */
export function markInstalled(): void {
  localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true')
}

/**
 * Check if the app was previously marked as installed.
 */
function wasMarkedInstalled(): boolean {
  return localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true'
}

// ── Prompt Decision ──────────────────────────────────────────────

/**
 * Determine if we should show the install prompt.
 */
function shouldShowPrompt(alreadyInstalled: boolean): boolean {
  // Don't show if already installed
  if (alreadyInstalled) return false
  if (wasMarkedInstalled()) return false

  // Need minimum visits
  if (getVisitCount() < MIN_VISITS_BEFORE_PROMPT) return false

  // Check cooldown
  if (!isCooldownExpired()) return false

  return true
}

// ── Initialization ────────────────────────────────────────────────

/**
 * Initialize the install handler at app startup.
 * Tracks visits and listens for beforeinstallprompt.
 */
export function initInstallHandler(): void {
  // Track this visit
  trackVisit()

  // Listen for the install prompt event (Android/Chrome)
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    isInstallable = true
  })

  // Listen for successful installation
  window.addEventListener('appinstalled', () => {
    isInstallable = false
    deferredPrompt = null
    markInstalled()
  })
}

// ── Install Action ────────────────────────────────────────────────

/**
 * Prompt the user to install the PWA (Android/Chrome).
 * Returns true if the user accepted.
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    // On iOS, just mark installed so we don't keep prompting
    markInstalled()
    return false
  }

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  isInstallable = false

  if (outcome === 'accepted') {
    markInstalled()
    return true
  }

  return false
}

/**
 * Reset all PWA install state (for testing).
 */
export function resetInstallState(): void {
  localStorage.removeItem(STORAGE_KEYS.VISIT_COUNT)
  localStorage.removeItem(STORAGE_KEYS.LAST_DISMISSED)
  localStorage.removeItem(STORAGE_KEYS.INSTALLED)
  deferredPrompt = null
  isInstallable = false
}
