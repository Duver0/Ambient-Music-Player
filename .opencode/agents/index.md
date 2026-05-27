# Agent Registry

> Complete listing of all specialized agents in the multi-agent system.

---

## 4-Tier Architecture

| Tier | Name | Interacts with | Count |
|------|------|---------------|-------|
| **0** | **Orchestrator** | **Human (YOU)** — single point of contact | 1 |
| **1** | **Primary Agents** | orchestrator-agent delegates to them | 6 |
| **2** | **Sub-Agents** | Only their parent Tier 1 agent | 5 |
| **3** | **Cross-cutting Auditors** | All tiers, audit & veto | 5 |

---

## Tier 0 — Orchestrator (Your Single Contact)

You ONLY talk to the orchestrator-agent. It receives your tasks, routes them to the correct domain agents, manages handoffs, and reports back.

| Agent | You say | It routes to |
|-------|---------|-------------|
| [orchestrator-agent](./orchestrator-agent.md) | "Build the music player" | Appropriate Tier 1 agents |

---

## Tier 1 — Primary Agents (Agent Interface)

The orchestrator-agent delegates to these agents. They own a domain and may delegate sub-tasks to their Tier 2 sub-agents.

| Agent | Domain | orchestrator says | Delegates to | Authority |
|-------|--------|------------------|-------------|-----------|
| [architecture-agent](./architecture-agent.md) | Structure | "Set up project structure" | — | **SUPREME** |
| [frontend-agent](./frontend-agent.md) | Features | "Build the player page" | state-management-agent, ui-agent | HIGH |
| [design-system-agent](./design-system-agent.md) | Design | "Define the dark theme" | — | HIGH |
| [audio-engine-agent](./audio-engine-agent.md) | Audio | "Implement audio playback" | — | HIGH |
| [pwa-agent](./pwa-agent.md) | PWA | "Make this work offline" | offline-storage-agent | HIGH |
| [deployment-agent](./deployment-agent.md) | Release | "Set up CI/CD" | — | HIGH |

---

## Tier 2 — Sub-Agents (Agent Interface Only)

You NEVER talk to these agents directly. They only receive tasks from their parent Tier 1 agent.

| Agent | Domain | Reports to | Sub-agents of its own |
|-------|--------|-----------|----------------------|
| [ui-agent](./ui-agent.md) | Visual | frontend-agent | motion-agent, mobile-ux-agent |
| [motion-agent](./motion-agent.md) | Animation | ui-agent | — |
| [mobile-ux-agent](./mobile-ux-agent.md) | Mobile | ui-agent | — |
| [state-management-agent](./state-management-agent.md) | State | frontend-agent | — |
| [offline-storage-agent](./offline-storage-agent.md) | Storage | pwa-agent | — |

---

## Tier 3 — Cross-cutting Auditors

These agents audit work from ANY tier. They can veto, review, test, or refactor across the entire system.

| Agent | Domain | Scope | Power |
|-------|--------|-------|-------|
| [performance-agent](./performance-agent.md) | Performance | All tiers | **VETO** |
| [accessibility-agent](./accessibility-agent.md) | A11y | All tiers | **VETO** |
| [testing-agent](./testing-agent.md) | Tests | All tiers | Standard |
| [code-review-agent](./code-review-agent.md) | Quality | All tiers | Advisory |
| [refactor-agent](./refactor-agent.md) | Cleanup | All tiers | Standard |

---

## Responsibility Matrix (All Agents)

| # | Agent | Tier | Owns | Authority |
|---|-------|------|------|-----------|
| 0 | [orchestrator-agent](./orchestrator-agent.md) | **T0** | Task routing, workflow coordination, handoffs | **COORDINATOR** |
| 1 | [architecture-agent](./architecture-agent.md) | **T1** | Project structure, dependencies, tech stack | **SUPREME** |
| 2 | [frontend-agent](./frontend-agent.md) | **T1** | Feature implementation, data flow, routing | HIGH |
| 3 | [design-system-agent](./design-system-agent.md) | **T1** | Theme, tokens, design primitives | HIGH |
| 4 | [audio-engine-agent](./audio-engine-agent.md) | **T1** | Web Audio API, playback engine | HIGH |
| 5 | [pwa-agent](./pwa-agent.md) | **T1** | SW, manifest, caching | HIGH |
| 6 | [deployment-agent](./deployment-agent.md) | **T1** | Build, CI/CD, deploy | HIGH |
| 7 | [ui-agent](./ui-agent.md) | **T2** | Components, layout, responsive, styling | HIGH |
| 8 | [motion-agent](./motion-agent.md) | **T2** | Framer Motion, transitions, gestures | MEDIUM |
| 9 | [mobile-ux-agent](./mobile-ux-agent.md) | **T2** | Touch, safe areas, HIG | HIGH |
| 10 | [state-management-agent](./state-management-agent.md) | **T2** | Zustand stores, state shape | HIGH |
| 11 | [offline-storage-agent](./offline-storage-agent.md) | **T2** | Dexie schemas, IndexedDB | HIGH |
| 12 | [performance-agent](./performance-agent.md) | **T3** | Bundle, runtime, FPS | **VETO** |
| 13 | [accessibility-agent](./accessibility-agent.md) | **T3** | ARIA, keyboard, screen readers | **VETO** |
| 14 | [testing-agent](./testing-agent.md) | **T3** | Unit, integration, e2e | MEDIUM |
| 15 | [code-review-agent](./code-review-agent.md) | **T3** | Code audit, conventions | ADVISORY |
| 16 | [refactor-agent](./refactor-agent.md) | **T3** | Tech debt, code structure | MEDIUM |

