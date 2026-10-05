import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-frost hover:shadow-frost-md',
  secondary:
    'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 border border-primary-200',
  ghost:
    'bg-transparent text-ink-secondary hover:bg-surface-subtle hover:text-ink active:bg-surface-muted',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-card',
  outline:
    'bg-white text-ink border border-slate-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 shadow-card',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
  xl: 'h-14 px-6 text-base gap-2.5 rounded-2xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold',
          'transition-all duration-150 ease-spring',
          'no-tap-highlight select-none',
          'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'xl' ? 20 : 16} />
        ) : (
          icon && <span className="flex-shrink-0">{icon}</span>
        )}
        {children && <span className="leading-none">{children}</span>}
        {iconRight && !loading && (
          <span className="flex-shrink-0">{iconRight}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
