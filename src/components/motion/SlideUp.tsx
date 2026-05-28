/**
 * SlideUp — wraps content with slide-up + fade entrance.
 *
 * Spec: Motion Language §4 — Animation Categories
 * - Elements slide up 20px (configurable) while fading in
 * - Used for: bottom sheets, panels, list items
 * - Respects prefers-reduced-motion
 *
 * GPU-composited: transform (translateY) + opacity
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'
import { transitions } from '@/lib/motion'

interface SlideUpProps {
  children: ReactNode
  /** Delay before animation starts (seconds) */
  delay?: number
  /** Animation duration (seconds) */
  duration?: number
  /** Distance to slide up in pixels */
  distance?: number
  className?: string
}

export function SlideUp({
  children,
  delay = 0,
  duration = 0.3,
  distance = 20,
  className,
}: SlideUpProps) {
  const shouldReduce = useReducedMotion()

  if (shouldReduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -distance }}
      transition={{ duration, delay, ease: transitions.enter.ease }}
    >
      {children}
    </motion.div>
  )
}

export default SlideUp
