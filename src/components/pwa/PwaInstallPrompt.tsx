import { useState, useEffect, useCallback } from 'react'
import { getInstallState, promptInstall, setCooldown } from '@/pwa/install'

/**
 * Non-intrusive bottom banner suggesting PWA installation.
 *
 * - Android/Chrome: triggers the native beforeinstallprompt
 * - iOS: shows instructions for "Add to Home Screen"
 * - Dismiss sets a 30-day cooldown
 */
export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const state = getInstallState()
    setIsIOS(state.isIOS)

    // Show the prompt if conditions are met
    if (state.shouldPrompt) {
      // Small delay so the app renders first
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      // On iOS, we can't prompt programmatically — just dismiss
      // The user needs to use Safari's "Add to Home Screen"
      setVisible(false)
      setCooldown()
      return
    }

    // Android/Chrome: trigger native install prompt
    const accepted = await promptInstall()
    if (accepted) {
      setVisible(false)
    } else {
      // User dismissed the native prompt — set cooldown
      setVisible(false)
      setCooldown()
    }
  }, [isIOS])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    setCooldown()
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-toast p-sp-4 animate-slide-up">
      <div className="glass-elevated rounded-xl p-sp-4 mx-auto max-w-md">
        <div className="flex items-start gap-sp-3">
          {/* App icon */}
          <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 192 192" fill="none">
              <rect x="52" y="76" width="12" height="40" rx="6" fill="#6366f1" opacity="0.6" />
              <rect x="74" y="64" width="12" height="64" rx="6" fill="#6366f1" opacity="0.8" />
              <rect x="96" y="52" width="12" height="88" rx="6" fill="#6366f1" />
              <rect x="118" y="64" width="12" height="64" rx="6" fill="#6366f1" opacity="0.8" />
              <rect x="140" y="76" width="12" height="40" rx="6" fill="#6366f1" opacity="0.6" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm font-medium">
              Install Ambient Player
            </p>
            <p className="text-text-secondary text-xs mt-1 leading-relaxed">
              {isIOS
                ? 'Tap Share → Add to Home Screen for fullscreen & offline playback.'
                : 'Install for the best experience — fullscreen, offline, and more.'}
            </p>

            {isIOS && (
              <div className="flex items-center gap-sp-2 mt-2 text-accent-primary text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>Share button is at the bottom of Safari</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-sp-3 mt-sp-3">
          <button
            onClick={handleDismiss}
            className="text-text-tertiary text-xs font-medium px-sp-4 py-sp-2 min-h-[44px] rounded-lg hover:text-text-secondary transition-colors flex items-center justify-center"
            type="button"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="bg-accent-primary text-white text-xs font-semibold px-sp-5 py-sp-2 min-h-[44px] rounded-lg hover:bg-accent-primary/90 transition-colors flex items-center justify-center"
            type="button"
          >
            {isIOS ? 'Show Instructions' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  )
}
