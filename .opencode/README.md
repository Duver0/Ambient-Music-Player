# .opencode — Multi-Agent System Architecture

> Ambient Music Player + Focus Experience
> AI-Assisted Development Framework

---

## Directory Map

```
.opencode/
├── README.md              # ← You are here. System overview & quickstart.
├── agents/                # Agent specifications (roles, boundaries, ownership)
│   ├── index.md           # Agent registry & responsibility matrix
│   ├── architecture-agent.md
│   ├── frontend-agent.md
│   ├── ui-agent.md
│   ├── motion-agent.md
│   ├── design-system-agent.md
│   ├── state-management-agent.md
│   ├── audio-engine-agent.md
│   ├── offline-storage-agent.md
│   ├── pwa-agent.md
│   ├── performance-agent.md
│   ├── mobile-ux-agent.md
│   ├── accessibility-agent.md
│   ├── testing-agent.md
│   ├── code-review-agent.md
│   ├── deployment-agent.md
│   └── refactor-agent.md
├── skills/                # Reusable skill definitions (patterns, anti-patterns)
│   ├── index.md           # Skill registry
│   ├── react-component-architecture.md
│   ├── framer-motion-patterns.md
│   ├── mobile-safe-area-handling.md
│   ├── indexeddb-patterns.md
│   ├── audio-playback-patterns.md
│   ├── pwa-cache-strategies.md
│   ├── bun-package-management.md
│   ├── accessibility-auditing.md
│   ├── animation-performance.md
│   ├── touch-gesture-patterns.md
│   ├── tailwind-design-tokens.md
│   └── zustand-patterns.md
├── workflows/             # Defined development workflows (ordered agent handoffs)
│   ├── index.md
│   ├── feature-development.md
│   ├── bug-fix.md
│   └── refactor.md
├── rules/                 # Governance, authority, anti-chaos policies
│   ├── index.md
│   ├── governance.md      # Ownership hierarchy & conflict resolution
│   ├── hierarchy.md       # Primary / Sub / Audit tier definitions
│   ├── anti-caos.md       # Explicit forbidden patterns
│   └── authority.md       # Technical authority matrix
├── context/               # Frozen project context (immutable once set)
│   ├── project-spec.md    # Project scope & requirements
│   └── stack-constants.md # Immutable tech decisions
└── templates/             # Reusable templates for agents & skills
    ├── agent-template.md
    └── skill-template.md
```

---

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **3-Tier Hierarchy** | Primary agents (human-facing), Sub-agents (agent-facing), Auditors (cross-cutting). |
| **Small agents** | Each agent owns ONE concern. No god agents. |
| **Strict boundaries** | Agents cannot cross into other agents' territory. |
| **Explicit handoffs** | Workflows define exact agent invocation order. |
| **Authority first** | Some agents have veto power over others. |
| **Context frozen** | `context/` is immutable. Changes need architecture-agent approval. |
| **Skills over prompts** | Reusable skills prevent repetitive instructions. |

---

## Agent Hierarchy (3 Tiers)

```
                    ┌──────────────────────────┐
                    │        YOU (Human)        │
                    │  Interacts ONLY with      │
                    │     Tier 1 agents         │
                    └────────────┬─────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     │                           │                           │
     ▼                           ▼                           ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  TIER 1          │   │  TIER 1          │   │  TIER 1          │
│  PRIMARY         │   │  PRIMARY         │   │  PRIMARY         │
│  (human-facing)  │   │  (human-facing)  │   │  (human-facing)  │
│                  │   │                  │   │                  │
│ architecture-    │   │ frontend-        │   │ design-system-   │
│ agent            │   │ agent            │   │ agent            │
│ audio-engine-    │   │ pwa-agent        │   │ deployment-      │
│ agent            │   │                  │   │ agent            │
└──────────────────┘   └──────┬───────────┘   └──────────────────┘
                              │ DELEGATES
                              ▼
                    ┌──────────────────────┐
                    │  TIER 2              │
                    │  SUB-AGENTS          │
                    │  (agent-facing only) │
                    │                      │
                    │  frontend-agent's    │
                    │  sub-agents:         │
                    │  ├─ state-mgmt-agent │
                    │  └─ ui-agent         │
                    │       ├─ motion-agent│
                    │       └─ mobile-ux   │
                    │                      │
                    │  pwa-agent's sub:    │
                    │  └─ offline-storage  │
                    └──────────────────────┘

     ┌────────────────────────────────────────────────────────┐
     │  TIER 3                                                │
     │  CROSS-CUTTING AUDITORS                                │
     │  (audit any tier, can VETO)                            │
     │                                                        │
     │  performance-agent  (veto power)                       │
     │  accessibility-agent (veto power)                      │
     │  testing-agent                                         │
     │  code-review-agent  (advisory)                         │
     │  refactor-agent                                        │
     └────────────────────────────────────────────────────────┘
```

---

## Tier System

