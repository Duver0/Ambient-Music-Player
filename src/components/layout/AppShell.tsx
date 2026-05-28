import { lazy, Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useUIStore, type ActiveTab } from '@/stores/ui-store'
import { usePlayerStore } from '@/stores/player-store'
import { restoreImportedAudio } from '@/services/import/track-importer'
import { PageShell } from './PageShell'

const BottomNav = lazy(() => import('./BottomNav').then((m) => ({ default: m.BottomNav })))
const MiniPlayer = lazy(() => import('@/features/player/components/MiniPlayer').then((m) => ({ default: m.MiniPlayer })))

const PageTransition = lazy(() =>
  import('@/components/motion/PageTransition').then((m) => ({ default: m.PageTransition })),
)

/**
 * AppShell — Main application layout wrapper.
 *
 * Tier 5 — SMART layout component (connects to stores for conditional UI).
 * Wraps all pages with the PageShell layout, providing:
 *   - Bottom navigation (BottomNav) for tab switching
 *   - Mini player bar (MiniPlayer) when a track plays and user is not on player tab
 *   - Fullscreen mode support
 *
 * Syncs activeTab state with the current URL route.
 */
export function AppShell() {
  const activeTab = useUIStore((s) => s.activeTab)
  const isFullscreen = useUIStore((s) => s.isFullscreen)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const currentTrack = usePlayerStore((s) => s.currentTrack)

  const location = useLocation()
  const navigate = useNavigate()

  // Restore imported audio blob URLs on app start
  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    restoreImportedAudio()
  }, [])

  // Sync activeTab with URL on route changes
  useEffect(() => {
    const path = location.pathname
    const tabFromPath: ActiveTab =
      path === '/' ? 'player' : (path.slice(1) as ActiveTab)
    if (tabFromPath !== activeTab) {
      setActiveTab(tabFromPath)
    }
  }, [location.pathname, activeTab, setActiveTab])

  const handleTabChange = (tab: ActiveTab) => {
    navigate({ to: tab === 'player' ? '/' : `/${tab}`, replace: true })
  }

  // Mini player replaces bottom nav when a track is playing and user is not
  // on the player tab. Fullscreen hides everything.
  const hasTrack = currentTrack !== null
  const showMiniPlayer = !isFullscreen && activeTab !== 'player' && hasTrack
  const showBottomNav = !isFullscreen && !showMiniPlayer

  return (
    <PageShell
      isFullscreen={isFullscreen}
      bottomNav={
        showBottomNav ? (
          <Suspense fallback={<div className="h-16 safe-area-footer bg-ambient-900" />}>
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          </Suspense>
        ) : undefined
      }
      miniPlayer={showMiniPlayer ? (
        <Suspense fallback={<div className="h-16 safe-area-footer bg-glass-200" />}>
          <MiniPlayer />
        </Suspense>
      ) : undefined}
    >
      <Suspense fallback={<div className="flex-1" />}>
        <PageTransition routeKey={location.pathname}>
          <Outlet />
        </PageTransition>
      </Suspense>
    </PageShell>
  )
}

export default AppShell
