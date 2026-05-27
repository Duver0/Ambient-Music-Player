# Skill: Tailwind Design Tokens

> Visual token architecture using TailwindCSS configuration.

---

## Purpose

Define how design tokens are structured in `tailwind.config.ts`. Ensure consistent theming, dark mode, and ambient color system.

## Triggers

Loaded when:
- design-system-agent creates/extends theme
- ui-agent uses design tokens in components

## Rules

### Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Brand colors | — | `ambient-900` |
| UI colors | ui- | `ui-surface`, `ui-border` |
| Text colors | text- | `text-primary`, `text-muted` |
| Spacing | — | `4`, `6`, `8` (rem-based) |
| Typography | — | `font-sans`, `font-display` |
| Shadows | shadow- | `shadow-ambient`, `shadow-glow` |
| Blurs | blur- | `blur-ambient`, `blur-glass` |
| Animations | animate- | `animate-fade-in`, `animate-float` |
| Z-index | z- | `z-drawer`, `z-modal` |

### Theme Structure

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        ambient: {
          50: '#f0f0f0',
          100: '#e0e0e0',
          // ...
          900: '#0a0a0a',
          950: '#050505',
        },
        ui: {
          surface: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.15)',
          glass: 'rgba(10, 10, 10, 0.8)',
        },
      },
      fontFamily: {
        display: ['"SF Pro Display"', 'system-ui', 'sans-serif'],
        sans: ['"SF Pro Text"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'monospace'],
      },
      boxShadow: {
        'ambient': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 40px rgba(100, 100, 255, 0.15)',
        'glass': '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '20px',
        'ambient': '40px',
      },
    },
  },
}
```

### Dark Mode

- Default: dark mode (ambient aesthetic)
- Uses `class` strategy for manual toggle
- Dark tokens are default (no `dark:` needed)
- Light mode uses `light:` variant

### Usage Convention

```tsx
// Correct:
<div className="bg-ui-surface text-text-primary backdrop-blur-glass" />

// Wrong (hardcoded values):
<div className="bg-[#0a0a0a] text-white" />
```

## Anti-Patterns

- ❌ Hardcoded color values (always use token)
- ❌ Adding tokens for one-off usage (reuse existing)
- ❌ `dark:` prefix for dark-by-default design
- ❌ Too many color variants (> 10 per color)
- ❌ Removing tokens without deprecation
- ❌ Spacing values that don't follow 4px grid
- ❌ Custom `@apply` in CSS files (use classes directly)

## Token Definition Workflow

1. design-system-agent identifies need
2. Adds token to tailwind.config.ts
3. Documents token usage
4. ui-agent consumes tokens in components
5. code-review-agent validates no hardcoded values