| Tier | Name | Interacts with | Count |
|------|------|---------------|-------|
| **Tier 1** | **Primary Agents** | **YOU (the human)** → assign tasks directly | 6 |
| **Tier 2** | **Sub-Agents** | Only their parent Tier 1 agent | 5 |
| **Tier 3** | **Cross-cutting Auditors** | All tiers (audit, veto, review) | 5 |

**Rule:** You never talk to Tier 2 or Tier 3 agents directly. You talk to their parent Tier 1 agent, who delegates.

---

## Agent Overview

### Tier 1 — You talk to THESE agents

| Agent | You say | It delegates to |
|-------|---------|-----------------|
| [architecture-agent](./agents/architecture-agent.md) | "Set up the project structure" | — |
| [frontend-agent](./agents/frontend-agent.md) | "Build the player page" | state-management-agent, ui-agent |
| [design-system-agent](./agents/design-system-agent.md) | "Define the dark theme" | — |
| [audio-engine-agent](./agents/audio-engine-agent.md) | "Implement audio playback" | — |
| [pwa-agent](./agents/pwa-agent.md) | "Make this work offline" | offline-storage-agent |
| [deployment-agent](./agents/deployment-agent.md) | "Set up CI/CD" | — |

### Tier 2 — Sub-agents (you DON'T talk to them)

| Agent | Reports to | Purpose |
|-------|-----------|---------|
| [ui-agent](./agents/ui-agent.md) | frontend-agent | Visual layer |
| [motion-agent](./agents/motion-agent.md) | ui-agent | Animation |
| [mobile-ux-agent](./agents/mobile-ux-agent.md) | ui-agent | Mobile polish |
| [state-management-agent](./agents/state-management-agent.md) | frontend-agent | Stores |
| [offline-storage-agent](./agents/offline-storage-agent.md) | pwa-agent | Data persistence |

### Tier 3 — Auditors (cross-cutting, can VETO)

| Agent | Scope | Power |
|-------|-------|-------|
| [performance-agent](./agents/performance-agent.md) | All tiers | **VETO** |
| [accessibility-agent](./agents/accessibility-agent.md) | All tiers | **VETO** |
| [testing-agent](./agents/testing-agent.md) | All tiers | Standard |
| [code-review-agent](./agents/code-review-agent.md) | All tiers | Advisory |
| [refactor-agent](./agents/refactor-agent.md) | All tiers | Standard |

---

## How You Interact With Agents

```
YOU: "Hey frontend-agent, build the music player page"
  │
  ▼
frontend-agent (Tier 1) receives your task
  │
  ├── Delegates to state-management-agent (Tier 2): "Design the player store"
  │     └── state-management-agent returns store files
  │
  ├── Delegates to ui-agent (Tier 2): "Style the player"
  │     ├── ui-agent delegates to motion-agent (Tier 2): "Add animations"
  │     └── ui-agent delegates to mobile-ux-agent (Tier 2): "Mobile polish"
  │
  ├── Implements feature logic
  │
  ├── Sends to accessibility-agent (Tier 3): "Audit this"
  ├── Sends to performance-agent (Tier 3): "Audit this"
  ├── Sends to testing-agent (Tier 3): "Test this"
  │
  └── Returns result to YOU
```

See [rules/hierarchy.md](./rules/hierarchy.md) for detailed tier rules.

---

## Quickstart Workflow (Human View)

What YOU say to each Tier 1 agent:

```
1. architecture-agent     → "Set up src/ structure and dependencies"
2. design-system-agent    → "Define the visual theme and tokens"
3. pwa-agent              → "Configure PWA and offline strategy"
4. deployment-agent       → "Set up build and CI/CD"
5. frontend-agent         → "Build the player page" *
6. audio-engine-agent     → "Implement audio playback engine"
7. performance-agent      → "Audit performance" (Tier 3)
8. accessibility-agent    → "Audit accessibility" (Tier 3)
```

*frontend-agent internally delegates:
  → state-management-agent (stores)
  → ui-agent (visuals) → motion-agent (animation) → mobile-ux-agent (mobile)

---

## Anti-Caos Rules (Summary)

| Rule | Enforced by |
|------|-------------|
| No god agents | architecture-agent |
| No files > 300 lines | code-review-agent |
| No components > 200 lines | code-review-agent |
| No animation on mount | performance-agent |
| No UI logic in audio engine | audio-engine-agent |
| No audio logic in UI | ui-agent |
| No context hell | state-management-agent |
| No premature optimization | architecture-agent |
| No npm (use bun only) | architecture-agent |
| Tier 2 agents NEVER talk to human | architecture-agent |

Full rules: [rules/anti-caos.md](./rules/anti-caos.md)

---

## Evolution

This system is living. If an agent is found:
- **Too large** → split into more specialized agents
- **Unnecessary** → merge into a parent
- **Missing** → create with full spec

Changes to `agents/`, `rules/`, `workflows/` require **architecture-agent** approval.
