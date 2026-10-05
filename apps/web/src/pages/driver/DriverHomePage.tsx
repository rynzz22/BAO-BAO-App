import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Clock, Car, Wifi, WifiOff,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRideStatusLabel, getRideStatusColor, formatTime } from '@/lib/utils'
import {
  useDriverMe, useDriverOffers, useDriverActiveRide,
  useSetDriverStatus, useAcceptOffer, useDeclineOffer,
  useUpdateRideStatus, useUpdateDriverLocation,
} from '@/hooks/useDriverMe'
import { useDriverOffersRealtime } from '@/hooks/useRealtime'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useUiStore } from '@/stores/uiStore'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import type { RideOffer, RideRequest, Driver } from '@/types'

// Extended offer type from API (includes nested ride data)
interface PopulatedOffer extends RideOffer {
  ride?: Pick<RideRequest, 'pickup' | 'destination' | 'passengerCount'>
}

// ─── Online Toggle ────────────────────────────────────────────

function OnlineToggle() {
  const { data: driver } = useDriverMe()
  const setStatus = useSetDriverStatus()
  const { addToast } = useUiStore()

  const isOnline = driver?.availability === 'AVAILABLE'
  const isBusy = driver?.availability === 'BUSY'

  const handleToggle = async () => {
    if (isBusy) return
    try {
      await setStatus.mutateAsync(isOnline ? 'OFFLINE' : 'AVAILABLE')
      addToast({
        type: isOnline ? 'info' : 'success',
        message: isOnline ? 'You are now offline.' : 'You are online and accepting rides!',
      })
    } catch {
      addToast({ type: 'error', message: 'Could not update status. Try again.' })
    }
  }

  return (
    <div className={cn(
      'surface-card-primary p-5 flex items-center justify-between gap-4 transition-all duration-300',
      isOnline && 'ring-1 ring-primary-200'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300',
          isOnline ? 'bg-primary-100 text-primary-600' : 'bg-surface-subtle text-ink-tertiary'
        )}>
          {isOnline ? <Wifi size={22} /> : <WifiOff size={22} />}
        </div>
        <div>
          <p className="font-semibold text-ink text-base">
            {isBusy ? 'On a Ride' : isOnline ? 'You are Online' : 'You are Offline'}
          </p>
          <p className="text-sm text-ink-secondary">
            {isBusy
              ? 'Complete your current ride first'
              : isOnline
              ? 'Accepting ride requests'
              : 'Go online to receive offers'}
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={handleToggle}
        disabled={isBusy || setStatus.isPending}
        aria-label={isOnline ? 'Go offline' : 'Go online'}
        className={cn(
          'relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0',
          'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOnline ? 'bg-primary-500' : 'bg-slate-200'
        )}
      >
        <div className={cn(
          'absolute top-1 w-6 h-6 rounded-full bg-white shadow-card transition-all duration-300',
          isOnline ? 'left-7' : 'left-1'
        )} />
      </button>
    </div>
  )
}

// ─── Location Sharing ─────────────────────────────────────────

function LocationSharingIndicator({ isOnline }: { isOnline: boolean }) {
  const geo = useGeolocation(true)
  const updateLocation = useUpdateDriverLocation()

  useEffect(() => {
    if (!isOnline || !geo.lat || !geo.lng) return
    const id = setInterval(() => {
      if (geo.lat && geo.lng) {
        updateLocation.mutate({
          lat: geo.lat,
          lng: geo.lng,
          accuracy: geo.accuracy ?? undefined,
        })
      }
    }, 5000)
    return () => clearInterval(id)
  }, [isOnline, geo.lat, geo.lng, geo.accuracy, updateLocation])

  if (!isOnline) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-status-live-bg border border-green-100">
      <div className="w-2 h-2 rounded-full bg-status-live animate-pulse-dot flex-shrink-0" />
      <span className="text-xs font-medium text-status-live">
        {geo.lat ? 'Sharing live GPS location' : 'Acquiring GPS signal…'}
      </span>
      {geo.accuracy && (
        <span className="text-xs text-green-600 ml-auto">±{Math.round(geo.accuracy)}m</span>
      )}
    </div>
  )
}

// ─── Offer Card ───────────────────────────────────────────────

