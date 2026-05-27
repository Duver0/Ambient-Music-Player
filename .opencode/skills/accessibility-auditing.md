# Skill: Accessibility Auditing

> WCAG compliance patterns for inclusive design.

---

## Purpose

Standardize accessibility implementation and auditing. Ensure the application meets WCAG 2.1 AA minimum (AAA where possible).

## Triggers

Loaded when:
- accessibility-agent audits components
- ui-agent implements visual components
- frontend-agent creates interactive elements

## Rules

### Color & Contrast

- Text contrast: **4.5:1 AA** (normal), **3:1 AA** (large)
- UI component contrast: **3:1 AA**
- Use `contrast-checker` in design phase
- Never convey info by color alone (add icons/text)

### Keyboard Navigation

- All interactive elements reachable via Tab
- Visible focus indicator (outline, not just color change)
- Skip navigation link at page top
- No keyboard traps (modal must handle Escape)
- Custom hotkeys documented for screen readers

### ARIA

```ts
// Use semantic HTML first, ARIA second:
<button> → Good (semantic)
<div role="button"> → Bad (use <button>)
// Only use ARIA when HTML semantics insufficient:
<div role="tabpanel" aria-labelledby="tab-1"> → OK
```

### Screen Reader

- Images: always `alt` text (decorative: `alt=""`)
- Dynamic content: `aria-live` regions
- Status updates: `role="status"` or `aria-live="polite"`
- Form errors: `aria-describedby` linking to error

### Reduced Motion

```ts
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
if (prefersReduced.matches) {
  // Disable non-essential animations
  // Keep essential transitions (collapse, expand)
}
```

## Audit Checklist

| Check | Tool/Method | Target |
|-------|-------------|--------|
| Color contrast | axe DevTools | WCAG AA |
| Keyboard nav | Manual Tab test | All interactive |
| Screen reader | VoiceOver/NVDA | All content |
| Focus order | Visual inspection | Logical flow |
| Touch targets | Manual | 44x44px min |
| Reduced motion | System pref test | No jarring motion |
| Zoom 200% | Browser zoom | No content loss |

## Anti-Patterns

- ❌ Removing focus outlines ("it looks ugly")
- ❌ Color-only indicators (use + icon/text)
- ❌ `aria-hidden="true"` on focusable elements
- ❌ Missing form labels
- ❌ Auto-playing audio without control
- ❌ Disabling reduced motion for "experience"
- ❌ Tabindex > 0 (use DOM order instead)
- ❌ Placeholder as label (use `<label>` element)
