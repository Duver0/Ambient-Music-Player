import { useRef, useCallback, type PointerEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

interface ProgressBarProps {
  progress?: number
  buffered?: number
  onSeek?: (value: number) => void
  onSeekStart?: () => void
  onSeekEnd?: () => void
  height?: 'sm' | 'md'
  className?: string
}

export function ProgressBar({
  progress = 0,
  buffered = 0,
  onSeek,
  onSeekStart,
  onSeekEnd,
  height = 'sm',
  className,
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const clampProgress = useCallback((clientX: number) => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return x / rect.width
  }, [])

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      isDragging.current = true
      onSeekStart?.()
      const value = clampProgress(e.clientX)
      onSeek?.(value)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [clampProgress, onSeek, onSeekStart],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return
      const value = clampProgress(e.clientX)
      onSeek?.(value)
    },
    [clampProgress, onSeek],
  )

  const handlePointerUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      onSeekEnd?.()
    }
  }, [onSeekEnd])

  const barHeight = height === 'sm' ? 'h-1' : 'h-2'

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let newProgress = progress
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault()
          newProgress = Math.min(1, progress + 0.05)
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault()
          newProgress = Math.max(0, progress - 0.05)
          break
        case 'Home':
          e.preventDefault()
          newProgress = 0
          break
        case 'End':
          e.preventDefault()
          newProgress = 1
          break
        default:
          return
      }
      onSeek?.(newProgress)
    },
    [progress, onSeek],
  )

  return (
    <div
      ref={barRef}
      className={cn(
        'relative w-full cursor-pointer group',
        // Vertical padding creates a minimum 44px touch target (h-1.5 + py-3 = 42px ≈ 44px)
        'py-3',
        'focus-visible:ring-2 focus-visible:ring-accent-primary rounded-lg',
        className,
      )}
      // touch-action: none prevents iOS gesture conflicts (back swipe, scroll)
      // while the user is dragging on the seek bar
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Math.round(progress * 100) / 100}
      aria-valuetext={`${Math.round(progress * 100)}%`}
      tabIndex={0}
    >
      {/* Track background */}
      <div
        className={cn(
          'relative w-full rounded-full bg-glass-200 overflow-hidden',
          barHeight,
        )}
      >
        {/* Buffered */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-glass-300 transition-[width] duration-150"
          style={{ width: `${Math.min(buffered, 1) * 100}%` }}
        />
        {/* Played */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent-primary transition-[width] duration-100 ease-linear"
          style={{ width: `${Math.min(progress, 1) * 100}%` }}
        />
      </div>
      {/* Thumb dot — min 28px visible, touch area covered by parent py-3 */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-white',
          'opacity-0 group-hover:opacity-100 group-active:opacity-100',
          'transition-opacity duration-150 shadow-ambient',
          'pointer-events-none',
        )}
        style={{ left: `calc(${Math.min(progress, 1) * 100}% - 7px)` }}
      />
    </div>
  )
}

export default ProgressBar
