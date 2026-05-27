# Skill: Mobile Safe Area Handling

> Handling notches, status bars, home indicators, and keyboard insets.

---

## Purpose

Ensure the application correctly handles device safe areas on iOS and Android. Prevent content from being obscured by notches, status bars, or home indicators.

## Triggers

Loaded when:
- mobile-ux-agent defines layout constraints
- ui-agent implements responsive components

## Rules

1. **CSS env() variables** — always use for safe areas:
   ```css
   /* In Tailwind: */
   .safe-top { padding-top: env(safe-area-inset-top); }
   .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
   .safe-left { padding-left: env(safe-area-inset-left); }
   .safe-right { padding-right: env(safe-area-inset-right); }
   ```
2. **`viewport-fit=cover`** — required in HTML meta viewport:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
   ```
3. **Tailwind integration** — define safe area utilities in tailwind.config.ts:
   ```ts
   theme: {
     extend: {
       padding: {
         'safe-top': 'env(safe-area-inset-top)',
         'safe-bottom': 'env(safe-area-inset-bottom)',
       }
     }
   }
   ```
4. **Keyboard avoidance** — use `visualViewport` API for input focus
5. **Bottom navigation** — always use `safe-bottom` padding
6. **Status bar** — respect `safe-top` for fixed headers
7. **Landscape** — test safe areas in landscape orientation

## Anti-Patterns

- ❌ Hardcoding safe area values (44px for notch, 34px for home indicator)
- ❌ Using `constant()` instead of `env()` (deprecated)
- ❌ Forgetting viewport-fit=cover meta tag
- ❌ Applying safe areas to desktop (use media queries)
- ❌ Ignoring keyboard safe area on input focus
- ❌ Fixed positioning without safe area padding

## Safe Area Values

| Device | Top (notch) | Bottom (home indicator) |
|--------|-------------|------------------------|
| iPhone 14 Pro | 47px | 34px |
| iPhone SE | 0px | 20px |
| Pixel 7 | 24px | 16px |
| Samsung S23 | 24px | 16px |

Always use `env()` — never hardcode these values.
