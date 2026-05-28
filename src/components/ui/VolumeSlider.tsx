import { useCallback } from 'react'
import { cn } from '@/lib/cn'
import { VolumeIcon } from './icons/VolumeIcon'
import { VolumeMuteIcon } from './icons/VolumeMuteIcon'
import { Slider } from './Slider'

interface VolumeSliderProps {
  value?: number
  onChange?: (value: number) => void
  className?: string
}

export function VolumeSlider({
  value = 0.5,
  onChange,
  className,
}: VolumeSliderProps) {
  const isMuted = value === 0

  const handleSliderChange = useCallback(
    (val: number) => {
      onChange?.(val / 100)
    },
    [onChange],
  )

  const toggleMute = useCallback(() => {
    if (isMuted) {
      onChange?.(0.5)
    } else {
      onChange?.(0)
    }
  }, [isMuted, onChange])

  // Convert 0-1 to 0-100 for slider
  const sliderValue = Math.round(value * 100)

  return (
    <div className={cn('flex items-center gap-sp-3', className)}>
      <button
        type="button"
        onClick={toggleMute}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-200 transition-colors shrink-0"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeMuteIcon size={20} />
        ) : (
          <VolumeIcon size={20} />
        )}
      </button>

      <div className="flex-1">
        <Slider
          value={sliderValue}
          min={0}
          max={100}
          step={1}
          size="sm"
          onChange={handleSliderChange}
        />
      </div>
    </div>
  )
}

export default VolumeSlider
