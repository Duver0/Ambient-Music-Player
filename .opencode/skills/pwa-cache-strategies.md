# Skill: PWA Cache Strategies

> Service worker caching patterns for offline-first reliability.

---

## Purpose

Standardize caching strategies for different asset types. Ensure the app works offline while optimizing for storage and freshness.

## Triggers

Loaded when:
- pwa-agent defines service worker strategy
- deployment-agent configures vite-plugin-pwa

## Rules

1. **Strategy per asset type:**

| Asset Type | Strategy | Priority |
|------------|----------|----------|
| App shell (HTML, JS, CSS) | `CacheFirst` (precache) | Critical |
| Static images (icons, logos) | `CacheFirst` | Critical |
| Audio files | `CacheFirst` with quota mgmt | Medium |
| User playlists data | `NetworkFirst` (then cache) | Medium |
| Analytics | `NetworkOnly` (background sync) | Low |
| External fonts | `StaleWhileRevalidate` | Low |

2. **Precache critical assets** — app shell, manifest, fonts
3. **Runtime cache** — audio files (with max size limit per file)
4. **Cache versioning** — version cache names with build hash:
   ```
   ambient-player-v1-precache
   ambient-player-v1-audio
   ```
5. **SW Update flow** — prompt user to update:
   ```ts
   // In main app
   const { needRefresh } = useRegisterSW()
   if (needRefresh) showUpdatePrompt()
   ```
6. **Cleanup** — delete old caches on SW activate
7. **Quota management** — check `navigator.storage.estimate()`

## vite-plugin-pwa Config

```ts
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /\.(mp3|wav|ogg|flac)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'ambient-player-audio',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
  manifest: {
    name: 'Ambient Music Player',
    short_name: 'Ambient',
    theme_color: '#0a0a0a',
    background_color: '#0a0a0a',
    display: 'standalone',
    orientation: 'portrait',
  },
})
```

## Anti-Patterns

- ❌ CacheFirst for dynamic API data (use NetworkFirst)
- ❌ No cache versioning (stale caches accumulate)
- ❌ Caching audio files without size limits
- ❌ Blocking SW install on slow network (use `waitUntil`)
- ❌ Not handling SW update conflicts
- ❌ Caching user-sensitive data
- ❌ Large precache payload (> 1MB initial load)
