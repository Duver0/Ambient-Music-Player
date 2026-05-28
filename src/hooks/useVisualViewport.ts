import { useState, useEffect } from 'react'

interface VisualViewportInfo {
  /** The visual viewport height in CSS pixels. */
  height: number
  /** The visual viewport width in CSS pixels. */
  width: number
  /** Offset from top of layout viewport (toolbar height on iOS). */
  offsetTop: number
  /** Whether the keyboard is likely visible (viewport height < window.innerHeight). */
  isKeyboardVisible: boolean
}

/**
 * useVisualViewport — Tracks the iOS visual viewport for keyboard and toolbar handling.
 *
 * iOS Safari has a dynamic toolbar that appears/disappears on scroll and the
 * keyboard that pushes the viewport up. This hook listens to window.visualViewport
 * resize/scroll events and provides up-to-date dimensions.
 *
 * Spec reference: ios-pwa-mitigations.md §5.4 (Keyboard Handling),
 *                 §5.2 (Viewport Mitigations)
 *
 * Usage:
 *   const { height, isKeyboardVisible } = useVisualViewport()
 *   // When isKeyboardVisible is true, adjust layout to avoid keyboard overlap
 *
 * Returns default window dimensions if visualViewport is not supported.
 */
export function useVisualViewport(): VisualViewportInfo {
  const [info, setInfo] = useState<VisualViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return { height: 0, width: 0, offsetTop: 0, isKeyboardVisible: false }
    }
    const vv = window.visualViewport
    return {
      height: vv?.height ?? window.innerHeight,
      width: vv?.width ?? window.innerWidth,
      offsetTop: vv?.offsetTop ?? 0,
      isKeyboardVisible: false,
    }
  })

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handleResize = () => {
      const windowHeight = window.innerHeight
      const keyboardVisible = vv.height < windowHeight - 50 // 50px threshold for toolbar
      setInfo({
        height: vv.height,
        width: vv.width,
        offsetTop: vv.offsetTop,
        isKeyboardVisible: keyboardVisible,
      })
    }

    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)

    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
    }
  }, [])

  return info
}

export default useVisualViewport
