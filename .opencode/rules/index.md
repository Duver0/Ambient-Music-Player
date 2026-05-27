# Rules Index

> Governance, authority, and anti-chaos rules for the multi-agent system.

---

## Rule Categories

| File | Purpose |
|------|---------|
| [hierarchy.md](./hierarchy.md) | 3-Tier system: Primary, Sub-agents, Auditors |
| [governance.md](./governance.md) | Agent ownership hierarchy, conflict resolution |
| [anti-caos.md](./anti-caos.md) | Explicit forbidden patterns, quality enforcement |
| [authority.md](./authority.md) | Technical authority matrix, veto power, escalation |

---

## Rule Hierarchy

```
1. Project Context (project-spec.md, stack-constants.md)
   └── IMMUTABLE — requires architecture-agent to change

2. Governance Rules (governance.md)
   └── ENFORCED — all agents must obey

3. Authority Rules (authority.md)
   └── ENFORCED — defines escalation and veto

4. Anti-Caos Rules (anti-caos.md)
   └── ENFORCED — automatic violations

5. Agent Specs (agents/*.md)
   └── GUIDELINE — agent-specific rules

6. Skills (skills/*.md)
   └── REFERENCE — loaded when needed
```
