import { SettingsPanel } from '@/features/settings/components/SettingsPanel'

/**
 * SettingsPage — App preferences and configuration.
 *
 * Tier 1 — SMART component (page).
 * Routes to this page render the settings panel with playback,
 * appearance, storage, and about sections.
 *
 * The AppShell (layout) provides bottom navigation and
 * mini-player if a track is playing.
 */
export default function SettingsPage() {
  return <SettingsPanel />
}
