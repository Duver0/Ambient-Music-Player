# Skill: Conventional Commits

> Atomic, semantic commit messages for clean project history.

---

## Purpose

Standardize commit messages and enforce atomic commits. Every commit represents ONE logical change. No mixed concerns, no giant commits, no vague messages.

## Triggers

Loaded every time a commit is made by any agent.

## Rules

### Message Format

```
<type>: <imperative description>

[optional body with motivation]
```

### Allowed Types

| Type | When to use | Example |
|------|-------------|---------|
| `feat` | New feature or component | `feat: add audio playback engine` |
| `fix` | Bug fix | `fix: prevent audio context suspension` |
| `chore` | Maintenance, config, tooling | `chore: add .gitignore rules for bun` |
| `docs` | Documentation only | `docs: add agent hierarchy diagram` |
| `refactor` | Code change with no behavior change | `refactor: split player store into slices` |
| `test` | Tests only | `test: add player store unit tests` |
| `perf` | Performance optimization | `perf: memoize audio visualizer render` |
| `style` | Formatting, linting (no logic change) | `style: sort Tailwind classes` |

### Atomic Commit Rules

1. **ONE logical change per commit**
   - Correct: `feat: add player playback controls`
   - Wrong: `feat: add player and fix audio and update readme`

2. **Scope indication** (optional, for clarity):
   ```
   feat(player): add playback controls
   fix(audio): prevent context suspension on iOS
   ```

3. **Imperative mood** — always:
   - Correct: `feat: add playback controls`
   - Wrong: `feat: added playback controls` / `feat: adding playback controls`

4. **Body for complex changes** — explain WHY, not WHAT:
   ```
   feat(player): add crossfade between tracks

   AudioContext.createBufferSource requires manual disconnect
   on ended. Using GainNode.linearRampToValueAtTime for
   seamless 2-second crossfade.
   ```

### What NOT to do

| Anti-pattern | Why |
|-------------|-----|
| `Update files` | Zero information |
| `Fix bug` | Which bug? Where? |
| `asdf` or `wip` | Unprofessional |
| One commit with 20 files of unrelated changes | Impossible to review or revert |
| `Merge branch 'main'` without context | Useless noise |
| Committing generated files (dist, node_modules) | Bloated repo |
| `feat: add X and Y and Z` | Multiple features = multiple commits |

### Commit Size Limits

| Metric | Limit |
|--------|-------|
| Files per commit | <= 10 (exceptions justified) |
| Lines changed per commit | <= 500 (exceptions justified) |
| Types per commit | **1** (never mix feat + fix + chore) |

## Implementation Notes

- Use `git add <specific-files>` not `git add .`
- Review diff before committing with `git diff --cached`
- If commit would be too large, split into staged batches:
  ```bash
  git add src/stores/player-store.ts
  git commit -m "feat(player): add player state store"
  git add src/audio/engine.ts
  git commit -m "feat(audio): add playback engine"
  ```
