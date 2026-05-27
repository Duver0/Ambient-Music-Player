# Skill: Animation Performance

> Performance patterns for GPU-accelerated, jank-free animations.

---

## Purpose

Ensure all animations run at 60fps on mid-range mobile devices. Define what properties to animate, what to avoid, and how to measure.

## Triggers

Loaded when:
- performance-agent validates animations
- motion-agent implements animations
- code-review-agent audits animation code

## Rules

### What to Animate (GPU-Composited)

| Property | GPU | CPU | Cost |
|----------|-----|-----|------|
| `transform` | ✅ GPU | ❌ | Free |
| `opacity` | ✅ GPU | ❌ | Free |
| `filter` (blur) | ⚠️ Some GPUs | ⚠️ | Medium |
| `clip-path` | ❌ | ✅ | Expensive |
| `width/height` | ❌ | ✅ | **Expensive** |
| `top/left` | ❌ | ✅ | **Expensive** |
| `box-shadow` | ❌ | ✅ | **Expensive** |

### Performance Budgets

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| FPS | ≥ 55 | performance-agent |
| JS frame time | < 10ms | performance-agent |
| Composite layer count | < 30 | Chrome DevTools |
| Paint count | < 5 per frame | Chrome DevTools |
| Animated elements per page | < 20 | code-review-agent |

### Optimization Techniques

1. **`will-change`** — hint for GPU layering:
   ```css
   will-change: transform; /* Not: will-change: all */
   ```
2. **`transform` for position** — never animate left/top
3. **`scale` for size** — never animate width/height
4. **`opacity` for visibility** — never animate display
5. **Layer promotion** — promote only when needed:
   ```ts
   // Framer Motion does this automatically:
   <motion.div style={{ willChange: 'transform' }} />
   ```
6. **Avoid layout thrashing** — batch reads and writes
7. **RAF** — use `requestAnimationFrame` for custom animations

### Measurement Tools

| Tool | What it measures |
|------|-----------------|
| Chrome DevTools Performance | Frame timeline, FPS |
| Chrome DevTools Layers | Composited layers |
| `fps-emitter` package | Runtime FPS overlay |
| Lighthouse | UX metrics, CLS |

## Anti-Patterns

- ❌ Animating layout properties (width, height, top, left)
- ❌ `will-change: all` (creates too many layers)
- ❌ Animating 50+ elements simultaneously
- ❌ No `will-change` on heavy animations
- ❌ Animations on scroll without throttling
- ❌ JavaScript animations when CSS/Framer Motion suffices
- ❌ Re-creating animation objects every render
- ❌ Not profiling before optimization

## Framer Motion Performance Config

```ts
// Always reduce motion on mobile mid-range:
<motion.div
  transition={{
    type: 'tween',     // spring is heavier
    duration: 0.3,     // keep short
  }}
/>
```
