# Workflow: Bug Fix

> Standard flow for diagnosing and fixing bugs.

---

## Flow Diagram

```
1. testing-agent ──────────► reproduce + isolate
           │
2. architecture-agent ─────► root cause assessment
           │
3. relevant agent* ────────► implement fix
           │
4. testing-agent ──────────► verify fix
           │
5. code-review-agent ──────► review fix
           │
6. deployment-agent ───────► deploy fix
```

*Relevant agent is determined by bug domain (ui-agent for visual bugs, audio-engine-agent for audio bugs, etc.)

---

## Step Details

### Step 1: testing-agent

**Input:** Bug description
**Action:**
- Reproduce the bug
- Write a failing test that demonstrates the bug
- Isolate the root cause domain
- Determine which agent owns the code

**Output:** Failing test + bug isolation report + handoff to architecture-agent

### Step 2: architecture-agent

**Input:** Bug isolation report
**Action:**
- Confirm affected domain
- Determine if fix requires structural change
- Route to correct agent
- Document fix strategy

**Output:** Fix strategy + handoff to relevant agent

### Step 3: Relevant Agent (domain-specific)

**Input:** Fix strategy + failing test
**Action:**
- Identify root cause in code
- Implement minimal fix
- Do not refactor unrelated code
- Pass the failing test

**Output:** Code fix + handoff

### Step 4: testing-agent

**Input:** Code fix
**Action:**
- Run the failing test → should pass
- Run full test suite
- Verify no regressions
- Add regression test if missing

**Output:** Test results + handoff

### Step 5: code-review-agent

**Input:** Fix + test results
**Action:**
- Review fix quality
- Verify fix doesn't violate conventions
- Verify fix is minimal (no scope creep)

**Output:** Review report + handoff

### Step 6: deployment-agent

**Input:** Approved fix
**Action:**
- Build
- Run tests in CI
- Deploy

**Output:** Deploy confirmation

---

## Bug Fix Rules

1. **One fix per bug** — no scope creep during bug fixes
2. **Always write test first** — failing test proves the bug exists
3. **Minimal change** — fix only what's broken, nothing more
4. **No refactoring** — refactoring is separate workflow
5. **Regression test** — add test that would catch recurrence
6. **Root cause** — fix the root cause, not the symptom
