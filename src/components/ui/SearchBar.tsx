import { useRef, useEffect } from 'react'
import { cn } from '@/lib/cn'
import { SearchIcon } from './icons/SearchIcon'
import { CloseIcon } from './icons/CloseIcon'

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  onClear?: () => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  autoFocus = false,
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleClear = () => {
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-sp-3 px-sp-4 h-11 rounded-xl',
        'bg-glass-200 backdrop-blur-glass',
        'border border-glass-300',
        'focus-within:border-accent-primary/50 focus-within:bg-glass-300',
        'transition-all duration-200',
        className,
      )}
    >
      <SearchIcon
        size={18}
        className="text-text-tertiary shrink-0"
      />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'flex-1 bg-transparent text-body text-text-primary placeholder:text-text-tertiary',
          'outline-none border-none min-h-[44px]',
        )}
        autoFocus={autoFocus}
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-text-tertiary hover:text-text-primary hover:bg-glass-400 transition-colors -mr-2"
          aria-label="Clear search"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  )
}

export default SearchBar
