/**
 * BottomSheet — animated bottom sheet with drag to dismiss.
 *
 * Spec: Motion Language §4.4 — Gesture Animations
 * - drag="y" with snap points
 * - dragElastic: 0 at bottom (stops at snap), 0.3 at top
 * - Background scrim: opacity based on sheet position
 * - Snap animation: spring (damping: 30, stiffness: 300)
 * - Handle drag indicator at top
 * - Respects prefers-reduced-motion (uses simple fade)
 *
 * GPU-composited: transform (translateY) + opacity
 */

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'
import { bottomSheet } from '@/lib/motion'

interface BottomSheetProps {
  /** Whether the sheet is visible */
  isOpen: boolean
  /** Called when the sheet is dismissed */
  onClose: () => void
  children: ReactNode
  /** Snap points as percentage strings of viewport height (default: ['30%', '70%', '95%']) */
  snapPoints?: string[]
  className?: string
}

/**
 * Parse a percentage string like '30%' to a decimal (0.3).
 */
function parseSnapPoint(point: string): number {
  const parsed = parseFloat(point)
  if (Number.isNaN(parsed)) return 0.95
  return Math.min(Math.max(parsed / 100, 0), 1)
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = ['30%', '70%', '95%'],
  className,
}: BottomSheetProps) {
  const shouldReduce = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [sheetHeight, setSheetHeight] = useState(0)
  const dragY = useMotionValue(0)

  // Convert snap point percentages to pixel y-offsets
  const snapOffsets = snapPoints.map((point) => {
    const ratio = parseSnapPoint(point)
    return sheetHeight * (1 - ratio)
  })

  // Current snap index (0 = most open / topmost snap point)
  const [currentSnap, setCurrentSnap] = useState(0)

  // Measure sheet height on mount and resize
  useEffect(() => {
    if (!isOpen) return

    const measure = () => {
      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.scrollHeight)
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (sheetRef.current) {
      observer.observe(sheetRef.current)
    }

    return () => observer.disconnect()
  }, [isOpen])

  // Scrim opacity: 0 when sheet is off-screen, 1 when fully visible
  const scrimOpacity = useTransform(
    dragY,
    [0, sheetHeight],
    [0.6, 0],
  )

  // Find the nearest snap point to the current y-offset
  const findNearestSnap = useCallback(
    (yOffset: number): number => {
      if (snapOffsets.length === 0) return 0

      let nearest = 0
      let minDist = Infinity

      snapOffsets.forEach((offset, index) => {
        const dist = Math.abs(yOffset - offset)
        if (dist < minDist) {
          minDist = dist
          nearest = index
        }
      })

      return nearest
    },
    [snapOffsets],
  )

  const handleDragEnd = useCallback(
    (
      _: unknown,
      info: { offset: { y: number }; velocity: { y: number } },
    ) => {
      const currentY = info.offset.y
      const velocityY = info.velocity.y

      // If swiped down fast or far past the last snap point, dismiss
      const lastSnap = snapOffsets[snapOffsets.length - 1] ?? sheetHeight * 0.05
      if (currentY > lastSnap + 50 || velocityY > 300) {
        onClose()
        return
      }

      // If swiped up past the first snap point, go to most open snap
      if (currentY < 0 || velocityY < -300) {
        setCurrentSnap(0)
        return
      }

      // Snap to nearest
      const nearest = findNearestSnap(currentY)
      setCurrentSnap(nearest)
    },
    [snapOffsets, sheetHeight, findNearestSnap, onClose],
  )

  // Close on Escape key
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    },
    [onClose],
  )

  // Handle reduced motion: simple fade overlay
  if (shouldReduce) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-sheet flex items-end"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onKeyDown={handleContainerKeyDown}
          >
            {/* Scrim */}
            <div
              className="absolute inset-0 bg-scrim"
              onClick={onClose}
              role="presentation"
            />
            {/* Sheet */}
            <div
              className={cn(
                'relative w-full rounded-t-2xl bg-ambient-800',
                'pb-[env(safe-area-inset-bottom,0px)]',
                className,
              )}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-sheet flex items-end"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onKeyDown={handleContainerKeyDown}
        >
          {/* Scrim */}
          <motion.div
            className="absolute inset-0 bg-scrim"
            style={{ opacity: scrimOpacity }}
            onClick={onClose}
            role="presentation"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className={cn(
              'relative w-full rounded-t-2xl bg-ambient-800',
              'pb-[env(safe-area-inset-bottom,0px)]',
              'shadow-ambient',
              className,
            )}
            variants={bottomSheet}
            initial="hidden"
            animate={currentSnap === 0 ? 'visible' : {
              y: snapOffsets[currentSnap] ?? 0,
            }}
            exit="exit"
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 1,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: sheetHeight }}
            dragElastic={{ top: 0.3, bottom: 0 }}
            style={{ y: dragY }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle indicator — touch-action: none prevents
                iOS gesture conflicts with scroll/pan */}
            <div
              className="flex justify-center pt-sp-3 pb-sp-2"
              style={{ touchAction: 'none' }}
            >
              <div className="w-10 h-1 rounded-full bg-glass-400" />
            </div>

            {/* Sheet content */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BottomSheet