---

## Agent Interaction Map (Tiered)

```
                     ┌──────────────────────────┐
                     │        HUMAN (YOU)        │
                     │  Assigns tasks ONLY to    │
                     │    orchestrator-agent     │
                     └────────────┬─────────────┘
                                  │
                     ┌────────────┴────────────┐
                     │  orchestrator-agent     │
                     │  (Tier 0 — routes tasks)│
                     └────────────┬────────────┘
                                  │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
   ┌──────────────┐     ┌──────────────────┐    ┌──────────────────┐
   │ architecture │     │   frontend-agent │    │ design-system    │
   │    agent     │     │     (Tier 1)     │    │    agent (T1)    │
   │  (Tier 1)   │     └────────┬─────────┘    └──────────────────┘
   └──────────────┘              │
                                 │ delegates to
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
           ┌──────────────┐ ┌────────┐ ┌────────────┐
           │ state-mgmt   │ │  ui-   │ │  motion-   │
           │ agent (T2)   │ │ agent  │ │  agent     │
           └──────────────┘ │ (T2)   │ │  (T2)      │
                            └──┬─────┘ └────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
           ┌──────────────┐   ┌──────────────────┐
           │  motion-     │   │  mobile-ux-      │
           │  agent (T2)  │   │  agent (T2)      │
           └──────────────┘   └──────────────────┘

   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
   │ audio-engine │     │  pwa-agent   │     │  deployment-     │
   │ agent (T1)   │     │  (Tier 1)    │     │  agent (T1)      │
   └──────────────┘     └──────┬───────┘     └──────────────────┘
                               │ delegates to
                               ▼
                      ┌──────────────────┐
                      │ offline-storage  │
                      │ agent (T2)       │
                      └──────────────────┘

   ┌────────────────────────────────────────────────────────────┐
   │  TIER 3 — Cross-cutting Auditors                           │
   │  (orchestrator-agent requests audits)                     │
   │                                                            │
   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
   │  │ performance  │  │ accessibil-  │  │  testing-agent   │ │
   │  │ agent (VETO) │  │ ity (VETO)   │  │                  │ │
   │  └──────────────┘  └──────────────┘  └──────────────────┘ │
   │  ┌──────────────┐  ┌──────────────┐                        │
   │  │ code-review  │  │ refactor-    │                        │
   │  │ agent (ADV)  │  │ agent        │                        │
   │  └──────────────┘  └──────────────┘                        │
   └────────────────────────────────────────────────────────────┘
```

---

## Handoff Protocol

All agent handoffs must include:
1. **Context summary** — what was done
2. **Decisions made** — key choices
3. **Open questions** — unresolved items
4. **Files touched** — explicit file list
5. **Validation** — pass/fail of own checks

Handoff format:
```
## Handoff: <agent-name> → <next-agent>

Context:
  - <summary>

Decisions:
  - <decision>

Open Questions:
  - <question>

Files:
  - <path/to/file.ts>

Validation:
  - ✅ own checks passed
  - ⚠️ known concerns
```

---

## Tier Communication Rules

| From | To | Method | Allowed? |
|------|----|--------|----------|
| Human | Tier 0 (orchestrator) | Task assignment | ✅ **YES — ONLY valid path** |
| Human | Tier 1 | Direct task assignment | ❌ **NO** (must go through orchestrator) |
| Human | Tier 2 | Direct task assignment | ❌ **NO** |
| Human | Tier 3 | Direct audit request | ❌ **NO** |
| Tier 0 | Tier 1 | Task delegation | ✅ YES |
| Tier 1 | Tier 2 | Task delegation | ✅ YES |
| Tier 1 | Tier 0 | Report results | ✅ YES |
| Tier 2 | Tier 2 | Peer collaboration | ✅ YES (via handoff, same parent) |
| Tier 2 | Tier 1 | Report results | ✅ YES |
| Tier 2 | Tier 0 | Report results | ✅ YES |
| Tier 2 | Human | Direct report | ❌ **NO** |
| Tier 3 | Any tier | Audit request | ✅ YES |
| Any tier | Tier 3 | Audit request | ✅ YES |

Full hierarchy rules: [rules/hierarchy.md](../rules/hierarchy.md)
