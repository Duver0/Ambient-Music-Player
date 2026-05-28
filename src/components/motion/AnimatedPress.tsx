/**
 * AnimatedPress — wraps any component with whileTap + whileHover scale feedback.
 *
 * Spec: Motion Language §4.2 — Micro-Interactions
 * - Button press: scale(0.96) + opacity to 0.9 (100ms)
 * - Hover (desktop only): scale(1.02)
 * - Respects prefers-reduced-motion
 *
 * GPU-composited properties only: transform, opacity
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'
import { pressAnimation, hoverAnimation } from '@/lib/motion'

interface AnimatedPressProps {
  children: ReactNode
  /** Scale value on press/tap (default: 0.96) */
  scale?: number
  className?: string
  /** Disable animations entirely */
  disabled?: boolean
}

export function AnimatedPress({
  children,
  scale = 0.96,
  className,
  disabled = false,
}: AnimatedPressProps) {
  const shouldReduce = useReducedMotion()

  if (shouldReduce || disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn('contents', className)}
      whileTap={{ ...pressAnimation, scale }}
      whileHover={hoverAnimation}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedPress
