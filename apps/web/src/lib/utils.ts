import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const secs = Math.floor(diff / 1000)

  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return date.toLocaleDateString()
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getTrackingLabel(source: string): string {
  switch (source) {
    case 'LIVE_APP': return 'Live'
    case 'LAST_REPORTED': return 'Reported'
    case 'TERMINAL': return 'Terminal'
    case 'GPS_TRACKER': return 'GPS'
    default: return 'Unknown'
  }
}

export function getRideStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    REQUESTED: 'Finding Drivers',
    DISPATCHING: 'Dispatching',
    OFFERED: 'Offer Sent',
    ACCEPTED: 'Driver Accepted',
    DRIVER_EN_ROUTE: 'Driver on the way',
    ARRIVED: 'Driver arrived',
    IN_PROGRESS: 'Ride in progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
    NO_DRIVER_FOUND: 'No driver found',
  }
  return labels[status] ?? status
}

export function getRideStatusColor(status: string): string {
  switch (status) {
    case 'REQUESTED':
    case 'DISPATCHING':
    case 'OFFERED':
      return 'text-amber-600 bg-amber-50'
    case 'ACCEPTED':
    case 'DRIVER_EN_ROUTE':
    case 'ARRIVED':
      return 'text-primary-700 bg-primary-50'
    case 'IN_PROGRESS':
      return 'text-sky-700 bg-sky-50'
    case 'COMPLETED':
      return 'text-status-live bg-status-live-bg'
    case 'CANCELLED':
    case 'EXPIRED':
    case 'NO_DRIVER_FOUND':
      return 'text-slate-600 bg-slate-100'
    default:
      return 'text-slate-600 bg-slate-100'
  }
}

export function getAvailabilityColor(avail: string): string {
  switch (avail) {
    case 'AVAILABLE': return 'text-status-live bg-status-live-bg'
    case 'BUSY': return 'text-amber-600 bg-amber-50'
    case 'OFFLINE': return 'text-status-offline bg-status-offline-bg'
    default: return 'text-slate-600 bg-slate-100'
  }
}

export function getChannelIcon(channel: string): string {
  switch (channel) {
    case 'APP': return '📱'
    case 'SMS': return '💬'
    case 'DISPATCHER': return '📋'
    default: return '?'
  }
}

export function getApprovalColor(status: string): string {
  switch (status) {
    case 'APPROVED': return 'text-status-live bg-status-live-bg'
    case 'PENDING': return 'text-amber-600 bg-amber-50'
    case 'SUSPENDED': return 'text-red-600 bg-red-50'
    case 'REJECTED': return 'text-slate-600 bg-slate-100'
    default: return 'text-slate-600 bg-slate-100'
  }
}
