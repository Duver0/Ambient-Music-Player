# Skill: Touch Gesture Patterns

> Mobile gesture handling for native-feeling interactions.

---

## Purpose

Standardize touch gesture implementation. Ensure gestures feel natural, are ergonomic, and don't conflict with scrolling or other interactions.

## Triggers

Loaded when:
- mobile-ux-agent defines gesture requirements
- motion-agent implements gesture handlers
- ui-agent creates touch-interactive components

## Rules

### Touch Target Sizing

| Context | Minimum Size | Preferred Size |
|---------|-------------|----------------|
| Buttons (critical) | 44x44px | 48x48px |
| Icon buttons | 44x44px | 48x48px |
| Links in text | 44x44px | 48x48px |
| Slider controls | 44x44px | 48x48px |
| List items | — | 44px height |

### Gesture Ergonomics

- **Thumb zone** — place primary actions in the **bottom 1/3** and **center** of screen
- **Safe gestures** — swipe down (pull to refresh), swipe left (dismiss), tap (select)
- **Avoid** — top-left corner for critical actions
- **Palm rejection** — ignore touches near screen edges

### Gesture Types

| Gesture | Action | Implementation |
|---------|--------|----------------|
| Tap | Select | `onClick` (works for touch + mouse) |
| Double tap | Like/zoom | `onDoubleClick` |
| Long press | Context menu | Framer Motion `whileTap` + timer |
| Swipe left | Dismiss | Framer Motion `drag="x"` + `onDragEnd` |
| Swipe down | Refresh | Framer Motion `drag="y"` |
| Pinch | Zoom | Framer Motion `onPinch` |
| Pan | Scroll/seek | Native scroll or Framer Motion `drag` |

### Implementation Pattern

```tsx
// Swipe-to-dismiss with Framer Motion
function SwipeableCard({ children, onDismiss }) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, { offset, velocity }) => {
        if (offset.x < -100 || velocity.x < -500) {
          onDismiss()
        }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}
```

## Anti-Patterns

- ❌ Touch targets < 44x44px (WCAG failure)
- ❌ Gestures that conflict with system gestures (pull-to-refresh vs scroll)
- ❌ No `touch-action` CSS property (prevents browser handling)
- ❌ Tap delay (ensure `touchstart` handlers don't block)
- ❌ Swipe that interferes with scroll (use direction lock)
- ❌ No visual feedback on touch (no `active` state)
- ❌ Right-edge swipe (conflicts with iOS back gesture)

## CSS Requirements

```css
/* Prevent browser gesture conflicts */
.no-pan-x { touch-action: pan-y; }
.no-pan-y { touch-action: pan-x; }
.no-pan { touch-action: none; }
```
