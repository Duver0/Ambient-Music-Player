# Workflows Index

> Standardized multi-agent workflows for common development scenarios.

---

## Available Workflows

| Workflow | When to Use | Est. Steps |
|----------|-------------|------------|
| [feature-development.md](./feature-development.md) | New feature, page, or component | 10-15 steps |
| [bug-fix.md](./bug-fix.md) | Bug report or unexpected behavior | 6-8 steps |
| [refactor.md](./refactor.md) | Tech debt, code smell cleanup | 5-7 steps |

---

## Workflow Principles

1. **Sequential by default** — agents run one-at-a-time in defined order
2. **Parallel where safe** — agents with no dependencies can run simultaneously
3. **Gatekeeper steps** — some agents have veto power (performance, accessibility)
4. **Always handoff** — every agent outputs a handoff document for the next agent
5. **Always validate** — every agent validates its own output before handoff
