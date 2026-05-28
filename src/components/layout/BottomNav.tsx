import { cn } from '@/lib/cn'
import { LibraryIcon } from '@/components/ui/icons/LibraryIcon'
import { PlayIcon } from '@/components/ui/icons/PlayIcon'
import { FocusIcon } from '@/components/ui/icons/FocusIcon'
import { SettingsIcon } from '@/components/ui/icons/SettingsIcon'

type TabId = 'library' | 'player' | 'focus' | 'settings'

interface TabDefinition {
  id: TabId
  label: string
  icon: typeof LibraryIcon
}

const tabs: TabDefinition[] = [
  { id: 'library', label: 'Library', icon: LibraryIcon },
  { id: 'player', label: 'Player', icon: PlayIcon },
  { id: 'focus', label: 'Focus', icon: FocusIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

interface BottomNavProps {
  activeTab?: TabId
  onTabChange?: (tab: TabId) => void
  className?: string
}

/**
 * BottomNav — Bottom tab navigation bar.
 *
 * Tier 5 — DUMB component (layout).
 * Renders the four primary navigation tabs:
 * Library, Player (default), Focus, Settings.
 * Handles safe area padding at the bottom via glass-default + pt/spacing.
 * Labels hidden on screens < 360px via responsive CSS.
 */
export function BottomNav({
  activeTab = 'player',
  onTabChange,
  className,
}: BottomNavProps) {
  return (
    <nav
      className={cn(
        'flex items-center justify-around',
        'h-16 safe-area-footer pt-sp-2',
        'bg-glass-200 backdrop-blur-glass',
        'border-t border-glass-300',
        'z-nav',
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5',
              'min-w-[44px] min-h-[44px] px-3 py-1 rounded-xl',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
              isActive
                ? 'text-accent-primary'
                : 'text-text-tertiary hover:text-text-secondary',
            )}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={24} />
            <span
              className={cn(
                'text-caption font-medium',
                'hidden min-[360px]:block',
              )}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
