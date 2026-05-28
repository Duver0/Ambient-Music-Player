import { useState, useEffect, useCallback } from 'react'
import { getUpdateState, skipWaitingAndReload, dismissUpdate } from '@/pwa/update'

/**
 * Toast-like banner when a service worker update is available.
 *
 * Displays a small banner at the top of the screen when a new version
 * has been installed and is waiting to be activated.
 */
export function PwaUpdatePrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check initial state
    const state = getUpdateState()
    if (state.available) {
      setVisible(true)
    }

    // Set up a polling interval to check for updates
    // (the SW update check happens on page navigation, but in an SPA
    // with hash routing we may need to poll)
    const interval = setInterval(() => {
      const current = getUpdateState()
      if (current.available) {
        setVisible(true)
      }
    }, 30000) // check every 30s

    return () => clearInterval(interval)
  }, [])

  const handleUpdate = useCallback(async () => {
    setVisible(false)
    await skipWaitingAndReload()
  }, [])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    dismissUpdate()
    // Re-check in 5 minutes
    setTimeout(() => {
      const state = getUpdateState()
      if (state.available) {
        setVisible(true)
      }
    }, 5 * 60 * 1000)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-toast safe-area-top animate-slide-down">
      <div className="glass-default mx-sp-4 mt-sp-4 rounded-xl px-sp-4 py-sp-3 flex items-center gap-sp-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-primary"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-medium">
            Update available
          </p>
          <p className="text-text-secondary text-xs mt-0.5">
            A new version is ready. Tap to refresh.
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={handleUpdate}
          className="bg-accent-primary text-white text-xs font-semibold px-sp-4 py-sp-2 min-h-[44px] rounded-lg hover:bg-accent-primary/90 transition-colors shrink-0 flex items-center justify-center"
          type="button"
        >
          Update
        </button>
        <button
          onClick={handleDismiss}
          className="text-text-tertiary hover:text-text-secondary transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          type="button"
          aria-label="Dismiss update prompt"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
