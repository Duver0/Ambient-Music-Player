# Workflow: Refactoring

> Standard flow for tech debt elimination and code structure improvement.

---

## Flow Diagram

```
1. architecture-agent ─────► approve refactor scope
           │
2. code-review-agent ──────► identify specific issues
           │
3. refactor-agent ─────────► implement improvements
           │
4. testing-agent ──────────► verify no regression
           │
5. code-review-agent ──────► validate refactor
           │
6. performance-agent ──────► verify no perf regression
```

---

## Step Details

### Step 1: architecture-agent

**Input:** Refactor request (from code-review findings, tech debt backlog, or user)
**Action:**
- Approve or reject refactor scope
- Ensure refactor doesn't conflict with active features
- Define success criteria
- Set boundaries (what's in scope, what's out)

**Output:** Refactor scope document + handoff

### Step 2: code-review-agent

**Input:** Refactor scope
**Action:**
- Audit codebase for specific issues in scope
- Classify findings (P0 must-fix, P1 should-fix, P2 nice-to-have)
- Provide actionable recommendations

**Output:** Refactor findings report + handoff

### Step 3: refactor-agent

**Input:** Scope + findings
**Action:**
- Implement refactors
- Split large files
- Extract components
- Remove dead code
- Consolidate duplicates
- Improve types
- DO NOT change behavior

**Output:** Refactored code + handoff

### Step 4: testing-agent

**Input:** Refactored code
**Action:**
- Run full test suite
- Verify zero behavioral changes
- If tests were modified, verify they cover same cases

**Output:** Test results + handoff

### Step 5: code-review-agent

**Input:** Refactored code + test results
**Action:**
- Validate refactor achieved goals
- Verify no new issues introduced
- Check file/component sizes are within limits

**Output:** Validation report + handoff

### Step 6: performance-agent (conditional)

**Input:** Refactored code
**Condition:** Only if refactor involved performance-critical code
**Action:**
- Run performance benchmarks
- Verify no regression
- Verify improvement if performance was the goal

**Output:** Performance report

---

## Refactor Rules

1. **NEVER change behavior** — same output, same UX, same visuals
2. **NEVER add features** — refactoring and features are separate workflows
3. **Test before and after** — tests must pass before and after
4. **Small batches** — refactor one concern at a time
5. **Large refactors** (> 5 files) need architecture-agent approval
6. **No golden hammer** — don't refactor working code just because
7. **Leave it better** — clean up surrounding code within scope
8. **If it's not broken and doesn't need change, don't touch it**
