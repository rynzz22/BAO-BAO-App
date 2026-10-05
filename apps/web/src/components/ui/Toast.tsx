import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import type { Toast as ToastType } from '@/types'

const icons = {
  success: <CheckCircle2 size={18} className="text-status-live" />,
  error: <XCircle size={18} className="text-red-500" />,
  info: <Info size={18} className="text-sky-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
}

const styles = {
  success: 'border-l-4 border-status-live',
  error: 'border-l-4 border-red-500',
  info: 'border-l-4 border-sky-500',
  warning: 'border-l-4 border-amber-500',
}

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUiStore((s) => s.removeToast)

  return (
    <div
      className={cn(
        'glass shadow-float flex items-start gap-3 px-4 py-3 rounded-xl min-w-72 max-w-sm',
        'animate-slide-up',
        styles[toast.type]
      )}
      role="alert"
    >
      <span className="mt-0.5 flex-shrink-0">{icons[toast.type]}</span>
      <p className="text-sm text-ink flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-ink-tertiary hover:text-ink transition-colors"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
