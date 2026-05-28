/**
 * PWA service worker update handler.
 * Manages SW registration and update lifecycle.
 *
 * Uses vite-plugin-pwa's auto-registration under the hood.
 * The plugin auto-generates the SW and registers it; this module
 * provides the update detection and user-facing update flow.
 */

// ── Types ────────────────────────────────────────────────────────

export type UpdateCallback = (registration: ServiceWorkerRegistration) => void
export type ErrorCallback = (error: Error) => void

export interface UpdateState {
  /** Whether a SW update is available and waiting */
  available: boolean
  /** The service worker registration (if available) */
  registration: ServiceWorkerRegistration | null
}

// ── State ─────────────────────────────────────────────────────────

let onUpdate: UpdateCallback | null = null
let onError: ErrorCallback | null = null
let registration: ServiceWorkerRegistration | null = null
let updateAvailable = false

// ── Registration ──────────────────────────────────────────────────

/**
 * Register the service worker and set up update detection.
 *
 * vite-plugin-pwa (with registerType: 'autoUpdate') handles SW generation
 * and initial registration. This function provides the manual update
 * detection overlay on top of the auto-generated SW lifecycle.
 */
export async function registerSW(
  updateCallback?: UpdateCallback,
  errorCallback?: ErrorCallback,
): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  onUpdate = updateCallback ?? null
  onError = errorCallback ?? null

  try {
    // vite-plugin-pwa with registerType: 'autoUpdate' generates
    // a self-registering SW. We still attach listeners for the
    // update flow so we can show a prompt to the user.
    const registrations = await navigator.serviceWorker.getRegistrations()

    if (registrations.length > 0) {
      registration = registrations[0]
    } else {
      // Fallback: register manually if the plugin hasn't done so yet
      registration = await navigator.serviceWorker.register('/sw.js')
    }

    // Set up update detection
    setupUpdateDetection(registration)

    // Also listen for controller changes (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // A new SW has taken over — reload to ensure fresh content
      // but only if we were explicitly waiting for an update
    })
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}

// ── Update Detection ──────────────────────────────────────────────

/**
 * Set up listeners on a SW registration to detect updates.
 */
function setupUpdateDetection(reg: ServiceWorkerRegistration): void {
  // Check if there's already a waiting worker
  if (reg.waiting) {
    updateAvailable = true
    onUpdate?.(reg)
  }

  // Listen for new updates
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing
    if (!newWorker) return

    newWorker.addEventListener('statechange', () => {
      if (
        newWorker.state === 'installed' &&
        navigator.serviceWorker.controller
      ) {
        // New version is installed and waiting
        updateAvailable = true
        registration = reg
        onUpdate?.(reg)
      }
    })
  })
}

/**
 * Check for updates manually.
 */
export async function checkForUpdates(): Promise<void> {
  if (!registration) return
  await registration.update()
}

// ── Update Action ────────────────────────────────────────────────

/**
 * Skip the waiting service worker and activate the new version.
 * Call this when the user confirms they want to update.
 */
export async function skipWaitingAndReload(): Promise<void> {
  if (!registration?.waiting) return

  // Post message to skip waiting
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })

  // Wait for the new SW to take control
  await new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      resolve()
    })
  })

  // Reload to activate the new version
  window.location.reload()
}

/**
 * Get the current update state.
 */
export function getUpdateState(): UpdateState {
  return {
    available: updateAvailable,
    registration,
  }
}

/**
 * Reset the update-available flag (e.g., after dismissing the prompt).
 */
export function dismissUpdate(): void {
  updateAvailable = false
}

/**
 * Check if a service worker update is available.
 */
export function isUpdateAvailable(): boolean {
  return updateAvailable
}
