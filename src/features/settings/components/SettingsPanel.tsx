import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { formatFileSize } from '@/lib/utils'

/**
 * SettingsPanel — Settings view (Tier 2 — SMART).
 *
 * Sections: Playback, Appearance, Storage, About.
 * Connects to settingsStore for all preferences.
 */
export function SettingsPanel() {
  // ── Selectors (primitives only) ─────────────────────────────────────

  const theme = useSettingsStore((s) => s.theme)
  const audioQuality = useSettingsStore((s) => s.audioQuality)
  const crossfadeEnabled = useSettingsStore((s) => s.crossfadeEnabled)
  const crossfadeDuration = useSettingsStore((s) => s.crossfadeDuration)
  const rememberPlaybackPosition = useSettingsStore((s) => s.rememberPlaybackPosition)
  const autoResumeOnStart = useSettingsStore((s) => s.autoResumeOnStart)
  const storageUsage = useSettingsStore((s) => s.storageUsage)
  const storageQuota = useSettingsStore((s) => s.storageQuota)

  const setTheme = useSettingsStore((s) => s.setTheme)
  const setAudioQuality = useSettingsStore((s) => s.setAudioQuality)
  const setCrossfadeEnabled = useSettingsStore((s) => s.setCrossfadeEnabled)
  const setCrossfadeDuration = useSettingsStore((s) => s.setCrossfadeDuration)
  const setRememberPlaybackPosition = useSettingsStore((s) => s.setRememberPlaybackPosition)
  const setAutoResumeOnStart = useSettingsStore((s) => s.setAutoResumeOnStart)
  const updateStorageInfo = useSettingsStore((s) => s.updateStorageInfo)
  const clearAllData = useSettingsStore((s) => s.clearAllData)

  // Fetch storage info on mount
  useEffect(() => {
    updateStorageInfo()
  }, [updateStorageInfo])

  const storagePercent =
    storageQuota > 0
      ? Math.round((storageUsage / storageQuota) * 100)
      : 0

  // ── Toggle switch ──────────────────────────────────────────────────

  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean
    onChange: () => void
    label: string
  }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-12 min-h-[44px] flex items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-accent-primary' : 'bg-glass-400'
      }`}
      aria-label={label}
      role="switch"
      aria-checked={checked}
    >
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-ambient transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page Title */}
      <div className="px-sp-4 pt-sp-4 pb-sp-2">
        <h1 className="text-heading font-display font-semibold text-text-primary">
          Settings
        </h1>
      </div>

      <div className="flex flex-col gap-sp-4 px-sp-4 pb-sp-8">
        {/* ── Playback Section ──────────────────────────────────────── */}
        <Card variant="glass" padding="md">
          <h2 className="text-body font-semibold text-text-primary mb-sp-4">
            Playback
          </h2>

          {/* Crossfade toggle */}
          <div className="flex items-center justify-between mb-sp-3">
            <span className="text-body-sm text-text-primary">Crossfade</span>
            <Toggle
              checked={crossfadeEnabled}
              onChange={() => setCrossfadeEnabled(!crossfadeEnabled)}
              label="Toggle crossfade"
            />
          </div>

          {/* Crossfade duration */}
          {crossfadeEnabled && (
            <div className="mb-sp-4 pl-sp-2">
              <div className="flex justify-between mb-sp-1">
                <span className="text-caption text-text-secondary">
                  Duration
                </span>
                <span className="text-caption text-text-tertiary tabular-nums">
                  {crossfadeDuration}s
                </span>
              </div>
              <Slider
                value={crossfadeDuration}
                min={1}
                max={12}
                step={1}
                size="sm"
                onChange={setCrossfadeDuration}
              />
            </div>
          )}

          {/* Audio Quality */}
          <div className="flex items-center justify-between mb-sp-3">
            <span className="text-body-sm text-text-primary">
              Audio Quality
            </span>
            <div className="flex gap-sp-1">
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <Button
                  key={quality}
                  variant={audioQuality === quality ? 'primary' : 'glass'}
                  size="sm"
                  onClick={() => setAudioQuality(quality)}
                >
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Remember Position */}
          <div className="flex items-center justify-between mb-sp-3">
            <span className="text-body-sm text-text-primary">
              Remember Position
            </span>
            <Toggle
              checked={rememberPlaybackPosition}
              onChange={() =>
                setRememberPlaybackPosition(!rememberPlaybackPosition)
              }
              label="Toggle remember position"
            />
          </div>

          {/* Auto-Resume */}
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-text-primary">
              Auto-Resume on Start
            </span>
            <Toggle
              checked={autoResumeOnStart}
              onChange={() => setAutoResumeOnStart(!autoResumeOnStart)}
              label="Toggle auto-resume"
            />
          </div>
        </Card>

        {/* ── Appearance Section ────────────────────────────────────── */}
        <Card variant="glass" padding="md">
          <h2 className="text-body font-semibold text-text-primary mb-sp-4">
            Appearance
          </h2>

          <div className="flex items-center justify-between">
            <span className="text-body-sm text-text-primary">Theme</span>
            <div className="flex gap-sp-1">
              {(['dark', 'light'] as const).map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? 'primary' : 'glass'}
                  size="sm"
                  onClick={() => setTheme(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Storage Section ───────────────────────────────────────── */}
        <Card variant="glass" padding="md">
          <h2 className="text-body font-semibold text-text-primary mb-sp-4">
            Storage
          </h2>

          {/* Usage bar */}
          <div className="mb-sp-4">
            <div className="flex justify-between mb-sp-2">
              <span className="text-body-sm text-text-secondary">
                {formatFileSize(storageUsage)} used
              </span>
              {storageQuota > 0 && (
                <span className="text-caption text-text-tertiary">
                  {formatFileSize(storageQuota)} total
                </span>
              )}
            </div>
            <div className="w-full h-2 rounded-full bg-glass-300 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-primary transition-all duration-300"
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllData}
          >
            Clear All Data
          </Button>
        </Card>

        {/* ── About Section ─────────────────────────────────────────── */}
        <Card variant="glass" padding="md">
          <h2 className="text-body font-semibold text-text-primary mb-sp-4">
            About
          </h2>

          <div className="flex flex-col gap-sp-3">
            <div className="flex justify-between">
              <span className="text-body-sm text-text-secondary">
                Version
              </span>
              <span className="text-body-sm text-text-primary">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-text-secondary">Build</span>
              <span className="text-body-sm text-text-primary">
                2026.05.27
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SettingsPanel
