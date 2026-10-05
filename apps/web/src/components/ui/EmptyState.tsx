import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center mb-4 text-ink-tertiary">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-ink-secondary max-w-xs text-balance">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
