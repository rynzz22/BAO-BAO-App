import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizes = {
  sm: 16,
  md: 24,
  lg: 36,
}

export default function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2
        size={sizes[size]}
        className="animate-spin text-primary-500"
        aria-label={label ?? 'Loading'}
      />
      {label && (
        <p className="text-sm text-ink-tertiary">{label}</p>
      )}
    </div>
  )
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-base">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-frost-md">
          <Loader2 size={22} className="animate-spin text-white" />
        </div>
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
      </div>
    </div>
  )
}
