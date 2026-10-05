import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, Car } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRideStatusLabel, getRideStatusColor, formatDate, formatTime } from '@/lib/utils'
import { useRideHistory } from '@/hooks/useRides'
import PageLayout, { SectionTitle } from '@/components/layout/PageLayout'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import type { RideRequest } from '@/types'

function RideHistoryRow({ ride, onClick }: { ride: RideRequest; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-subtle transition-colors group"
    >
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        ride.status === 'COMPLETED' ? 'bg-primary-50 text-primary-600' : 'bg-surface-subtle text-ink-tertiary'
      )}>
        <Car size={18} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-ink truncate">
            {ride.destination.label ?? 'Unknown destination'}
          </span>
        </div>
        <p className="text-xs text-ink-tertiary">
          {formatDate(ride.createdAt)} · {formatTime(ride.createdAt)} · {ride.passengerCount}p
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('pill text-xs', getRideStatusColor(ride.status))}>
          {getRideStatusLabel(ride.status)}
        </span>
        <ChevronRight size={14} className="text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  )
}

export default function RideHistoryPage() {
  const navigate = useNavigate()
  const { data: rides, isLoading } = useRideHistory()

  return (
    <PageLayout maxWidth="2xl">
      <SectionTitle description="Your past and recent rides">
        Ride History
      </SectionTitle>

      <div className="surface-card-primary overflow-hidden">
        {isLoading ? (
          <div className="py-16"><Spinner size="md" label="Loading rides…" /></div>
        ) : !rides?.length ? (
          <EmptyState
            icon={<Clock size={24} />}
            title="No rides yet"
            description="When you request rides, they'll appear here."
            action={
              <Button variant="primary" size="md" onClick={() => navigate('/app')}>
                Request a ride
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {rides.map((ride) => (
              <RideHistoryRow
                key={ride.id}
                ride={ride}
                onClick={() => navigate(`/app/ride/${ride.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
