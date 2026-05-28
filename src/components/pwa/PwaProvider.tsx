import { type ReactNode, useEffect } from 'react'
import { initInstallHandler } from '@/pwa/install'
import { registerSW } from '@/pwa/update'
import { PwaInstallPrompt } from './PwaInstallPrompt'
import { PwaUpdatePrompt } from './PwaUpdatePrompt'

interface PwaProviderProps {
  children: ReactNode
}

/**
 * PWA provider that initializes install handling and SW registration,
 * and renders the install/update prompt UI components.
 */
export function PwaProvider({ children }: PwaProviderProps) {
  useEffect(() => {
    // Initialize PWA install handler (visit tracking, beforeinstallprompt)
    initInstallHandler()

    // Register service worker with update detection
    registerSW(
      (reg) => {
        // Update callback — the PwaUpdatePrompt component will pick this up
        console.debug('[PWA] Update available via SW registration:', reg)
      },
      (error) => {
        console.error('[PWA] SW registration error:', error)
      },
    )
  }, [])

  return (
    <>
      {children}
      <PwaInstallPrompt />
      <PwaUpdatePrompt />
    </>
  )
}
