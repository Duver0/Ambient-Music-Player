/**
 * StaggerItem — individual item within a StaggerList.
 *
 * Spec: Motion Language §4.3 — List & Stagger Animations
 * - Each item fades in and slides up 12px
 * - Must be a direct child of StaggerList
 * - Respects prefers-reduced-motion (parent disables stagger entirely)
 *
 * GPU-composited: transform (translateY) + opacity
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { staggerItem, transitions } from '@/lib/motion'

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={staggerItem}
      transition={transitions.enter}
    >
      {children}
    </motion.div>
  )
}

export default StaggerItem
