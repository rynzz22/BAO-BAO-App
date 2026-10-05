import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2,
  Phone, AlertTriangle, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRideStatusLabel, getRideStatusColor, formatTime } from '@/lib/utils'
import { useRide, useCancelRide, useRateRide } from '@/hooks/useRides'
import { useRideRealtime } from '@/hooks/useRealtime'
import { useUiStore } from '@/stores/uiStore'
import PageLayout from '@/components/layout/PageLayout'
import LiveMap from '@/components/map/LiveMap'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import type { RideStatus } from '@/types'
import { useState } from 'react'

// ─── Status Steps ─────────────────────────────────────────────

const RIDE_STEPS: Array<{ status: RideStatus[]; label: string; description: string }> = [
  {
    status: ['REQUESTED', 'DISPATCHING', 'OFFERED'],
    label: 'Finding a driver',
    description: 'Notifying available drivers nearby',
  },
  {
    status: ['ACCEPTED', 'DRIVER_EN_ROUTE'],
    label: 'Driver on the way',
    description: 'Your driver is heading to your pickup',
  },
  {
    status: ['ARRIVED'],
    label: 'Driver arrived',
    description: 'Your driver is waiting at the pickup point',
  },
  {
    status: ['IN_PROGRESS'],
    label: 'Ride in progress',
    description: 'Enjoy your trip!',
  },
  {
    status: ['COMPLETED'],
    label: 'Completed',
    description: 'You have arrived at your destination',
  },
]

function getStepIndex(status: RideStatus): number {
  for (let i = 0; i < RIDE_STEPS.length; i++) {
    if ((RIDE_STEPS[i].status as string[]).includes(status)) return i
  }
  return 0
}

