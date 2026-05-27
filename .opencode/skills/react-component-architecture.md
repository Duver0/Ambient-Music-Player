# Skill: React Component Architecture

> Patterns for building clean, composable, predictable React components.

---

## Purpose

Standardize how React components are structured, typed, and composed in this project. Ensures consistency across all components.

## Triggers

Loaded when:
- ui-agent or frontend-agent creates a new component
- refactor-agent decomposes a large component

## Rules

1. **One component per file** — no exceptions
2. **Named exports only** — no `export default`
3. **Co-locate types** — component props defined in same file
4. **Props interface** — always typed with explicit interface:
   ```ts
   interface ComponentNameProps {
     // required props first
     // optional props second
     // children last
   }
   ```
5. **Destructure props** — always destructure in function signature
6. **Small components** — max 200 lines per component
7. **Pure when possible** — minimize `useEffect`, prefer derived state
8. **No nested render functions** — extract into child components
9. **Fragment shorthand** — use `<>` not `<Fragment>`
10. **Conditional rendering** — use ternary or `&&`, avoid IIFE

## File Structure

```
ComponentName/
├── ComponentName.tsx        # Component implementation
├── ComponentName.types.ts   # Shared types (if complex)
├── useComponentName.ts      # Co-located hook
└── ComponentName.test.tsx   # Tests
```

## Anti-Patterns

- ❌ `export default function` — prevents refactoring and re-exports
- ❌ Props without TypeScript interface
- ❌ Components > 200 lines (split into sub-components)
- ❌ Business logic inside components (extract to hooks)
- ❌ Multiple `useEffect` for related logic (consolidate)
- ❌ Inline styles (use Tailwind classes)
- ❌ `any` in props (use `unknown` if truly necessary)
- ❌ Optional chaining on required props

## Implementation Notes

- Use `React.FC` sparingly (it adds implicit children)
- Prefer `function Component()` over `const Component = () =>`
- Use `cn()` utility for conditional Tailwind classes
- Import order: React → libraries → utils → components → types
