import { useState } from 'react'
import { cn } from '@/lib/cn'
import { PlayIcon } from './icons/PlayIcon'

interface AlbumArtProps {
  src: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isPlaying?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-[200px] h-[200px]',
  xl: 'w-[280px] h-[280px]',
}

const iconSizes = {
  sm: 14,
  md: 20,
  lg: 32,
  xl: 40,
}

export function AlbumArt({
  src,
  size = 'md',
  isPlaying = false,
  className,
}: AlbumArtProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={cn(
        'relative aspect-square rounded-xl overflow-hidden shrink-0',
        'bg-gradient-base',
        sizeStyles[size],
        isPlaying && 'shadow-glow',
        className,
      )}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt="Album artwork"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        /* Gradient placeholder */
        <div className="w-full h-full bg-gradient-to-br from-accent-primary/20 to-accent-glow/20 flex items-center justify-center">
          <PlayIcon
            size={iconSizes[size]}
            className="text-text-tertiary/40"
          />
        </div>
      )}

      {/* Playing glow overlay */}
      {isPlaying && (
        <div
          className={cn(
            'absolute inset-0 rounded-xl',
            'ring-1 ring-accent-primary/20',
            'animate-pulse',
          )}
        />
      )}
    </div>
  )
}

export default AlbumArt
