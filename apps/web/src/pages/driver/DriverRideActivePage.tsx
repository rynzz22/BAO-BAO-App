import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, MapPin, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRideStatusLabel, getRideStatusColor, formatTime } from '@/lib/utils'
import { useRide } from '@/hooks/useRides'
import { useUpdateRideStatus } from '@/hooks/useDriverMe'
import { useRideRealtime } from '@/hooks/useRealtime'
import { useUiStore } from '@/stores/uiStore'
import PageLayout from '@/components/layout/PageLayout'
import LiveMap from '@/components/map/LiveMap'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

type RideAction = 'en-route' | 'arrived' | 'start' | 'complete'

const ACTION_MAP: Partial<Record<string, { label: string; action: RideAction; description: string }>> = {
  ACCEPTED:        { label: 'Head to Pickup',              action: 'en-route', description: 'Navigate to the passenger pickup point' },
  DRIVER_EN_ROUTE: { label: 'Mark as Arrived',             action: 'arrived',  description: 'I have arrived at the pickup location' },
  ARRIVED:         { label: 'Passenger Boarded — Start Trip', action: 'start', description: 'Passenger is in the vehicle, starting trip' },
  IN_PROGRESS:     { label: 'Complete Ride',               action: 'complete', description: 'Arrived at destination, trip complete' },
}

export default function DriverRideActivePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useUiStore()
  const { data: ride, isLoading } = useRide(id)
  const updateStatus = useUpdateRideStatus()

  useRideRealtime(id)

  const handleAction = async (action: RideAction) => {
    if (!id) return
    try {
      await updateStatus.mutateAsync({ rideId: id, action })
      if (action === 'complete') {
        addToast({ type: 'success', message: 'Ride completed! Well done.' })
        navigate('/driver')
      }
    } catch {
      addToast({ type: 'error', message: 'Could not update status. Try again.' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center gradient-bg">
        <Spinner size="lg" label="Loading ride…" />
      </div>
    )
  }

  if (!ride) {
    return (
      <PageLayout maxWidth="lg">
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <p className="text-lg font-semibold text-ink">Ride not found</p>
          <Button variant="primary" size="md" onClick={() => navigate('/driver')}>
            Back to Dashboard
          </Button>
        </div>
      </PageLayout>
    )
  }

  const nextAction = ACTION_MAP[ride.status]
  const isComplete = ride.status === 'COMPLETED'

  return (
    <div className="min-h-screen pt-14 gradient-bg">
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-8 flex flex-col gap-4">
        <button
          onClick={() => navigate('/driver')}
          className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink transition-colors self-start"
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {/* Status header */}
        <div className="surface-card-primary p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-bold text-lg text-ink">Active Ride</h2>
            <span className={cn('pill text-xs', getRideStatusColor(ride.status))}>
              {getRideStatusLabel(ride.status)}
            </span>
          </div>
          <p className="text-xs text-ink-tertiary">
            Started {formatTime(ride.createdAt)} · {ride.passengerCount} pax
          </p>
        </div>

        {/* Map */}
        <LiveMap
          pickupLat={ride.pickup.lat}
          pickupLng={ride.pickup.lng}
          destinationLat={ride.destination.lat}
          destinationLng={ride.destination.lng}
          height="260px"
          className="shadow-frost-md"
        />

        {/* Route card */}
        <div className="surface-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
              <MapPin size={14} className="text-primary-500" />
              <div className="w-px bg-primary-200 my-1" style={{ height: 24 }} />
              <MapPin size={14} className="text-amber-400" />
            </div>
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <div>
                <p className="text-xs text-ink-tertiary">Pickup</p>
                <p className="text-sm font-semibold text-ink truncate">
                  {ride.pickup.label ?? `${ride.pickup.lat.toFixed(5)}, ${ride.pickup.lng.toFixed(5)}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-tertiary">Destination</p>
                <p className="text-sm font-semibold text-ink truncate">
                  {ride.destination.label ?? `${ride.destination.lat.toFixed(5)}, ${ride.destination.lng.toFixed(5)}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger info */}
        <div className="surface-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Users size={16} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Passenger</p>
            <p className="text-xs text-ink-tertiary">{ride.passengerCount} people</p>
          </div>
        </div>

        {/* Completed state */}
        {isComplete ? (
          <div className="surface-card-primary p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-status-live-bg flex items-center justify-center">
              <CheckCircle2 size={26} className="text-status-live" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-ink">Ride Complete!</h3>
              <p className="text-sm text-ink-secondary mt-1">Great job. Ready for the next one?</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/driver')}>
              Back to Dashboard
            </Button>
          </div>
        ) : nextAction ? (
          /* Big action button */
          <div className="surface-card-primary p-5">
            <p className="text-xs text-ink-tertiary mb-3">{nextAction.description}</p>
            <Button
              variant="primary"
              size="xl"
              fullWidth
              loading={updateStatus.isPending}
              onClick={() => handleAction(nextAction.action)}
            >
              {nextAction.label}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
