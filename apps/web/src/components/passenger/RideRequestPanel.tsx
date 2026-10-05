import { useState } from 'react'
import {
  MapPin, Navigation, ArrowDown, Users, Minus, Plus,
  SendHorizonal, X, CheckCircle2, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRideStore } from '@/stores/rideStore'
import { useUiStore } from '@/stores/uiStore'
import { useZones } from '@/hooks/useZones'
import { useCreateRide, useActiveRide, useCancelRide } from '@/hooks/useRides'
import { useGeolocation } from '@/hooks/useGeolocation'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { getRideStatusLabel, getRideStatusColor } from '@/lib/utils'
import type { Zone } from '@/types'

// ─── Quick Zone Pills ─────────────────────────────────────────

function QuickZonePills({
  zones,
  selectedId,
  onSelect,
}: {
  zones: Zone[]
  selectedId?: string
  onSelect: (zone: Zone) => void
}) {
  const pickupZones = zones.filter((z) => z.zoneType === 'PICKUP' && z.isActive).slice(0, 4)

  if (!pickupZones.length) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pickupZones.map((zone) => (
        <button
          key={zone.id}
          onClick={() => onSelect(zone)}
          className={cn(
            'pill transition-all duration-150',
            selectedId === zone.id
              ? 'pill-active'
              : 'pill-primary'
          )}
        >
          {zone.name}
        </button>
      ))}
    </div>
  )
}

// ─── Passenger Counter ────────────────────────────────────────

function PassengerCounter({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
          'border border-slate-200 bg-white text-ink-secondary',
          'hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-ink-secondary'
        )}
        aria-label="Decrease passengers"
      >
        <Minus size={14} />
      </button>

      <div className="flex items-center gap-2 min-w-12 justify-center">
        <span className="text-2xl font-bold font-display text-ink">{value}</span>
        <span className="text-sm text-ink-secondary">
          {value === 1 ? 'person' : 'people'}
        </span>
      </div>

      <button
        onClick={() => onChange(Math.min(8, value + 1))}
        disabled={value >= 8}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
          'border border-slate-200 bg-white text-ink-secondary',
          'hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-label="Increase passengers"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// ─── Active Ride Status ───────────────────────────────────────

