/**
 * Animation configuration — shared animation variants and transition presets.
 *
 * Spec: Motion Language §4 — Animation Categories
 * Spec: Motion Language §10 — Implementation Standards
 *
 * All motion wrappers and feature components import from here.
 * NO other file should contain raw variant/transition definitions.
 */

import type { Transition, Variant, Variants } from 'framer-motion'
import { easings, spring } from './easings'

// ─── Transition Presets ─────────────────────────────────────────────

export const transitions = {
  /** Default UI transition — 300ms ease-in-out */
  default: {
    duration: 0.3,
    ease: easings.default,
  } satisfies Transition,

  /** Enter transition — 300ms ease-out (fast start, slow end) */
  enter: {
    duration: 0.3,
    ease: easings.enter,
  } satisfies Transition,

  /** Exit transition — 200ms ease-in (slow start, fast end) */
  exit: {
    duration: 0.2,
    ease: easings.exit,
  } satisfies Transition,

  /** Cinematic page transition — 800ms with dramatic ease */
  cinematic: {
    duration: 0.8,
    ease: easings.cinematic,
  } satisfies Transition,

  /** Gentle spring — for bottom sheets, panels */
  spring: {
    type: 'spring',
    ...spring.gentle,
  } satisfies Transition,

  /** Snappy spring — for micro-interactions */
  snappy: {
    type: 'spring',
    ...spring.snappy,
  } satisfies Transition,
} as const

export type TransitionKey = keyof typeof transitions

// ─── Page Transition Variants ───────────────────────────────────────

export const pageTransition: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

// ─── Fade Variants ─────────────────────────────────────────────────

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// ─── Slide Variants ────────────────────────────────────────────────

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// ─── Scale Variants ────────────────────────────────────────────────

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

// ─── Stagger Variants ──────────────────────────────────────────────

export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

// ─── Micro-Interaction Variants ────────────────────────────────────

/** Press/tap feedback — scale down slightly + subtle opacity drop */
export const pressAnimation = { scale: 0.96, opacity: 0.9 } satisfies Variant

/** Hover feedback (desktop only) — subtle scale up */
export const hoverAnimation = { scale: 1.02 } satisfies Variant

// ─── Tab Indicator ─────────────────────────────────────────────────

export const tabIndicatorTransition: Transition = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
}

// ─── Bottom Sheet Variants ─────────────────────────────────────────

export const bottomSheet: Variants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' },
}

// ─── Like/Heart Animation ──────────────────────────────────────────

export const likeAnimation = {
  scale: [1, 1.2, 1] as const,
  transition: { duration: 0.3 },
}

// ─── Now Playing Marquee ───────────────────────────────────────────

export const marquee: Variants = {
  animate: {
    x: [0, -100],
    transition: { duration: 10, repeat: Infinity, ease: 'linear' },
  },
}

// ─── Ambient Glow Pulse ────────────────────────────────────────────

export const glowPulse = {
  opacity: [0.8, 1, 0.8] as const,
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
}

// ─── Reusable Variants Map ─────────────────────────────────────────

/**
 * Map of all reusable animation variants for easy programmatic access.
 */
export const variants = {
  pageTransition,
  fadeIn,
  slideUp,
  slideDown,
  scaleIn,
  staggerContainer,
  staggerItem,
  bottomSheet,
} as const

export type VariantKey = keyof typeof variants
