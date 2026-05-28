/**
 * PageTransition — wraps page content with cinematic page transition.
 *
 * Spec: Motion Language §4.1 — Page Transitions
 * - fade + scale(0.95 → 1) for route enter
 * - fade + scale(1 → 0.95) for route exit
 * - 800ms cinematic easing
 * - AnimatePresence mode="wait" — exit completes before enter
 * - Respects prefers-reduced-motion (instant mount)
 *
 * GPU-composited: transform (scale) + opacity
 *
 * Usage:
 *   <PageTransition routeKey={location.pathname}>
 *     <YourPage />
 *   </PageTransition>
 */

import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'
import { pageTransition, transitions } from '@/lib/motion'

interface PageTransitionProps {
  children: ReactNode
  /** Route path — used as AnimatePresence key for enter/exit detection */
  routeKey: string
  className?: string
}

export function PageTransition({
  children,
  routeKey,
  className,
}: PageTransitionProps) {
  const shouldReduce = useReducedMotion()

  if (shouldReduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        className={cn('outline-none', className)}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transitions.cinematic}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
