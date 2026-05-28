import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/**
 * Hook that returns whether the user prefers reduced motion.
 * Uses framer-motion's built-in implementation which internally uses
 * `useSyncExternalStore` for reactive updates.
 *
 * Returns `false` during SSR (no motion preference detected).
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false
}