function RideProgressStepper({ status }: { status: RideStatus }) {
  const currentStep = getStepIndex(status)
  const isTerminal = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_DRIVER_FOUND'].includes(status)

  if (isTerminal && status !== 'COMPLETED') return null

  return (
    <div className="py-1">
      {RIDE_STEPS.map((step, i) => {
        const isDone = i < currentStep
        const isCurrent = i === currentStep
        const isFuture = i > currentStep

        return (
          <div key={step.label} className="flex items-start gap-3">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                  isDone && 'bg-primary-500 text-white',
                  isCurrent && 'bg-primary-500 text-white ring-4 ring-primary-100',
                  isFuture && 'bg-surface-subtle text-ink-tertiary border border-slate-200'
                )}
              >
                {isDone ? (
                  <CheckCircle2 size={14} />
                ) : isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </div>
              {i < RIDE_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-px flex-1 my-1 transition-colors duration-300',
                    i < currentStep ? 'bg-primary-300' : 'bg-slate-200'
                  )}
                  style={{ minHeight: 24 }}
                />
              )}
            </div>

            {/* Text column */}
            <div className="pb-4 pt-0.5 flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-semibold leading-tight',
                  isCurrent ? 'text-primary-700' : isDone ? 'text-ink' : 'text-ink-tertiary'
                )}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-ink-secondary mt-0.5 animate-fade-in">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Star Rating ──────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform duration-100 hover:scale-110"
        >
          <Star
            size={28}
            className={cn(
              'transition-colors duration-100',
              (hover || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 fill-slate-200'
            )}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Rating Modal ─────────────────────────────────────────────

function RateRideModal({
  rideId,
  open,
  onClose,
}: {
  rideId: string
  open: boolean
  onClose: () => void
}) {
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const rateRide = useRateRide()
  const { addToast } = useUiStore()

  const handleSubmit = async () => {
    if (!score) return
    try {
      await rateRide.mutateAsync({ rideId, score, comment })
      addToast({ type: 'success', message: 'Thanks for your feedback!' })
      onClose()
    } catch {
      addToast({ type: 'error', message: 'Could not submit rating. Try again.' })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Rate your ride" size="sm">
      <div className="flex flex-col items-center gap-5">
        <div className="text-center">
          <p className="text-sm text-ink-secondary">How was your experience?</p>
        </div>

        <StarRating value={score} onChange={setScore} />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment (optional)…"
          rows={3}
          className="input-field resize-none w-full text-sm"
        />

        <div className="flex gap-2 w-full">
          <Button variant="ghost" size="md" fullWidth onClick={onClose}>
            Skip
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={!score}
            loading={rateRide.isPending}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function ActiveRidePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useUiStore()
  const [rateOpen, setRateOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data: ride, isLoading } = useRide(id)
  const cancelRide = useCancelRide()
  useRideRealtime(id)

  const handleCancel = async () => {
    if (!id) return
    try {
      await cancelRide.mutateAsync({ rideId: id, reason: 'Passenger cancelled' })
      addToast({ type: 'info', message: 'Ride cancelled.' })
      setCancelOpen(false)
      navigate('/app')
    } catch {
      addToast({ type: 'error', message: 'Could not cancel. Try again.' })
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
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center mb-4">
            <Car size={24} className="text-ink-tertiary" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Ride not found</h2>
          <p className="text-sm text-ink-secondary mt-1 mb-5">This ride may have ended or doesn't exist.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/app')}>
            Back to Home
          </Button>
        </div>
      </PageLayout>
    )
  }

  const isCompleted = ride.status === 'COMPLETED'
  const isCancellable = ['REQUESTED', 'DISPATCHING', 'OFFERED'].includes(ride.status)

  return (
    <div className="min-h-screen pt-14 gradient-bg">
      {/* Back bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-0">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink transition-colors mb-5"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5 items-start">

        {/* Left column: Map + driver info */}
        <div className="flex flex-col gap-5">
          {/* Map */}
          <LiveMap
            pickupLat={ride.pickup.lat}
            pickupLng={ride.pickup.lng}
            destinationLat={ride.destination.lat}
            destinationLng={ride.destination.lng}
            height="320px"
            className="shadow-frost-md"
          />

          {/* Driver card */}
          {ride.assignedDriver && (
            <div className="surface-card-primary p-5">
              <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-3">
                Your Driver
              </p>
              <div className="flex items-center gap-4">
                <Avatar name={ride.assignedDriver.fullName} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink text-base">{ride.assignedDriver.fullName}</h3>
                  <p className="text-sm text-ink-secondary mt-0.5">
                    Driver #{ride.assignedDriver.driverCode}
                  </p>
                  {ride.assignedVehicle && (
                    <p className="text-sm text-ink-tertiary">
                      {ride.assignedVehicle.vehicleType.name} · {ride.assignedVehicle.plateOrBodyNo}
                    </p>
                  )}
                </div>
                {ride.assignedDriver.phoneNumber && (
                  <a
                    href={`tel:${ride.assignedDriver.phoneNumber}`}
                    className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors flex-shrink-0"
                    aria-label="Call driver"
                  >
                    <Phone size={16} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Completed: rate & return */}
          {isCompleted && (
            <div className="surface-card-primary p-5 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-status-live-bg flex items-center justify-center">
                <CheckCircle2 size={26} className="text-status-live" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-ink">You've arrived!</h3>
                <p className="text-sm text-ink-secondary mt-1">
                  Ride completed at {formatTime(ride.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  icon={<Star size={15} />}
                  onClick={() => setRateOpen(true)}
                >
                  Rate ride
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => navigate('/app')}
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* No driver found / expired */}
          {(ride.status === 'NO_DRIVER_FOUND' || ride.status === 'EXPIRED') && (
            <div className="surface-card-primary p-5 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-ink">
                  {ride.status === 'NO_DRIVER_FOUND' ? 'No driver found' : 'Request expired'}
                </h3>
                <p className="text-sm text-ink-secondary mt-1">
                  No driver was available. You can try requesting again.
                </p>
              </div>
              <Button variant="primary" size="md" fullWidth onClick={() => navigate('/app')}>
                Try again
              </Button>
            </div>
          )}
        </div>

        {/* Right column: Status + route */}
        <div className="flex flex-col gap-4">
          {/* Status badge */}
          <div className="surface-card-primary p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-bold text-lg text-ink">Ride Status</h2>
              <span className={cn('pill text-xs font-semibold', getRideStatusColor(ride.status))}>
                {getRideStatusLabel(ride.status)}
              </span>
            </div>
            <p className="text-xs text-ink-tertiary mb-4">
              Requested at {formatTime(ride.createdAt)} · {ride.passengerCount} passenger{ride.passengerCount !== 1 ? 's' : ''}
            </p>

            <RideProgressStepper status={ride.status} />
          </div>

          {/* Route summary */}
          <div className="surface-card p-5">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-3">
              Route
            </p>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                <div className="w-px bg-primary-200 my-1.5" style={{ height: 28 }} />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>
              <div className="flex flex-col gap-4 flex-1 min-w-0">
                <div>
                  <p className="text-xs text-ink-tertiary">Pickup</p>
                  <p className="text-sm font-medium text-ink truncate">
                    {ride.pickup.label ?? `${ride.pickup.lat.toFixed(5)}, ${ride.pickup.lng.toFixed(5)}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-tertiary">Destination</p>
                  <p className="text-sm font-medium text-ink truncate">
                    {ride.destination.label ?? `${ride.destination.lat.toFixed(5)}, ${ride.destination.lng.toFixed(5)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel */}
          {isCancellable && (
            <Button
              variant="ghost"
              size="md"
              fullWidth
              icon={<AlertTriangle size={15} />}
              onClick={() => setCancelOpen(true)}
              className="text-red-600 hover:bg-red-50"
            >
              Cancel this ride
            </Button>
          )}
        </div>
      </div>

      {/* Rating modal */}
      {id && (
        <RateRideModal rideId={id} open={rateOpen} onClose={() => setRateOpen(false)} />
      )}

      {/* Cancel confirm modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel ride?"
        description="Your ride request will be cancelled. You can request again anytime."
        size="sm"
      >
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="md" fullWidth onClick={() => setCancelOpen(false)}>
            Keep ride
          </Button>
          <Button
            variant="danger"
            size="md"
            fullWidth
            loading={cancelRide.isPending}
            onClick={handleCancel}
          >
            Yes, cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
