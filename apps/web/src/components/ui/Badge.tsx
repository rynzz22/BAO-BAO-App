import { cn } from '@/lib/utils'
import type { TrackingSource } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'live' | 'reported' | 'terminal' | 'offline' | 'pending' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  dot?: boolean
  size?: 'sm' | 'md'
}

const variants = {
  live: 'badge-live',
  reported: 'badge-reported',
  terminal: 'badge-terminal',
  offline: 'badge-offline',
  pending: 'bg-amber-50 text-amber-700',
  success: 'bg-status-live-bg text-status-live',
  warning: 'bg-status-reported-bg text-status-reported',
  error: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-slate-100 text-slate-600',
}

export default function Badge({ children, className, variant = 'neutral', dot = true, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            variant === 'live' && 'bg-status-live animate-pulse-dot',
            variant === 'reported' && 'bg-status-reported',
            variant === 'terminal' && 'bg-status-terminal',
            variant === 'offline' && 'bg-status-offline',
            variant === 'pending' && 'bg-amber-500',
            variant === 'success' && 'bg-status-live',
            variant === 'warning' && 'bg-status-reported',
            variant === 'error' && 'bg-red-500',
            variant === 'info' && 'bg-sky-500',
            variant === 'neutral' && 'bg-slate-400',
          )}
        />
      )}
      {children}
    </span>
  )
}

// Convenience exports
export function TrackingBadge({ source }: { source: TrackingSource }) {
  const map: Record<TrackingSource, { variant: BadgeProps['variant']; label: string }> = {
    LIVE_APP: { variant: 'live', label: 'Live' },
    LAST_REPORTED: { variant: 'reported', label: 'Reported' },
    TERMINAL: { variant: 'terminal', label: 'Terminal' },
    GPS_TRACKER: { variant: 'live', label: 'GPS' },
    UNKNOWN: { variant: 'offline', label: 'Unknown' },
  }
  const { variant, label } = map[source] ?? { variant: 'neutral', label: source }
  return <Badge variant={variant}>{label}</Badge>
}
