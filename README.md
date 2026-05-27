# Ambient Music Player + Focus Experience

> PWA mobile-first — cinematic, offline-first, premium UX.
> AI-Assisted Development via [OpenCode](https://opencode.ai) Multi-Agent System.

---

## Directory Map

```
.opencode/
├── README.md              # System overview & quickstart
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

src/                       # Application source (bootstrap from .opencode/agents)
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
| **Context frozen** | `.opencode/context/` is immutable. Changes need architecture-agent approval. |
| **Skills over prompts** | Reusable skills prevent repetitive instructions. |

---

## Agent Hierarchy (4 Tiers)

```
                    ┌──────────────────────────┐
                    │        YOU (Human)        │
                    │  Interacts ONLY with      │
                    │   orchestrator-agent      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ TIER 0 — ORCHESTRATOR   │
                    │ orchestrator-agent      │
                    │ (routes tasks, manages  │
                    │  workflows, coordinates │
                    │  handoffs, reports back)│
                    └────────────┬────────────┘
                                 │ DELEGATES TO
     ┌───────────────────────────┼───────────────────────────┐
     │                           │                           │
     ▼                           ▼                           ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  TIER 1          │   │  TIER 1          │   │  TIER 1          │
│  PRIMARY         │   │  PRIMARY         │   │  PRIMARY         │
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
     │  (orchestrator requests audits, agents can VETO)       │
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
| **Tier 0** | **Orchestrator** | **YOU (the human)** — your ONLY contact | 1 |
| **Tier 1** | **Primary Agents** | orchestrator-agent delegates to them | 6 |
| **Tier 2** | **Sub-Agents** | Only their parent Tier 1 agent | 5 |
| **Tier 3** | **Cross-cutting Auditors** | All tiers (audit, veto, review) | 5 |

**Rule:** You ONLY talk to orchestrator-agent (Tier 0). It routes your task to the correct Tier 1 agent, which may further delegate to Tier 2. Tier 3 audits are requested by the orchestrator.

---

## Agent Overview

### Tier 0 — Orchestrator (YOUR single contact)

| Agent | You say | It routes to |
|-------|---------|-------------|
| [orchestrator-agent](.opencode/agents/orchestrator-agent.md) | "Build the music player" | Appropriate Tier 1 agents |

### Tier 1 — Primary Agents (orchestrator delegates to them)

| Agent | orchestrator says | Delegates to |
|-------|------------------|-------------|
| [architecture-agent](.opencode/agents/architecture-agent.md) | "Set up the project structure" | — |
| [frontend-agent](.opencode/agents/frontend-agent.md) | "Build the player page" | state-management-agent, ui-agent |
| [design-system-agent](.opencode/agents/design-system-agent.md) | "Define the dark theme" | — |
| [audio-engine-agent](.opencode/agents/audio-engine-agent.md) | "Implement audio playback" | — |
| [pwa-agent](.opencode/agents/pwa-agent.md) | "Make this work offline" | offline-storage-agent |
| [deployment-agent](.opencode/agents/deployment-agent.md) | "Set up CI/CD" | — |

### Tier 2 — Sub-agents (you DON'T talk to them)

| Agent | Reports to | Purpose |
|-------|-----------|---------|
| [ui-agent](.opencode/agents/ui-agent.md) | frontend-agent | Visual layer |
| [motion-agent](.opencode/agents/motion-agent.md) | ui-agent | Animation |
| [mobile-ux-agent](.opencode/agents/mobile-ux-agent.md) | ui-agent | Mobile polish |
| [state-management-agent](.opencode/agents/state-management-agent.md) | frontend-agent | Stores |
| [offline-storage-agent](.opencode/agents/offline-storage-agent.md) | pwa-agent | Data persistence |

### Tier 3 — Auditors (cross-cutting, can VETO)

| Agent | Scope | Power |
|-------|-------|-------|
| [performance-agent](.opencode/agents/performance-agent.md) | All tiers | **VETO** |
| [accessibility-agent](.opencode/agents/accessibility-agent.md) | All tiers | **VETO** |
| [testing-agent](.opencode/agents/testing-agent.md) | All tiers | Standard |
| [code-review-agent](.opencode/agents/code-review-agent.md) | All tiers | Advisory |
| [refactor-agent](.opencode/agents/refactor-agent.md) | All tiers | Standard |

---

## How You Interact With Agents

```
YOU: "Hey orchestrator, build the music player page"
  │
  ▼
orchestrator-agent (Tier 0) receives your task
  │
  ├── Routes to frontend-agent (Tier 1): "Implement the player feature"
  │     ├── frontend-agent delegates to state-management-agent (T2): "Player store"
  │     ├── frontend-agent delegates to ui-agent (T2): "Player visuals"
  │     │     ├── ui-agent delegates to motion-agent (T2): "Animations"
  │     │     └── ui-agent delegates to mobile-ux-agent (T2): "Mobile polish"
  │     └── frontend-agent implements feature logic
  │
  ├── Routes to audio-engine-agent (Tier 1): "Implement playback engine"
  │
  ├── Requests accessibility-agent (Tier 3): "Audit player a11y"
  ├── Requests performance-agent (Tier 3): "Audit player perf"
  ├── Requests testing-agent (Tier 3): "Test player"
  │
  └── Consolidates results → reports back to YOU
```

See [.opencode/rules/hierarchy.md](.opencode/rules/hierarchy.md) for detailed tier rules.

---

## Quickstart Workflow (Human View)

You ONLY talk to orchestrator-agent:

```
YOU → orchestrator-agent: "Set up the project and build the player"
```

The orchestrator then:

```
1.  → architecture-agent     "Set up src/ structure and dependencies"
2.  → design-system-agent    "Define the visual theme and tokens"
3.  → pwa-agent              "Configure PWA and offline strategy"
4.  → deployment-agent       "Set up build and CI/CD"
5.  → frontend-agent         "Build the player page" *
6.  → audio-engine-agent     "Implement audio playback engine"
7.  → performance-agent      "Audit performance" (Tier 3)
8.  → accessibility-agent    "Audit accessibility" (Tier 3)
9.  → reports back to YOU
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
| Human ONLY talks to orchestrator-agent | orchestrator-agent |

Full rules: [.opencode/rules/anti-caos.md](.opencode/rules/anti-caos.md)

---

## Evolution

This system is living. If an agent is found:
- **Too large** → split into more specialized agents
- **Unnecessary** → merge into a parent
- **Missing** → create with full spec

Changes to `.opencode/agents/`, `.opencode/rules/`, `.opencode/workflows/` require **architecture-agent** approval.
