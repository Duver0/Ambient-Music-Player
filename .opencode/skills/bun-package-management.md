# Skill: Bun Package Management

> Bun-specific workflow for dependency management, scripts, and tooling.

---

## Purpose

Standardize bun usage across the project. Ensure all developers and agents use bun consistently.

## Triggers

Loaded when:
- architecture-agent adds/modifies dependencies
- deployment-agent configures build
- ANY agent needs a package

## Rules

1. **NEVER use npm** — `bun add <pkg>`, `bun remove <pkg>`
2. **No lockfile conflicts** — only `bun.lock` (delete any `package-lock.json` or `yarn.lock`)
3. **Add dev deps** — use `bun add -d <pkg>`
4. **Global installs** — `bun install -g <pkg>` (avoid when possible)
5. **Scripts** — use `bun run <script>` not `npm run`
6. **TypeScript** — bun runs TS natively, no ts-node needed
7. **Testing** — `bun test` (Vitest compatible via bun)
8. **Version management** — pin in `package.json`:
   ```json
   "engines": { "bun": ">=1.2.0" }
   ```

## Approved Commands

| Task | Command |
|------|---------|
| Install all deps | `bun install` |
| Add a package | `bun add zustand` |
| Add dev package | `bun add -d vitest` |
| Remove package | `bun remove zustand` |
| Update package | `bun update zustand` |
| Run dev server | `bun run dev` |
| Run tests | `bun test` |
| Build | `bun run build` |
| Type check | `bun run typecheck` |

## Anti-Patterns

- ❌ Running `npm install` (will create conflicting lockfile)
- ❌ Using `npx` (use `bunx` instead)
- ❌ Global package installs when local suffices
- ❌ Committing `package-lock.json` or `yarn.lock`
- ❌ Using `npm scripts` instead of `bun scripts`
- ❌ Node-specific APIs that bun doesn't support

## Implementation Notes

- `bunx` replaces `npx` for one-off commands
- `bun --bun` forces usage of bun runtime over node
- `Bun.env` provides typed env variables
- `Bun.file()` provides file system access
- `Bun.write()` for efficient file writes
- `Bun.serve()` is available but not needed (Vite handles dev server)
