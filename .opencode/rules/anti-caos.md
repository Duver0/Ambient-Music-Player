# Anti-Caos Rules

> Explicit forbidden patterns that prevent technical debt, bloat, and inconsistency.

---

## Structural Rules

| Rule | Threshold | Enforced by |
|------|-----------|-------------|
| Max file size | 300 lines | code-review-agent |
| Max component size | 200 lines | code-review-agent |
| Max store size | 200 lines | code-review-agent |
| Max function size | 50 lines | code-review-agent |
| Max props per component | 8 props | code-review-agent |
| Max nesting depth | 4 levels | code-review-agent |
| One component per file | Strict | code-review-agent |
| No barrel exports (index.ts re-exports everything) | Strict | code-review-agent |

## Duplication Rules

| Rule | Enforced by |
|------|-------------|
| No copy-pasted code blocks > 5 lines | code-review-agent |
| No duplicate Tailwind class patterns (extract component) | code-review-agent |
| No duplicate store patterns (reuse slice) | state-management-agent |
| No duplicate animation variants (use shared constants) | motion-agent |
| No duplicate API patterns (use shared hooks) | frontend-agent |

## State Rules

| Rule | Enforced by |
|------|-------------|
| No storing derived state (compute in selectors) | state-management-agent |
| No storing non-serializable data (AudioContext, DOM) | state-management-agent |
| No Zustand stores > 200 lines (split into slices) | state-management-agent |
| No `useStore()` without selector | state-management-agent |
| No direct IndexedDB access from components | offline-storage-agent |

## Audio Rules

| Rule | Enforced by |
|------|-------------|
| No Web Audio API from UI components | audio-engine-agent |
| No audio logic mixed with component logic | audio-engine-agent |
| No multiple AudioContexts | audio-engine-agent |
| No audio processing on main thread | audio-engine-agent |
| No leaking AudioBufferSource nodes | audio-engine-agent |

## Animation Rules

| Rule | Enforced by |
|------|-------------|
| No animating layout properties (width, height, top, left) | motion-agent |
| No mount animations without exit animations | motion-agent |
| No animations without reduced-motion fallback | accessibility-agent |
| No > 20 animated elements per page | performance-agent |
| No will-change: all (be specific) | motion-agent |

## PWA Rules

| Rule | Enforced by |
|------|-------------|
| No Cache API access outside service worker | pwa-agent |
| No hardcoded cache names (use versioned) | pwa-agent |
| No missing offline fallback | pwa-agent |
| No missing manifest icons | pwa-agent |

## Performance Rules

| Rule | Enforced by |
|------|-------------|
| No premature optimization (profile first) | architecture-agent |
| No library added without perf analysis | architecture-agent |
| No bundle size increase > 5% without approval | performance-agent |
| No layout thrashing patterns | performance-agent |
| No missing lazy loading for routes | performance-agent |

## Anti-Overengineering Rules

| Rule | Enforced by |
|------|-------------|
| No abstraction before 3rd usage | architecture-agent |
| No custom hooks for single-use logic | frontend-agent |
| No store for component-local state | state-management-agent |
| No HOCs when children/fragments suffice | code-review-agent |
| No context providers for props drilling < 3 levels | code-review-agent |
| No TypeScript generics overcomplication | architecture-agent |
| No utility functions for one-liners | code-review-agent |

## Coding Convention Rules

| Rule | Enforced by |
|------|-------------|
| No `any` type (use `unknown`) | code-review-agent |
| No `// eslint-disable-next-line` without justification | code-review-agent |
| No `console.log` in production code | code-review-agent |
| No `TODO` without issue reference | code-review-agent |
| Named exports only (no `export default`) | code-review-agent |
| No import * (named imports only) | code-review-agent |
| Strict TypeScript mode required | architecture-agent |
| No npm usage (use bun) | architecture-agent |
| Human talks ONLY to orchestrator-agent | orchestrator-agent |
| Tier 1/2/3 agents never accept tasks from Human | orchestrator-agent |

## Folder Structure Rules

| Rule | Enforced by |
|------|-------------|
| No empty directories | architecture-agent |
| No flat imports from `src/` (use feature folders) | architecture-agent |
| No files outside defined structure | architecture-agent |
| No `utils/` dumping ground (use specific names) | architecture-agent |
| No `helpers/` (ambiguous — use specific names) | architecture-agent |

## Enforcement

Violations are classified as:

| Severity | Label | Action |
|----------|-------|--------|
| Critical | 🚫 BLOCKER | Must fix before proceeding |
| Major | ⚠️ WARNING | Should fix before deployment |
| Minor | 💡 SUGGESTION | Nice to fix, not blocking |