function ActiveRideCard() {
  const { data: activeRide, isLoading } = useActiveRide()
  const cancelRide = useCancelRide()
  const { addToast } = useUiStore()

  if (isLoading) {
    return (
      <div className="p-5">
        <div className="skeleton h-4 w-3/4 mb-3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    )
  }

  if (!activeRide) return null

  const handleCancel = async () => {
    try {
      await cancelRide.mutateAsync({ rideId: activeRide.id, reason: 'Passenger cancelled' })
      addToast({ type: 'success', message: 'Ride cancelled.' })
    } catch {
      addToast({ type: 'error', message: 'Could not cancel the ride. Try again.' })
    }
  }

  const isTerminal = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_DRIVER_FOUND'].includes(activeRide.status)

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink">Active Ride</h3>
        <span className={cn('pill text-xs', getRideStatusColor(activeRide.status))}>
          {getRideStatusLabel(activeRide.status)}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex flex-col items-center pt-1 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-primary-500" />
          <div className="w-px h-6 bg-primary-200 my-1" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div>
            <p className="text-xs text-ink-tertiary">Pickup</p>
            <p className="text-sm font-medium text-ink truncate">
              {activeRide.pickup.label ?? `${activeRide.pickup.lat.toFixed(4)}, ${activeRide.pickup.lng.toFixed(4)}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-tertiary">Destination</p>
            <p className="text-sm font-medium text-ink truncate">
              {activeRide.destination.label ?? `${activeRide.destination.lat.toFixed(4)}, ${activeRide.destination.lng.toFixed(4)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Driver info */}
      {activeRide.assignedDriver && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle mb-4">
          <div className="w-9 h-9 rounded-xl gradient-teal flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {activeRide.assignedDriver.driverCode}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">{activeRide.assignedDriver.fullName}</p>
            <p className="text-xs text-ink-tertiary">
              {activeRide.assignedVehicle?.plateOrBodyNo ?? 'Vehicle #' + activeRide.assignedVehicle?.id?.slice(0, 6)}
            </p>
          </div>
          <Badge variant="live">Driver</Badge>
        </div>
      )}

      {/* Actions */}
      {!isTerminal && activeRide.status === 'REQUESTED' && (
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          loading={cancelRide.isPending}
          onClick={handleCancel}
          icon={<X size={14} />}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Cancel ride
        </Button>
      )}

      {isTerminal && (
        <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', getRideStatusColor(activeRide.status))}>
          {activeRide.status === 'COMPLETED'
            ? <CheckCircle2 size={16} />
            : <RotateCcw size={16} />}
          <span className="font-medium">{getRideStatusLabel(activeRide.status)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────

export default function RideRequestPanel() {
  const { draft, setPickup, setDestination, setPassengerCount, resetDraft } = useRideStore()
  const { addToast } = useUiStore()
  const { data: zones } = useZones()
  const { data: activeRide } = useActiveRide()
  const createRide = useCreateRide()
  const geo = useGeolocation()

  const [pickupInput, setPickupInput] = useState('')
  const [destInput, setDestInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const hasActiveRide = !!activeRide && !['COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_DRIVER_FOUND'].includes(activeRide.status)

  const handlePickupFromGPS = () => {
    if (geo.lat && geo.lng) {
      setPickup({ lat: geo.lat, lng: geo.lng, label: 'My location' })
      setPickupInput('My location')
    } else {
      addToast({ type: 'warning', message: 'Location not available yet.' })
    }
  }

  const handlePickupZone = (zone: Zone) => {
    setPickup({ lat: zone.center.lat, lng: zone.center.lng, label: zone.name, zoneId: zone.id })
    setPickupInput(zone.name)
  }

  const handleDestZone = (zone: Zone) => {
    setDestination({ lat: zone.center.lat, lng: zone.center.lng, label: zone.name, zoneId: zone.id })
    setDestInput(zone.name)
  }

  const canSubmit = draft.pickup && draft.destination && draft.passengerCount >= 1

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitted(true)

    try {
      await createRide.mutateAsync({
        pickup: draft.pickup!,
        destination: draft.destination!,
        passengerCount: draft.passengerCount,
      })
      addToast({ type: 'success', message: 'Ride requested! Looking for a driver…' })
      resetDraft()
      setPickupInput('')
      setDestInput('')
    } catch {
      addToast({ type: 'error', message: 'Could not submit ride request. Try again.' })
    } finally {
      setSubmitted(false)
    }
  }

  // Show active ride instead of form when there's a live ride
  if (hasActiveRide) {
    return (
      <div className="surface-card-primary overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <h2 className="font-display font-bold text-lg text-ink">Your Ride</h2>
          <p className="text-sm text-ink-secondary mt-0.5">Tracking your current request</p>
        </div>
        <ActiveRideCard />
      </div>
    )
  }

  return (
    <div className="surface-card-primary overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <h2 className="font-display font-bold text-lg text-ink">Request a Ride</h2>
        <p className="text-sm text-ink-secondary mt-0.5">Where would you like to go?</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Step 1: Pickup */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
            <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
              Pickup
            </label>
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400">
              <MapPin size={16} />
            </div>
            <input
              value={pickupInput}
              onChange={(e) => {
                setPickupInput(e.target.value)
                if (e.target.value) {
                  setPickup({ lat: 10.1508, lng: 124.3316, label: e.target.value })
                } else {
                  setPickup(null)
                }
              }}
              placeholder="Where are you?"
              className="input-field pl-10 pr-10"
            />
            {geo.lat && (
              <button
                type="button"
                onClick={handlePickupFromGPS}
                title="Use my location"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-primary-500 transition-colors"
              >
                <Navigation size={15} />
              </button>
            )}
          </div>

          {zones && (
            <QuickZonePills
              zones={zones}
              selectedId={draft.pickup?.zoneId}
              onSelect={handlePickupZone}
            />
          )}
        </div>

        {/* Step connector */}
        <div className="flex items-center gap-3">
          <div className="w-px h-5 bg-gradient-to-b from-primary-200 to-primary-100 ml-0.5" />
          <div className="flex-1 flex items-center gap-1.5 text-xs text-ink-tertiary">
            <ArrowDown size={12} />
            <span>to</span>
          </div>
        </div>

        {/* Step 2: Destination */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
              Destination
            </label>
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
              <MapPin size={16} />
            </div>
            <input
              value={destInput}
              onChange={(e) => {
                setDestInput(e.target.value)
                if (e.target.value) {
                  setDestination({ lat: 10.155, lng: 124.335, label: e.target.value })
                } else {
                  setDestination(null)
                }
              }}
              placeholder="Where to?"
              className="input-field pl-10"
            />
          </div>

          {zones && (
            <QuickZonePills
              zones={zones}
              selectedId={draft.destination?.zoneId}
              onSelect={handleDestZone}
            />
          )}
        </div>

        {/* Step 3: Passengers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-ink-tertiary" />
            <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
              Passengers
            </label>
          </div>
          <PassengerCounter
            value={draft.passengerCount}
            onChange={setPassengerCount}
          />
        </div>

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          loading={createRide.isPending || submitted}
          icon={<SendHorizonal size={18} />}
          onClick={handleSubmit}
          className={cn(
            'transition-all duration-300',
            canSubmit && 'shadow-frost-md hover:shadow-frost-lg'
          )}
        >
          Confirm &amp; Request Ride
        </Button>

        {/* Dispatch notice */}
        <DispatchNotice />
      </div>
    </div>
  )
}

// ─── Dispatch Notice ──────────────────────────────────────────

function DispatchNotice() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
      <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="#14b8a6" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.63 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.44 16l.48.92z"/>
        </svg>
      </div>
      <p className="text-xs text-primary-700 leading-relaxed">
        Your request is sent to available drivers via the <strong>Driver App</strong>, <strong>SMS</strong>, or through our <strong>Terminal Dispatcher</strong>.
      </p>
    </div>
  )
}
