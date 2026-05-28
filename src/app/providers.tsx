import { lazy, Suspense, type ReactNode } from 'react'

const PwaProvider = lazy(() => import('@/components/pwa/PwaProvider').then((m) => ({ default: m.PwaProvider })))

interface ProvidersProps {
  children: ReactNode
}

/**
 * Application-level context providers.
 * Wraps the app with all required providers for theme, audio, and other services.
 *
 * The design-system-agent, audio-engine-agent, and other agents will
 * populate these providers with actual implementations.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {/* ThemeProvider — added by design-system-agent */}
      {/* AudioProvider — added by audio-engine-agent */}
      <Suspense fallback={<>{children}</>}>
        <PwaProvider>
          {children}
        </PwaProvider>
      </Suspense>
    </>
  )
}
