import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  level?: 'primary' | 'secondary' | 'floating'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
  hoverable?: boolean
}

const levels = {
  primary: 'surface-card-primary',
  secondary: 'surface-card',
  floating: 'glass shadow-float rounded-2xl',
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
}

export default function Card({
  children,
  className,
  level = 'secondary',
  padding = 'md',
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        levels[level],
        paddings[padding],
        hoverable && 'cursor-pointer transition-shadow duration-200 hover:shadow-card-hover',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('font-semibold text-ink text-base', className)}>
      {children}
    </h3>
  )
}
