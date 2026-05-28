# Hierarchy Rules

> Defines the 4-tier system: Orchestrator (T0), Primary (T1), Sub-agents (T2), Auditors (T3).

---

## Tier Definitions

### Tier 0 — Orchestrator (Your Single Contact)

| Property | Value |
|----------|-------|
| Interacts with | **Human (YOU)** |
| Can delegate to | All Tier 1 agents |
| Can request audit from | Tier 3 auditors |
| Reports to | Human |
| Task source | Human directly |
| Owns | Coordination, routing, workflow |

**Agents:** orchestrator-agent

**Rule:** Tier 0 is the ONLY entry point for human task assignment. You NEVER talk to any other agent directly. The orchestrator routes your request to the correct domain agent.

### Tier 1 — Primary Agents (Agent Interface)

| Property | Value |
|----------|-------|
| Interacts with | **orchestrator-agent (Tier 0)** |
| Can delegate to | Tier 2 sub-agents |
| Can request audit from | Tier 3 auditors (via orchestrator) |
| Reports to | orchestrator-agent |
| Task source | orchestrator-agent |

**Agents:** architecture-agent, frontend-agent, design-system-agent, audio-engine-agent, pwa-agent, deployment-agent

**Rule:** Tier 1 agents receive tasks from the orchestrator, never from the human directly. They own their domain and may delegate sub-tasks to Tier 2.

### Tier 2 — Sub-Agents (Agent Interface Only)

| Property | Value |
|----------|-------|
| Interacts with | **Only their Tier 1 parent** |
| Can delegate to | Their own sub-agents (if any) |
| Reports to | Their Tier 1 parent agent |
| Task source | Tier 1 parent agent |
| Never talks to | Human |

**Agents:** ui-agent, motion-agent, mobile-ux-agent, state-management-agent, offline-storage-agent

**Rule:** Tier 2 agents are invisible to the human. You never assign tasks to them, never receive reports from them. All communication flows through their Tier 1 parent.

### Tier 3 — Cross-cutting Auditors

| Property | Value |
|----------|-------|
| Interacts with | **All tiers** |
| Can audit | Any agent in T1 or T2 |
| Reports to | The agent that requested the audit |
| Task source | Any Tier 1 agent (or Tier 2 via parent) |
| Special power | **VETO** (performance-agent, accessibility-agent) |

**Agents:** performance-agent, accessibility-agent, testing-agent, code-review-agent, refactor-agent

**Rule:** Tier 3 agents are independent auditors. They don't own features — they validate, test, review, and refactor work from all other agents.

---

## Communication Matrix

```
           │ Human  │ Tier 0   │ Tier 1  │ Tier 2  │ Tier 3
───────────┼────────┼──────────┼─────────┼─────────┼─────────
  Human    │   —    │  Assign  │ ❌ NO   │ ❌ NO   │ ❌ NO
           │        │  tasks   │         │         │
───────────┼────────┼──────────┼─────────┼─────────┼─────────
  Tier 0   │ Report │    —     │Delegate │  — ¹    │ Request
           │ result │          │ tasks   │         │ audit
───────────┼────────┼──────────┼─────────┼─────────┼─────────
  Tier 1   │ ❌ NO  │  Report  │    —    │Delegate │ Request
           │        │  results │         │ sub-task│ audit
───────────┼────────┼──────────┼─────────┼─────────┼─────────
  Tier 2   │ ❌ NO  │  Report  │  Report │    —    │ Request
           │        │  results │  results│         │ audit
───────────┼────────┼──────────┼─────────┼─────────┼─────────
  Tier 3   │ ❌ NO  │  Audit   │  Audit  │  Audit  │    —
           │        │  report  │  report │  report │
```

¹ Tier 0 delegates through Tier 1, not directly to Tier 2.

---

## Parent-Child Relationships

| Parent (T1) | Child (T2) | Grandchild (T2) |
|-------------|-----------|-----------------|
| frontend-agent | state-management-agent | — |
| frontend-agent | ui-agent | motion-agent |
| frontend-agent | ui-agent | mobile-ux-agent |
| pwa-agent | offline-storage-agent | — |

### Delegation Chain Example

```
Human → orchestrator-agent (T0): "Build the music player"
  orchestrator-agent → architecture-agent (T1): "Define project structure"
  orchestrator-agent → frontend-agent (T1): "Build the player page"
    frontend-agent → state-management-agent (T2): "Design store for player state"
    frontend-agent → ui-agent (T2): "Style the player component"
      ui-agent → motion-agent (T2): "Add transition animations"
      ui-agent → mobile-ux-agent (T2): "Ensure touch targets and safe areas"
    frontend-agent → orchestrator-agent (T0): "Feature implementation complete"
  orchestrator-agent → audio-engine-agent (T1): "Implement audio playback"
  orchestrator-agent → accessibility-agent (T3): "Audit player a11y"
  orchestrator-agent → performance-agent (T3): "Audit player perf"
  orchestrator-agent → testing-agent (T3): "Test player feature"
orchestrator-agent → Human: "Player complete. Summary: ..."
```

---

## Tier Violation Rules

| Violation | Consequence |
|-----------|-------------|
| Human assigns task directly to Tier 1/2/3 agent | ❌ Blocked — must go through orchestrator (T0) |
| Tier 1/2 agent reports directly to Human | ❌ Blocked — must report to orchestrator (T0) |
| Tier 2 agent reports directly to Human | ❌ Blocked — must report up through chain |
| Tier 3 agent ignores audit request | ❌ Blocked — must audit when requested |
| Tier 1 agent doesn't delegate when sub-agent is needed | ⚠️ WARNING — inefficient, but allowed |
| Tier 2 agent assigns task to another Tier 2 agent (different parent) | ⚠️ Must coordinate via respective Tier 1 parents |

---

## Escalation Path by Tier

| Scenario | Path |
|----------|------|
| Tier 2 agent blocked | → Reports to Tier 1 parent → escalates to orchestrator |
| Tier 1 agent conflict | → orchestrator-agent mediates |
| Tier 3 veto | → orchestrator-agent receives report → appeals to architecture-agent if needed |
| orchestrator-agent blocked | → escalates to Human |
| Human override | → Final — no appeal |
