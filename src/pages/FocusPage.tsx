import { FocusSession } from '@/features/focus-timer/components/FocusSession'

/**
 * FocusPage — Timer + ambient mix for focus sessions.
 *
 * Tier 1 — SMART component (page).
 * Routes to this page render the Pomodoro-style focus timer
 * with ambient sound level controls.
 *
 * The AppShell (layout) provides bottom navigation and
 * mini-player if a track is playing.
 */
export default function FocusPage() {
  return <FocusSession />
}
