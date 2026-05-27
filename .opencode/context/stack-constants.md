# Stack Constants

> **IMMUTABLE** — Changes require architecture-agent approval.

---

## Mandatory Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Runtime | Bun | Speed, built-in TS, package manager |
| Framework | React 18+ | Component model, ecosystem |
| Language | TypeScript (strict) | Type safety, DX |
| Bundler | Vite | Fast HMR, PWA plugin |
| Styling | TailwindCSS v3+ | Utility-first, perf, consistency |
| Animation | Framer Motion | Declarative, layout animations, gestures |
| State | Zustand | Lightweight, no boilerplate, performant |
| Storage | Dexie.js | IndexedDB wrapper, reactive queries |
| PWA | vite-plugin-pwa | SW injection, manifest, precaching |

---

## Forbidden Technologies

| Technology | Why |
|------------|-----|
| npm | Use bun instead |
| Redux | Zustand is lighter and sufficient |
| styled-components | TailwindCSS covers all styling needs |
| jQuery | Not needed with React |
| Moment.js | Use native Date or date-fns if necessary |
| Axios | Use native fetch (modern, smaller) |
| Next.js | This is a client-side PWA, not SSR |

---

## Required Tooling Versions

| Tool | Min Version | Notes |
|------|-------------|-------|
| Bun | 1.2+ | Runtime + package manager |
| Node | 22+ | Only for tooling, not runtime |
| TypeScript | 5.5+ | strict mode required |
| Vite | 6+ | Use vite.config.ts |

---

## Build Targets

| Target | Browser | Modern Features |
|--------|---------|-----------------|
| Mobile | Chrome Android 120+, Safari iOS 17+ | SW support, AudioContext, IndexedDB |
| Desktop | Chrome 120+, Firefox 120+, Safari 17+ | Same baseline |

---

## Performance Budgets

| Metric | Target | Enforced by |
|--------|--------|-------------|
| Initial bundle (gzip) | < 100 KB | performance-agent |
| Lighthouse Performance | > 90 | performance-agent |
| Lighthouse PWA | > 90 | pwa-agent |
| Lighthouse Accessibility | > 95 | accessibility-agent |
| Animation FPS | 60 fps | motion-agent |
| Time to Interactive | < 2s | performance-agent |
