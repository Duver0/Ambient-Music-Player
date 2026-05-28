import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'

// Lazy-load pages for code splitting
const PlayerPage = lazy(() => import('@/pages/PlayerPage'))
const LibraryPage = lazy(() => import('@/pages/LibraryPage'))
const FocusPage = lazy(() => import('@/pages/FocusPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

/**
 * Root route — wraps all pages with the AppShell layout.
 * The AppShell provides the PageShell, BottomNav, and MiniPlayer.
 */
const rootRoute = createRootRoute({
  component: () => <AppShell />,
})

/**
 * Player tab route — now playing screen (default).
 */
const playerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/player',
  component: () => (
    <Suspense fallback={null}>
      <PlayerPage />
    </Suspense>
  ),
})

/**
 * Library tab route — tracks and search.
 */
const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: () => (
    <Suspense fallback={null}>
      <LibraryPage />
    </Suspense>
  ),
})

/**
 * Focus tab route — timer and ambient mix.
 */
const focusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/focus',
  component: () => (
    <Suspense fallback={null}>
      <FocusPage />
    </Suspense>
  ),
})

/**
 * Settings tab route — app preferences.
 */
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <Suspense fallback={null}>
      <SettingsPage />
    </Suspense>
  ),
})

/**
 * Index route — redirects to player.
 */
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Suspense fallback={null}>
      <PlayerPage />
    </Suspense>
  ),
})

/**
 * Route tree — defines the navigation hierarchy.
 */
const routeTree = rootRoute.addChildren([
  indexRoute,
  playerRoute,
  libraryRoute,
  focusRoute,
  settingsRoute,
])

/**
 * Application router with hash routing for PWA compatibility.
 */
export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 5000,
})

/**
 * Type-safe router instance for use in components.
 */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
