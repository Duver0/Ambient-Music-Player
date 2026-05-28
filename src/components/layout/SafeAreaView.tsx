import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type SafeAreaEdge = 'top' | 'bottom' | 'left' | 'right'

interface SafeAreaViewProps {
  children: ReactNode
  /** Edges to apply safe area padding to. */
  edges?: SafeAreaEdge[] | 'all' | 'none'
  className?: string
}

const edgeToClass: Record<SafeAreaEdge, string> = {
  top: 'safe-area-top',
  bottom: 'safe-area-bottom',
  left: 'safe-area-left',
  right: 'safe-area-right',
}

/**
 * SafeAreaView — Wraps content with safe area padding.
 *
 * Tier 5 — DUMB component (layout).
 * Applies iOS safe area insets to protect content from notches and home indicators.
 * Uses CSS classes from safe-area.css for env() support.
 */
export function SafeAreaView({
  children,
  edges = 'all',
  className,
}: SafeAreaViewProps) {
  const edgeClasses =
    edges === 'all'
      ? 'safe-area-all'
      : edges === 'none'
        ? ''
        : edges.map((edge) => edgeToClass[edge]).join(' ')

  return <div className={cn(edgeClasses, className)}>{children}</div>
}

export default SafeAreaView
