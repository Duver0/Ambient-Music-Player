# Workflow: Feature Development

> Standard flow for implementing a new feature, page, or component.

---

## Flow Diagram

```
0. orchestrator-agent ─────► task decomposition + routing
           │
1. architecture-agent ─────► spec + structural plan
           │
2. design-system-agent ────► token requirements
           │
3. state-management-agent ─► store design (if needed)
           │
4. audio-engine-agent ─────► audio API (if audio feature)
           │
5. offline-storage-agent ──► data schema (if persistent)
           │
6. pwa-agent ──────────────► cache strategy (if offline)
           │
7. frontend-agent ─────────► feature implementation
           │
8. ui-agent ───────────────► visual layer + layout
           │
9. motion-agent ───────────► animation + transitions
           │
10. mobile-ux-agent ───────► touch + mobile polish
           │
11. accessibility-agent ───► a11y audit (can VETO)
           │
12. performance-agent ─────► perf audit (can VETO)
           │
13. testing-agent ─────────► test implementation
           │
14. code-review-agent ─────► quality audit
           │
15. deployment-agent ──────► build + ship
           │
16. orchestrator-agent ────► consolidate + report to Human
```

---

## Step Details

### Step 0: orchestrator-agent

**Input:** Feature description from Human
**Action:**
- Decompose task into sub-tasks
- Route to correct Tier 1 agents in order
- Initialize workflow context

**Output:** Task plan + handoff to architecture-agent

### Step 1: architecture-agent

**Input:** Feature description from user
**Action:**
- Define project structure (files, folders)
- Approve any new dependencies
- Document architecture decisions
- Handoff to next agent

**Output:** `STRUCTURAL_SPEC.md` + handoff doc

### Step 2: design-system-agent

**Input:** Feature spec from architecture-agent
**Action:**
- Define required design tokens
- Update tailwind.config.ts if needed
- Create visual primitives if needed

**Output:** Updated tokens + handoff

### Step 3: state-management-agent (conditional)

**Input:** Feature spec + tokens
**Condition:** Only if feature requires new state
**Action:**
- Design store shape
- Create store file with typed actions
- Define selectors

**Output:** Store files + handoff

### Step 4: audio-engine-agent (conditional)

**Input:** Feature spec
**Condition:** Only if feature involves audio playback
**Action:**
- Design audio integration points
- Implement audio engine changes
- Expose API for frontend-agent

**Output:** Audio API + handoff

### Step 5: offline-storage-agent (conditional)

**Input:** Feature spec
**Condition:** Only if feature needs persistent data
**Action:**
- Design Dexie schema
- Create CRUD services
- Implement migrations

**Output:** Data layer + handoff

### Step 6: pwa-agent (conditional)

**Input:** Feature spec
**Condition:** Only if feature needs caching strategy
**Action:**
- Define cache rules
- Update SW configuration
- Document offline behavior

**Output:** Cache strategy + handoff

### Step 7: frontend-agent

**Input:** All previous outputs
**Action:**
- Implement feature components (functional)
- Wire data flow (stores → components)
- Set up routing if needed
- Create hooks

**Output:** Feature implementation + handoff

### Step 8: ui-agent

**Input:** Frontend implementation
**Action:**
- Apply visual styles (TailwindCSS)
- Implement responsive layout
- Apply design tokens
- Polish visual states

**Output:** Styled components + handoff

### Step 9: motion-agent

**Input:** Styled components from ui-agent
**Action:**
- Add Framer Motion animations
- Implement transitions
- Add micro-interactions
- Add gesture handlers

**Output:** Animated components + handoff

### Step 10: mobile-ux-agent

**Input:** Animated components
**Action:**
- Validate touch targets (44x44px min)
- Apply safe area insets
- Optimize thumb zone
- Implement touch gestures

**Output:** Mobile-polished components + handoff

### Step 11: accessibility-agent (GATEKEEPER)

**Input:** Mobile-polished components
**Action:**
- Audit color contrast
- Audit keyboard navigation
- Audit screen reader support
- Audit reduced motion support
- Add ARIA attributes

**Decision:**
- ✅ PASS → proceed
- ❌ VETO → fix issues, re-audit

**Output:** A11y audit report + handoff

### Step 12: performance-agent (GATEKEEPER)

**Input:** All above outputs
**Action:**
- Bundle size audit
- Render performance audit
- Animation FPS check
- Memory check
- Lighthouse audit

**Decision:**
- ✅ PASS → proceed
- ❌ VETO → optimize, re-audit

**Output:** Performance audit + handoff

### Step 13: testing-agent

**Input:** All above (post-audit)
**Action:**
- Write unit tests
- Write integration tests
- Write component tests
- Achieve coverage targets

**Output:** Test files + handoff

### Step 14: code-review-agent

**Input:** Full feature codebase
**Action:**
- Code convention audit
- File size check
- Component size check
- Import consistency
- Architecture boundary check

**Output:** Review report + handoff

### Step 15: deployment-agent

**Input:** Approved codebase
**Action:**
- Build
- Type check
- Test run
- Deploy

**Output:** Build artifacts + deploy confirmation

### Step 16: orchestrator-agent (consolidation)

**Input:** All completed work + build artifacts
**Action:**
- Consolidate results from all agents
- Summarize decisions made
- Document any open issues

**Output:** Final report to Human

---

## Conditional Skip Rules

| Step | Skip Condition |
|------|----------------|
| 3 (state) | Feature has no new state |
| 4 (audio) | Feature has no audio |
| 5 (storage) | Feature has no persistence |
| 6 (pwa) | Feature has no offline needs |

Skipped steps must be documented in handoff as "SKIPPED: reason"
