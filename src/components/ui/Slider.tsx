import { useRef, useCallback, type PointerEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

interface SliderProps {
  value?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onDragStart,
  onDragEnd,
  disabled = false,
  size = 'md',
  className,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return value
      const rect = track.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const ratio = x / rect.width
      const range = max - min
      const rawValue = min + ratio * range
      if (step <= 0) return Math.round(rawValue)
      return Math.round(rawValue / step) * step
    },
    [min, max, step, value],
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return
      isDragging.current = true
      onDragStart?.()
      const newValue = getValueFromPosition(e.clientX)
      onChange?.(newValue)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [disabled, getValueFromPosition, onChange, onDragStart],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current || disabled) return
      const newValue = getValueFromPosition(e.clientX)
      onChange?.(newValue)
    },
    [disabled, getValueFromPosition, onChange],
  )

  const handlePointerUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      onDragEnd?.()
    }
  }, [onDragEnd])

  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0
  // Minimum 28px thumb per spec (small slider uses 28px, large uses 32px)
  const thumbSize = size === 'sm' ? 28 : 32
  const trackHeight = size === 'sm' ? 'h-1' : 'h-1.5'

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      const keyStep = e.shiftKey ? step * 10 : step
      let newValue = value
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault()
          newValue = Math.min(max, value + keyStep)
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault()
          newValue = Math.max(min, value - keyStep)
          break
        case 'Home':
          e.preventDefault()
          newValue = min
          break
        case 'End':
          e.preventDefault()
          newValue = max
          break
        default:
          return
      }
      onChange?.(Math.round(newValue / step) * step)
    },
    [disabled, min, max, step, value, onChange],
  )

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative flex items-center touch-none select-none py-2',
        'cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ambient-900 rounded-lg',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${Math.round(progress)}%`}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Track */}
      <div
        className={cn(
          'relative w-full rounded-full bg-glass-300 overflow-hidden',
          trackHeight,
        )}
      >
        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent-primary transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Thumb */}
      <div
        className={cn(
          'absolute rounded-full bg-white shadow-ambient',
          'pointer-events-none',
          'transition-transform duration-100',
          'active:scale-125',
        )}
        style={{
          width: thumbSize,
          height: thumbSize,
          left: `calc(${progress}% - ${thumbSize / 2}px)`,
        }}
      />
    </div>
  )
}

export default Slider
