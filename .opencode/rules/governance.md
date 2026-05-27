# Governance Rules

> Agent ownership hierarchy, domain boundaries, and conflict resolution.

---

## 4-Tier Hierarchy

```
┌──────────────────────────────────────────────────────────────────┐
│                     HUMAN (YOU)                                  │
│  You ONLY talk to orchestrator-agent (Tier 0)                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│  TIER 0 — ORCHESTRATOR                                          │
│  orchestrator-agent: routes tasks, manages workflows            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TIER 1 — PRIMARY AGENTS (agent interface)               │  │
│  │  They receive tasks from orchestrator, not from Human    │  │
│  │                                                          │  │
│  │  architecture │ frontend │ design-system │ audio-engine  │  │
│  │  pwa-agent    │ deployment                               │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└───────────────────────────┼────────────────────────────────────┘
                            │ delegates to
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ TIER 2 — SUB     │ │ TIER 2       │ │ TIER 2           │
│ state-mgmt-agent │ │ ui-agent     │ │ offline-storage  │
│                  │ │  ├─ motion   │ │                  │
│                  │ │  └─ mobile-ux│ │                  │
└──────────────────┘ └──────────────┘ └──────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  TIER 3 — CROSS-CUTTING AUDITORS                                │
│  (orchestrator requests audits, agents can VETO)                │
│                                                                  │
│  performance-agent (VETO)  │  accessibility-agent (VETO)        │
│  testing-agent             │  code-review-agent (ADVISORY)      │
│  refactor-agent            │                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Domain Boundaries

| Boundary | Rule |
|----------|------|
| Agent A cannot write code in Agent B's domain | Strictly forbidden |
| Agent A can read Agent B's code for context | Allowed |
| Agent A can suggest changes to Agent B | Only via handoff |
| Agent A can override Agent B | Only if authority allows |
| Two agents cannot modify the same file simultaneously | Forbidden |

## Tier Boundaries

| Boundary | Rule |
|----------|------|
| Human assigns tasks to Tier 0 (orchestrator) only | **Strict** |
| Human never assigns directly to Tier 1/2/3 | **Strict** |
| Tier 0 delegates to Tier 1 (never directly to Tier 2) | Strict |
| Tier 2 agents never communicate with Human | Strict |
| Tier 1 reports results to Tier 0 (not to Human) | Strict |
| Tier 1 delegates sub-tasks to Tier 2 | Expected |
| Tier 0 requests audits from Tier 3 | Expected |
| Tier 3 audits any tier | Allowed |
| Tier 2 requests audit via Tier 1 parent | Required |

---

## Conflict Resolution

| Conflict Type | Escalation Path |
|---------------|-----------------|
| Visual vs Functionality | ui-agent (T2) → frontend-agent (T1) → orchestrator (T0) |
| Performance vs UX | performance-agent (T3) veto, appeal to orchestrator (T0) |
| Accessibility vs Aesthetics | accessibility-agent (T3) veto, appeal to orchestrator (T0) |
| Mobile vs Desktop | mobile-ux-agent (T2) → ui-agent (T2) → frontend-agent (T1) → orchestrator (T0) |
| Tokens vs Implementation | design-system-agent (T1) has final say on tokens |
| Architecture dispute | orchestrator-agent (T0) routes to architecture-agent (T1) |
| Tier boundary violation | orchestrator-agent (T0) enforces |

### Escalation Flow

```
Agent Conflict
    │
    ▼
Within same Tier 1 domain? → Tier 1 agent resolves
Cross-domain? → Escalate to orchestrator-agent (T0)
    │
    ├── Orchestrator routes to correct agent
    │
    └── Unresolved by orchestrator
            │
            ▼
    architecture-agent (T1) reviews
            │
            ├── Accepts one side → decision final
            │
            └── Proposes compromise
                    │
                    ├── Accepted → continue
                    │
                    └── Rejected → orchestrator escalates to Human
```

---

## Ownership Rules

1. **One owner per file** — each file lists one owning agent
2. **Read-access for all** — any agent can read any file
3. **Write-access limited** — only owning agent writes
4. **Handoff required** — file ownership changes require handoff
5. **New files** — created by the owning agent only
6. **File deletion** — owning agent only, with architecture-agent approval

## Tier Ownership Rules

| Rule | Enforced by |
|------|-------------|
| Tier 0 orchestrator owns coordination and routing | architecture-agent |
| Tier 1 agents own their domain completely | orchestrator-agent |
| Tier 2 agents own their sub-domain within parent's domain | Tier 1 parent |
| Tier 3 agents own audit/review scope | orchestrator-agent |
| Tier 2 agents cannot expand scope without Tier 1 approval | Tier 1 parent |
| Tier 1 agent is responsible for all Tier 2 output | Tier 1 parent |
| Only Tier 0 communicates with Human | orchestrator-agent |
