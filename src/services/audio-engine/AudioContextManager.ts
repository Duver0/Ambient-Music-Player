/**
 * AudioContextManager
 *
 * Singleton manager for Web Audio API AudioContext lifecycle.
 * - SINGLE AudioContext instance (never create multiple)
 * - Auto-recreate if state becomes 'closed'
 * - Auto-resume if state is 'suspended' (autoplay policy)
 * - State change listener for interruption detection
 * - iOS: creation deferred to first user gesture
 */

import type { AudioError } from './types'

export class AudioContextManager {
  private ctx: AudioContext | null = null
  private stateChangeHandler: ((event: Event) => void) | null = null
  private onStateChangeCallback: ((state: string) => void) | null = null

  /**
   * Register a callback for AudioContext state changes.
   * Used by the engine to detect interruptions (suspended) and restorations (running).
   */
  setOnStateChangeCallback(callback: (state: string) => void): void {
    this.onStateChangeCallback = callback
  }

  /**
   * Get or create the AudioContext.
   * Must be called from a user gesture handler on first invocation (iOS requirement).
   * Auto-recreates if closed, auto-resumes if suspended.
   */
  async getContext(): Promise<AudioContext> {
    // Auto-recreate if null or closed
    if (!this.ctx || this.ctx.state === 'closed') {
      this.createContext()
    }

    // Auto-resume if suspended (autoplay policy or interruption)
    if (this.ctx!.state === 'suspended') {
      await this.ctx!.resume()
    }

    return this.ctx!
  }

  /**
   * Create a new AudioContext and attach state change listener.
   */
  private createContext(): void {
    // Clean up previous listener if recreating
    if (this.ctx && this.stateChangeHandler) {
      this.ctx.removeEventListener('statechange', this.stateChangeHandler)
    }

    this.ctx = new AudioContext()

    // Set up state change listener for interruption detection
    this.stateChangeHandler = () => {
      if (!this.ctx) return
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(this.ctx.state)
      }
    }
    this.ctx.addEventListener('statechange', this.stateChangeHandler)
  }

  /**
   * Resume the AudioContext if suspended.
   */
  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  /**
   * Suspend the AudioContext.
   */
  async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend()
    }
  }

  /**
   * Close the AudioContext and release resources.
   */
  async close(): Promise<void> {
    if (this.stateChangeHandler && this.ctx) {
      this.ctx.removeEventListener('statechange', this.stateChangeHandler)
      this.stateChangeHandler = null
    }

    if (this.ctx && this.ctx.state !== 'closed') {
      await this.ctx.close()
    }
    this.ctx = null
    this.onStateChangeCallback = null
  }

  /**
   * Check whether a user gesture is needed (no context or context is suspended).
   */
  needsUserGesture(): boolean {
    return this.ctx === null || this.ctx.state === 'suspended'
  }

  /**
   * Get the current AudioContext (may be null before first gesture).
   */
  getCurrentContext(): AudioContext | null {
    return this.ctx
  }

  /**
   * Get a descriptive error for the current context state, or null if healthy.
   */
  getContextError(): AudioError | null {
    if (!this.ctx) {
      return {
        type: 'CONTEXT_SUSPENDED',
        message: 'AudioContext not yet created — requires user gesture',
      }
    }
    if (this.ctx.state === 'closed') {
      return {
        type: 'CONTEXT_CLOSED',
        message: 'AudioContext was closed (iOS timeout or browser policy)',
      }
    }
    if (this.ctx.state === 'suspended') {
      return {
        type: 'CONTEXT_SUSPENDED',
        message: 'AudioContext is suspended — requires user gesture to resume',
      }
    }
    return null
  }
}

/**
 * Singleton instance — exported for use across the engine.
 * Never create another AudioContextManager in this app.
 */
export const audioContextManager = new AudioContextManager()
