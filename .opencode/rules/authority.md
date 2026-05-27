# Technical Authority Matrix

> Defines which agent has authority over what, who can override whom, and how conflicts are resolved.

---

## Authority Levels

| Level | Label | Meaning |
|-------|-------|---------|
| 6 | **COORDINATOR** | Routes tasks, manages workflow. Cannot override domain decisions. |
| 5 | **SUPREME** | Final decision on domain. Cannot be overridden (except by human). |
| 4 | **VETO** | Can block any decision in their domain. Override requires supreme escalation. |
| 3 | **HIGH** | Primary decision-maker. Can be overridden by supreme in conflict. |
| 2 | **MEDIUM** | Contributor. Decisions can be overridden by high or supreme. |
| 1 | **ADVISORY** | Can recommend but cannot enforce. |

---

## Authority Matrix

| Domain | Supreme | Veto | High | Medium | Advisory |
|--------|---------|------|------|--------|---------|
| **Task Routing** | orchestrator-agent | — | — | — | — |
| **Workflow Coordination** | orchestrator-agent | — | — | — | — |
| **Human Communication** | orchestrator-agent | — | — | — | — |
| **Project Structure** | architecture-agent | — | — | — | code-review-agent |
| **Tech Stack** | architecture-agent | — | — | — | performance-agent |
| **Dependencies** | architecture-agent | — | deployment-agent | — | — |
| **Design Tokens** | design-system-agent | — | ui-agent | — | accessibility-agent |
| **Visual Design** | ui-agent | — | design-system-agent | mobile-ux-agent | accessibility-agent |
| **Layout** | ui-agent | — | mobile-ux-agent | frontend-agent | accessibility-agent |
| **Responsive** | ui-agent | mobile-ux-agent | — | — | — |
| **Animations** | motion-agent | performance-agent | ui-agent | — | accessibility-agent |
| **Gestures** | motion-agent | mobile-ux-agent | ui-agent | — | accessibility-agent |
| **State Shape** | state-management-agent | — | frontend-agent | — | performance-agent |
| **Store Implementation** | state-management-agent | — | frontend-agent | — | — |
| **Audio Engine** | audio-engine-agent | — | frontend-agent | — | performance-agent |
| **Audio Visualization** | audio-engine-agent | — | ui-agent | motion-agent | — |
| **Data Schema** | offline-storage-agent | — | frontend-agent | — | performance-agent |
| **IndexedDB Access** | offline-storage-agent | — | — | — | — |
| **Cache Strategy** | pwa-agent | performance-agent | offline-storage-agent | — | — |
| **Service Worker** | pwa-agent | — | — | — | deployment-agent |
| **PWA Compliance** | pwa-agent | — | — | — | performance-agent |
| **Performance** | performance-agent | — | — | ALL agents | — |
| **Bundle Size** | performance-agent | architecture-agent | deployment-agent | — | — |
| **Mobile UX** | mobile-ux-agent | — | ui-agent | motion-agent | — |
| **Safe Areas** | mobile-ux-agent | — | ui-agent | — | — |
| **Touch Targets** | mobile-ux-agent | accessibility-agent | ui-agent | — | — |
| **Accessibility** | accessibility-agent | — | ui-agent | frontend-agent | — |
| **Color Contrast** | accessibility-agent | design-system-agent | ui-agent | — | — |
| **Keyboard Nav** | accessibility-agent | — | frontend-agent | — | — |
| **Tests** | testing-agent | — | — | ALL agents | — |
| **Code Quality** | code-review-agent | — | — | — | — |
| **Conventions** | architecture-agent | code-review-agent | — | — | — |
| **Build Config** | deployment-agent | — | architecture-agent | — | performance-agent |
| **CI/CD** | deployment-agent | — | — | — | testing-agent |
| **Refactoring** | refactor-agent | architecture-agent | — | — | code-review-agent |

---

## Veto Power Details

### performance-agent can VETO:

1. Any feature that exceeds performance budget
2. Any animation that drops FPS below 55
3. Any dependency that increases bundle > 5%
4. Any component that causes > 200ms frame time
5. Any missing lazy loading for non-critical routes

**Appeal:** architecture-agent (if feature justifies performance cost)

### accessibility-agent can VETO:

1. Any feature with color contrast < WCAG AA
2. Any interactive element without keyboard access
3. Any animation without reduced-motion fallback
4. Any content that's inaccessible to screen readers
5. Any missing form labels

**Appeal:** architecture-agent (only if technical limitation prevents fix)

### mobile-ux-agent can VETO:

1. Any touch target < 44x44px
2. Any layout that ignores safe areas
3. Any gesture that conflicts with system gestures

**Appeal:** architecture-agent (if desktop-only feature)

### architecture-agent can VETO:

1. Any dependency that violates stack
2. Any file structure violation
3. Any module boundary violation
4. Any use of forbidden technologies

**Appeal:** Human (only option)

---

## Decision Priority

When two agents disagree, the following order determines priority:

```
0. orchestrator-agent        (coordination — routes, does not override)
1. architecture-agent       (structural integrity)
2. performance-agent         (performance)
3. accessibility-agent       (inclusivity)  
4. design-system-agent       (visual consistency)
5. pwa-agent                 (offline reliability)
6. audio-engine-agent        (audio quality)
7. offline-storage-agent     (data integrity)
8. mobile-ux-agent           (mobile experience)
9. state-management-agent    (state architecture)
10. deployment-agent         (build integrity)
11. ui-agent                 (visual implementation)
12. motion-agent             (animation)
13. frontend-agent           (feature implementation)
14. testing-agent            (test reliability)
15. refactor-agent           (code quality)
16. code-review-agent        (code review)
```

Lower number = higher priority.

---

## Human Override

The human developer (user) has **absolute authority** over ALL agents. Any agent decision can be overridden by the user. Agents must document when a human override occurs.
