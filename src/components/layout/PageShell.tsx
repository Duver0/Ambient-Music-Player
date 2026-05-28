import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useVisualViewport } from '@/hooks/useVisualViewport'

interface PageShellProps {
  /** Top header/navigation bar. */
  header?: ReactNode
  /** Main page content. */
  children: ReactNode
  /** Bottom navigation bar. */
  bottomNav?: ReactNode
  /** Mini player (replaces bottomNav in player mode). */
  miniPlayer?: ReactNode
  /** Fullscreen mode hides headers and nav. */
  isFullscreen?: boolean
  /** Additional className for the shell. */
  className?: string
}

/**
 * PageShell — Layout wrapper for page structure.
 *
 * Tier 5 — DUMB component (layout).
 * Owns the page structure: header, content area, and bottom navigation.
 * Handles safe areas and responsive layout via dvh.
 * Integrates visualViewport for keyboard-avoidance on iOS.
 * NO business logic — purely structural.
 */
export function PageShell({
  header,
  children,
  bottomNav,
  miniPlayer,
  isFullscreen = false,
  className,
}: PageShellProps) {
  // Track iOS visual viewport for keyboard handling
  const { isKeyboardVisible, height: viewportHeight } = useVisualViewport()

  return (
    <div
      className={cn(
        'flex flex-col bg-ambient-900',
        isFullscreen && 'bg-ambient-950',
        !isKeyboardVisible && 'h-dvh',
        className,
      )}
      style={
        isKeyboardVisible
          ? { height: viewportHeight, overflow: 'hidden' }
          : undefined
      }
    >
      {/* Render children with keyboard-aware wrapper */}
      {isKeyboardVisible ? (
        <div className="flex flex-col h-full overflow-hidden">
          <KeyboardAwareContent>
            {header && !isFullscreen && (
              <div className="z-sticky shrink-0">{header}</div>
            )}
            <MainContent>{children}</MainContent>
          </KeyboardAwareContent>
        </div>
      ) : (
        <>
          {/* Header — hidden in fullscreen */}
          {!isFullscreen && header && (
            <div className="z-sticky shrink-0">{header}</div>
          )}

          {/* Main content — flex-1 to fill remaining space */}
          <MainContent>{children}</MainContent>
        </>
      )}

      {/* Bottom section: mini player above bottom nav (both visible when present) */}
      {!isKeyboardVisible && (
        <div className="z-nav shrink-0 flex flex-col">
          {miniPlayer}
          {bottomNav}
        </div>
      )}
    </div>
  )
}

/**
 * Scrollable main content area.
 * touch-action: pan-y prevents horizontal gesture conflicts (iOS back-swipe).
 */
function MainContent({ children }: { children: ReactNode }) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto overscroll-behavior-contain',
        'scroll-smooth touch-pan-y',
      )}
    >
      {children}
    </main>
  )
}

/**
 * Wrapper used when keyboard is visible — scrolls child content into view
 * and prevents fixed bottom bars from overlapping the keyboard.
 */
function KeyboardAwareContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {children}
    </div>
  )
}

export default PageShell
