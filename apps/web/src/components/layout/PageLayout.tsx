import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
}

const maxWidths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export default function PageLayout({ children, className, maxWidth = '7xl' }: PageLayoutProps) {
  return (
    <main className={cn('min-h-screen pt-14 gradient-bg', className)}>
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8', maxWidths[maxWidth])}>
        {children}
      </div>
    </main>
  )
}

export function SectionTitle({
  children,
  description,
  className,
  action,
}: {
  children: React.ReactNode
  description?: string
  className?: string
  action?: React.ReactNode
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div>
        <h2 className="text-xl font-display font-bold text-ink">{children}</h2>
        {description && (
          <p className="mt-1 text-sm text-ink-secondary">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
