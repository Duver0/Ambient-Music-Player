/**
 * Motion lib barrel — re-exports all animation config.
 *
 * Spec: Motion Language §10 — Implementation Standards
 * All agents import from this barrel, never from individual config files.
 */

export { easings, spring } from './easings'
export type { EasingKey, SpringKey } from './easings'

export {
  transitions,
  pageTransition,
  fadeIn,
  slideUp,
  slideDown,
  scaleIn,
  staggerContainer,
  staggerItem,
  pressAnimation,
  hoverAnimation,
  tabIndicatorTransition,
  bottomSheet,
  likeAnimation,
  marquee,
  glowPulse,
  variants,
} from './config'

export type { TransitionKey, VariantKey } from './config'