function OfferCard({ offer }: { offer: PopulatedOffer }) {
  const acceptOffer = useAcceptOffer()
  const declineOffer = useDeclineOffer()
  const { addToast } = useUiStore()
  const navigate = useNavigate()

  const handleAccept = async () => {
    try {
      await acceptOffer.mutateAsync(offer.id)
      addToast({ type: 'success', message: 'Offer accepted! Head to pickup.' })
      navigate(`/driver/ride/${offer.rideId}`)
    } catch {
      addToast({ type: 'error', message: 'Offer may have expired. Try again.' })
    }
  }

  const handleDecline = async () => {
    try {
      await declineOffer.mutateAsync(offer.id)
      addToast({ type: 'info', message: 'Offer declined.' })
    } catch {
      addToast({ type: 'error', message: 'Could not decline. Try again.' })
    }
  }

  const ride = offer.ride

  return (
    <div className="surface-card-primary p-5 border-l-4 border-primary-400 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-dot" />
          <span className="text-sm font-semibold text-primary-700">New Ride Offer</span>
        </div>
        <span className="text-xs text-ink-tertiary bg-surface-subtle px-2 py-1 rounded-lg">
          {formatTime(offer.sentAt)}
        </span>
      </div>

      {/* Route */}
      <div className="p-3 rounded-xl bg-surface-subtle mb-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <div className="w-px bg-primary-200 my-1" style={{ minHeight: 20 }} />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div>
              <p className="text-xs text-ink-tertiary">Pickup</p>
              <p className="text-sm font-semibold text-ink truncate">
                {ride?.pickup?.label ?? 'Pickup location'}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-tertiary">Destination</p>
              <p className="text-sm font-semibold text-ink truncate">
                {ride?.destination?.label ?? 'Destination'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-4 text-sm text-ink-secondary mb-4">
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-ink-tertiary" />
          {ride?.passengerCount ?? 1} pax
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-ink-tertiary" />
          Sent {formatTime(offer.sentAt)}
        </span>
      </div>

      {/* Large touch-friendly buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          icon={<XCircle size={18} />}
          loading={declineOffer.isPending}
          onClick={handleDecline}
          className="text-red-600 hover:bg-red-50 border border-red-100"
        >
          Decline
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<CheckCircle2 size={18} />}
          loading={acceptOffer.isPending}
          onClick={handleAccept}
        >
          Accept
        </Button>
      </div>
    </div>
  )
}

// ─── Active Ride Panel ────────────────────────────────────────

function ActiveRidePanel({ ride }: { ride: RideRequest }) {
  const updateStatus = useUpdateRideStatus()
  const { addToast } = useUiStore()

  type RideAction = 'en-route' | 'arrived' | 'start' | 'complete'
  const actionMap: Partial<Record<string, { label: string; action: RideAction }>> = {
    ACCEPTED:        { label: 'Head to Pickup',        action: 'en-route' },
    DRIVER_EN_ROUTE: { label: 'Mark as Arrived',       action: 'arrived'  },
    ARRIVED:         { label: 'Passenger Boarded — Start Trip', action: 'start' },
    IN_PROGRESS:     { label: 'Complete Ride',         action: 'complete' },
  }

  const nextAction = actionMap[ride.status]

  const handleAction = async () => {
    if (!nextAction) return
    try {
      await updateStatus.mutateAsync({ rideId: ride.id, action: nextAction.action })
    } catch {
      addToast({ type: 'error', message: 'Could not update. Try again.' })
    }
  }

  return (
    <div className="surface-card-primary p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink">Current Ride</h3>
        <span className={cn('pill text-xs', getRideStatusColor(ride.status))}>
          {getRideStatusLabel(ride.status)}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-5">
        <div className="flex flex-col items-center pt-1 flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
          <div className="w-px bg-primary-200 my-1.5" style={{ height: 24 }} />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div>
            <p className="text-xs text-ink-tertiary">Pickup</p>
            <p className="text-sm font-semibold text-ink truncate">
              {ride.pickup.label ?? 'Pickup'}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-tertiary">Destination</p>
            <p className="text-sm font-semibold text-ink truncate">
              {ride.destination.label ?? 'Destination'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-ink-secondary flex-shrink-0">
          <Users size={13} />
          {ride.passengerCount}p
        </div>
      </div>

      {nextAction && (
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={updateStatus.isPending}
          onClick={handleAction}
        >
          {nextAction.label}
        </Button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function DriverHomePage() {
  const { data: driver, isLoading } = useDriverMe()
  const { data: offers } = useDriverOffers()
  const { data: activeRide } = useDriverActiveRide()

  useDriverOffersRealtime(driver?.id)

  if (isLoading) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center gradient-bg">
        <Spinner size="lg" label="Loading driver profile…" />
      </div>
    )
  }

  const isOnline = driver?.availability === 'AVAILABLE'
  const hasActiveRide = !!activeRide && !['COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_DRIVER_FOUND'].includes(activeRide.status)
  const pendingOffers = (offers as PopulatedOffer[] | undefined)?.filter((o) => o.status === 'PENDING') ?? []

  return (
    <PageLayout maxWidth="2xl">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-ink">Driver Dashboard</h1>
        <p className="text-sm text-ink-secondary mt-0.5">Manage your availability and rides</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Driver identity card */}
        {driver && (
          <div className="surface-card p-4 flex items-center gap-3">
            <Avatar name={driver.fullName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{driver.fullName}</p>
              <p className="text-xs text-ink-tertiary">
                #{driver.driverCode} · {driver.primaryChannel}
                {driver.currentVehicle && ` · ${driver.currentVehicle.plateOrBodyNo}`}
              </p>
            </div>
            <Badge
              variant={
                driver.availability === 'AVAILABLE' ? 'live'
                : driver.availability === 'BUSY' ? 'reported'
                : 'offline'
              }
            >
              {driver.availability}
            </Badge>
          </div>
        )}

        {/* Online toggle */}
        <OnlineToggle />

        {/* GPS sharing indicator */}
        <LocationSharingIndicator isOnline={isOnline} />

        {/* Active ride — shown when busy */}
        {hasActiveRide && <ActiveRidePanel ride={activeRide} />}

        {/* Pending offers */}
        {!hasActiveRide && (
          <>
            {pendingOffers.length > 0 ? (
              <>
                <div className="flex items-center gap-2 px-1">
                  <AlertCircle size={15} className="text-primary-500" />
                  <p className="text-sm font-semibold text-primary-700">
                    {pendingOffers.length} pending offer{pendingOffers.length > 1 ? 's' : ''}
                  </p>
                </div>
                {pendingOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </>
            ) : isOnline ? (
              <div className="surface-card p-10 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                  <Car size={24} className="text-primary-500" />
                </div>
                <p className="font-semibold text-ink">Waiting for offers</p>
                <p className="text-sm text-ink-secondary max-w-xs">
                  You'll receive a notification when a passenger nearby needs a ride
                </p>
              </div>
            ) : (
              <div className="surface-card p-10 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center">
                  <WifiOff size={24} className="text-ink-tertiary" />
                </div>
                <p className="font-semibold text-ink">You're offline</p>
                <p className="text-sm text-ink-secondary">Toggle online above to start receiving ride offers</p>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}
