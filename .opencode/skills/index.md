# Skill Registry

> Reusable skills — loaded by agents when their task matches the skill trigger.

---

## Skill Inventory

| # | Skill | Domain | Agents that use it |
|---|-------|--------|-------------------|
| 1 | [react-component-architecture](./react-component-architecture.md) | Components | ui-agent, frontend-agent, refactor-agent |
| 2 | [framer-motion-patterns](./framer-motion-patterns.md) | Animation | motion-agent, ui-agent |
| 3 | [mobile-safe-area-handling](./mobile-safe-area-handling.md) | Mobile | mobile-ux-agent, ui-agent |
| 4 | [indexeddb-patterns](./indexeddb-patterns.md) | Storage | offline-storage-agent, frontend-agent |
| 5 | [audio-playback-patterns](./audio-playback-patterns.md) | Audio | audio-engine-agent |
| 6 | [pwa-cache-strategies](./pwa-cache-strategies.md) | PWA | pwa-agent |
| 7 | [bun-package-management](./bun-package-management.md) | Tooling | architecture-agent, deployment-agent |
| 8 | [accessibility-auditing](./accessibility-auditing.md) | A11y | accessibility-agent, code-review-agent |
| 9 | [animation-performance](./animation-performance.md) | Performance | performance-agent, motion-agent |
| 10 | [touch-gesture-patterns](./touch-gesture-patterns.md) | Mobile | mobile-ux-agent, ui-agent |
| 11 | [tailwind-design-tokens](./tailwind-design-tokens.md) | Design | design-system-agent, ui-agent |
| 12 | [zustand-patterns](./zustand-patterns.md) | State | state-management-agent, frontend-agent |
| 13 | [conventional-commits](./conventional-commits.md) | Git | ALL agents (on commit) |

---

## Skill Loading Rule

Skills are loaded **when needed**, not pre-loaded.

Trigger conditions:
- Agent's task description matches skill name
- Agent's workflow step references the skill
- Agent explicitly requests the skill

Multiple skills can be loaded concurrently if their concerns are orthogonal.
