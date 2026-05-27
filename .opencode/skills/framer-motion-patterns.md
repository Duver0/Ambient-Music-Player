# Skill: Framer Motion Patterns

> Declarative animation patterns for cinematic motion design.

---

## Purpose

Standardize how Framer Motion is used for animations, transitions, and gestures. Ensures animations are performant, accessible, and consistent.

## Triggers

Loaded when:
- motion-agent adds animations to components
- ui-agent needs basic motion integration

## Rules

1. **Prefer `motion.div` over `animate={}` on load** — use variants
2. **Extract variants** — define outside component (prevents re-creation):
   ```ts
   const fadeUp = {
     initial: { opacity: 0, y: 20 },
     animate: { opacity: 1, y: 0 },
     exit: { opacity: 0, y: -20 },
   }
   ```
3. **Use `layoutId`** for shared layout animations (page transitions)
4. **`AnimatePresence`** — always define `exit` variants
5. **Gestures** — use `whileHover`, `whileTap`, `whileDrag`
6. **Stagger children** — use `variants` with `staggerChildren`:
   ```ts
   const container = {
     animate: { transition: { staggerChildren: 0.05 } },
   }
   ```
7. **Always `will-change: transform`** on animated elements
8. **Reduced motion** — wrap with `useReducedMotion()`:
   ```ts
   const shouldReduceMotion = useReducedMotion()
   if (shouldReduceMotion) return <div>{children}</div>
   ```

## Transition Defaults

| Property | Default | When to change |
|----------|---------|----------------|
| duration | 0.3s | Page transitions: 0.5s |
| ease | `easeOut` | Cinematic: `[0.6, 0.01, -0.05, 0.95]` |
| type | `tween` | Spring for gestures: `spring` |
| stiffness | 300 | Subtle: 200, Bouncy: 500 |

## Anti-Patterns

- ❌ Animating `width`, `height`, `top`, `left` (causes layout thrashing)
- ❌ `animate` prop without `initial` — causes mount animation without control
- ❌ No exit animations in `AnimatePresence`
- ❌ Creating variants inside component (re-creates every render)
- ❌ Heavy animations on mobile (test on low-end devices)
- ❌ Animations that interfere with accessibility (vestibular disorders)
- ❌ Inline motion values when variants suffice

## Approved Motion Categories

| Category | Technique | Performance |
|----------|-----------|-------------|
| Page transition | `layoutId` + `AnimatePresence` | ⭐⭐⭐ |
| Micro-interaction | `whileHover`/`whileTap` | ⭐⭐⭐ |
| Stagger reveal | `staggerChildren` | ⭐⭐⭐ |
| Scroll animation | `useScroll` + `useTransform` | ⭐⭐ |
| Drag gesture | `drag` prop | ⭐⭐ |
| SVG path draw | `pathLength` animation | ⭐⭐ |
| 3D perspective | `rotateX`/`rotateY` | ⭐ |
