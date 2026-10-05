import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-primary-400 to-primary-600',
    'from-sky-400 to-sky-600',
    'from-teal-400 to-teal-600',
    'from-emerald-400 to-emerald-600',
    'from-cyan-400 to-cyan-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizes[size],
          className
        )}
      />
    )
  }

  const displayName = name ?? '?'
  const gradientClass = name ? getAvatarColor(name) : 'from-slate-400 to-slate-500'

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br text-white font-semibold select-none',
        gradientClass,
        sizes[size],
        className
      )}
      aria-label={displayName}
    >
      {getInitials(displayName)}
    </div>
  )
}
