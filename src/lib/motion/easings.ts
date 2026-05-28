/**
 * Easing definitions for Framer Motion animations.
 * All easings are cubic-bezier curves optimized for different contexts.
 *
 * Spec: Motion Language §3 — Easing System
 */

export const easings = {
  /**
   * Standard ease-in-out for general UI motion.
   * cubic-bezier(0.25, 0.1, 0.25, 1.0)
   */
  default: [0.25, 0.1, 0.25, 1.0] as const,

  /**
   * Ease-out for elements entering the screen.
   * Fast start, slow end — content appears quickly.
   * cubic-bezier(0.0, 0.0, 0.2, 1.0)
   */
  enter: [0.0, 0.0, 0.2, 1.0] as const,

  /**
   * Ease-in for elements exiting the screen.
   * Slow start, fast end — content disappears discreetly.
   * cubic-bezier(0.4, 0.0, 1.0, 1.0)
   */
  exit: [0.4, 0.0, 1.0, 1.0] as const,

  /**
   * Cinematic entrance with subtle anticipation.
   * cubic-bezier(0.6, 0.01, -0.05, 0.95)
   */
  cinematic: [0.6, 0.01, -0.05, 0.95] as const,

  /**
   * Smooth continuous motion for ambient/atmospheric animations.
   * cubic-bezier(0.45, 0, 0.55, 1)
   */
  smooth: [0.45, 0, 0.55, 1] as const,
} as const

export type EasingKey = keyof typeof easings

/**
 * Spring presets for gesture and interactive animations.
 * These use Framer Motion spring physics (not cubic-bezier).
 */
export const spring = {
  /** Gentle spring — for bottom sheets, panels (damping: 20, stiffness: 200) */
  gentle: { damping: 20, stiffness: 200 } as const,
  /** Snappy spring — for micro-interactions, toggles (damping: 30, stiffness: 300) */
  snappy: { damping: 30, stiffness: 300 } as const,
  /** Stiff spring — for tab indicators, precise snapping (damping: 40, stiffness: 400) */
  stiff: { damping: 40, stiffness: 400 } as const,
} as const

export type SpringKey = keyof typeof spring
