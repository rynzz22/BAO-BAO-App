import { useState } from 'react'
import {
  Monitor, Users, Clock, CheckCircle2, UserCheck,
  RefreshCw, MapPin, ChevronDown, LogIn, LogOut,
  AlertCircle, Car
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime, formatRelativeTime, getRideStatusLabel, getRideStatusColor, getChannelIcon } from '@/lib/utils'
import {
  useDispatcherRides, useDispatcherDrivers,
  useAssignDriver, useQueueCheckIn, useQueueCheckOut,
} from '@/hooks/useDispatcher'
import { useDispatcherRidesRealtime } from '@/hooks/useRealtime'
import { useUiStore } from '@/stores/uiStore'
import PageLayout, { SectionTitle } from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import type { RideRequest, Driver } from '@/types'

// ─── Assign Driver Modal ──────────────────────────────────────

function AssignDriverModal({
  ride,
  drivers,
  open,
  onClose,
}: {
  ride: RideRequest | null
  drivers: Driver[]
  open: boolean
  onClose: () => void
}) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const assignDriver = useAssignDriver()
  const { addToast } = useUiStore()

  const availableDrivers = drivers.filter(
    (d) => d.availability === 'AVAILABLE' || d.availability === 'OFFLINE'
  )

  const handleAssign = async () => {
    if (!ride || !selectedDriverId) return
    try {
      await assignDriver.mutateAsync({ rideId: ride.id, driverId: selectedDriverId })
      addToast({ type: 'success', message: 'Driver assigned successfully.' })
      onClose()
      setSelectedDriverId(null)
    } catch {
      addToast({ type: 'error', message: 'Could not assign driver. Try again.' })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign a Driver"
      description={ride ? `Assign a driver for ride to ${ride.destination.label ?? 'destination'}` : ''}
      size="md"
    >
      {/* Ride summary */}
      {ride && (
        <div className="p-3 rounded-xl bg-surface-subtle mb-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              <div className="w-px bg-primary-200 my-1" style={{ height: 16 }} />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0 text-xs">
              <p className="font-medium text-ink truncate">{ride.pickup.label ?? 'Pickup'}</p>
              <p className="font-medium text-ink truncate">{ride.destination.label ?? 'Destination'}</p>
            </div>
            <span className="text-xs text-ink-tertiary flex-shrink-0">{ride.passengerCount}p</span>
          </div>
        </div>
      )}

      {/* Driver list */}
      <div className="max-h-64 overflow-y-auto scrollbar-thin flex flex-col gap-1 mb-4">
        {availableDrivers.length === 0 ? (
          <p className="text-sm text-ink-tertiary text-center py-6">No available drivers right now</p>
        ) : (
          availableDrivers.map((driver) => (
            <button
              key={driver.id}
              onClick={() => setSelectedDriverId(driver.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150',
                selectedDriverId === driver.id
                  ? 'bg-primary-50 ring-1 ring-primary-300'
                  : 'hover:bg-surface-subtle'
              )}
            >
              <Avatar name={driver.fullName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{driver.fullName}</p>
                <p className="text-xs text-ink-tertiary">
                  #{driver.driverCode} · {getChannelIcon(driver.primaryChannel)} {driver.primaryChannel}
                  {driver.currentVehicle && ` · ${driver.currentVehicle.plateOrBodyNo}`}
                </p>
              </div>
              <Badge variant={driver.availability === 'AVAILABLE' ? 'live' : 'offline'}>
                {driver.availability}
              </Badge>
            </button>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          size="md"
          fullWidth
          disabled={!selectedDriverId}
          loading={assignDriver.isPending}
          onClick={handleAssign}
        >
          Assign Driver
        </Button>
      </div>
    </Modal>
  )
}

// ─── Ride Request Row ─────────────────────────────────────────

function RideRequestRow({
  ride,
  onAssign,
}: {
  ride: RideRequest
  onAssign: (ride: RideRequest) => void
}) {
  const waitSeconds = Math.round((Date.now() - new Date(ride.createdAt).getTime()) / 1000)
  const waitMins = Math.floor(waitSeconds / 60)
  const isUrgent = waitMins >= 5

  return (
    <div className={cn(
      'flex items-center gap-4 px-5 py-4 transition-colors',
      isUrgent ? 'bg-amber-50/50' : 'hover:bg-surface-subtle'
    )}>
      {/* Urgency indicator */}
      <div className={cn(
        'w-1.5 h-10 rounded-full flex-shrink-0',
        isUrgent ? 'bg-amber-400' : 'bg-primary-200'
      )} />

      {/* Route */}
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className="flex flex-col items-center pt-1 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          <div className="w-px bg-primary-200 my-0.5" style={{ height: 12 }} />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate leading-tight">
            {ride.pickup.label ?? 'Pickup'}
          </p>
          <p className="text-sm text-ink-secondary truncate leading-tight">
            {ride.destination.label ?? 'Destination'}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-ink-tertiary">
          <Users size={12} />
          {ride.passengerCount}p
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs',
          isUrgent ? 'text-amber-600 font-medium' : 'text-ink-tertiary'
        )}>
          <Clock size={12} />
          {waitMins > 0 ? `${waitMins}m` : 'just now'}
        </div>
      </div>

      {/* Status + action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('pill text-xs hidden md:inline-flex', getRideStatusColor(ride.status))}>
          {getRideStatusLabel(ride.status)}
        </span>
        {(ride.status === 'REQUESTED' || ride.status === 'DISPATCHING') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAssign(ride)}
            icon={<UserCheck size={13} />}
          >
            Assign
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Driver Queue Row ─────────────────────────────────────────

function DriverQueueRow({
  driver,
  onCheckIn,
  onCheckOut,
  terminalId,
}: {
  driver: Driver
  onCheckIn: (driverId: string) => void
  onCheckOut: (driverId: string) => void
  terminalId: string | undefined
}) {
  const inQueue = driver.availability === 'AVAILABLE'

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-subtle transition-colors">
      <Avatar name={driver.fullName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{driver.fullName}</p>
        <p className="text-xs text-ink-tertiary">
          #{driver.driverCode} · {getChannelIcon(driver.primaryChannel)} {driver.primaryChannel}
        </p>
      </div>
      <Badge variant={inQueue ? 'live' : 'offline'}>
        {inQueue ? 'Available' : 'Offline'}
      </Badge>
      {terminalId && (
        <button
          onClick={() => inQueue ? onCheckOut(driver.id) : onCheckIn(driver.id)}
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors',
            inQueue
              ? 'text-red-600 hover:bg-red-50'
              : 'text-primary-600 hover:bg-primary-50'
          )}
        >
          {inQueue ? <><LogOut size={12} />Out</> : <><LogIn size={12} />In</>}
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function DispatchBoardPage() {
  const [assignTarget, setAssignTarget] = useState<RideRequest | null>(null)
  const [activeTab, setActiveTab] = useState<'rides' | 'drivers'>('rides')

  // For a real app, terminalId would come from the dispatcher's profile
  const terminalId = undefined as string | undefined

  const {
    data: rides,
    isLoading: ridesLoading,
    isRefetching: ridesRefetching,
    refetch: refetchRides,
  } = useDispatcherRides(terminalId)

  const {
    data: drivers,
    isLoading: driversLoading,
    refetch: refetchDrivers,
  } = useDispatcherDrivers(terminalId)

  const checkIn = useQueueCheckIn()
  const checkOut = useQueueCheckOut()
  const { addToast } = useUiStore()

  useDispatcherRidesRealtime()

  const pendingRides = rides?.filter((r) =>
    ['REQUESTED', 'DISPATCHING', 'OFFERED'].includes(r.status)
  ) ?? []

  const activeRides = rides?.filter((r) =>
    ['ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)
  ) ?? []

  const handleCheckIn = async (driverId: string) => {
    if (!terminalId) return
    try {
      await checkIn.mutateAsync({ terminalId, driverId })
      addToast({ type: 'success', message: 'Driver checked in.' })
    } catch {
      addToast({ type: 'error', message: 'Check-in failed.' })
    }
  }

  const handleCheckOut = async (driverId: string) => {
    if (!terminalId) return
    try {
      await checkOut.mutateAsync({ terminalId, driverId })
      addToast({ type: 'info', message: 'Driver checked out.' })
    } catch {
      addToast({ type: 'error', message: 'Check-out failed.' })
    }
  }

  return (
    <PageLayout maxWidth="7xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">Dispatch Board</h1>
          <p className="text-sm text-ink-secondary mt-1">Manage rides and drivers at your terminal</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetchRides(); refetchDrivers() }}
            className={cn(
              'p-2 rounded-xl text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-all',
              ridesRefetching && 'animate-spin text-primary-500'
            )}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pending', value: pendingRides.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Rides', value: activeRides.length, color: 'text-primary-700', bg: 'bg-primary-50' },
          { label: 'Available Drivers', value: drivers?.filter(d => d.availability === 'AVAILABLE').length ?? 0, color: 'text-status-live', bg: 'bg-status-live-bg' },
          { label: 'Total Drivers', value: drivers?.length ?? 0, color: 'text-ink-secondary', bg: 'bg-surface-subtle' },
        ].map((kpi) => (
          <div key={kpi.label} className="surface-card p-4">
            <p className="text-xs text-ink-tertiary mb-1">{kpi.label}</p>
            <p className={cn('text-2xl font-display font-bold', kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar (mobile) */}
      <div className="flex gap-1 p-1 bg-surface-subtle rounded-xl mb-5 sm:hidden">
        {(['rides', 'drivers'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              activeTab === tab
                ? 'bg-white text-ink shadow-card'
                : 'text-ink-secondary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Pending Rides */}
        <div className={cn('flex flex-col', activeTab === 'drivers' && 'hidden sm:flex')}>
          <SectionTitle
            description={`${pendingRides.length} waiting for assignment`}
            action={
              pendingRides.some((r) => {
                const waitMins = Math.round((Date.now() - new Date(r.createdAt).getTime()) / 60000)
                return waitMins >= 5
              }) && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <AlertCircle size={13} />
                  Urgent
                </span>
              )
            }
          >
            Ride Requests
          </SectionTitle>

          <div className="surface-card-primary overflow-hidden flex-1">
            {ridesLoading ? (
              <div className="py-10"><Spinner size="sm" label="Loading rides…" /></div>
            ) : pendingRides.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={24} />}
                title="No pending rides"
                description="All current requests have been dispatched."
              />
            ) : (
              <div className="divide-y divide-slate-50">
                {pendingRides.map((ride) => (
                  <RideRequestRow
                    key={ride.id}
                    ride={ride}
                    onAssign={setAssignTarget}
                  />
                ))}
              </div>
            )}

            {/* Active rides section */}
            {activeRides.length > 0 && (
              <>
                <div className="px-5 py-2.5 bg-surface-subtle border-t border-b border-slate-100">
                  <p className="text-xs font-semibold text-ink-tertiary uppercase tracking-wide">
                    Active · {activeRides.length}
                  </p>
                </div>
                <div className="divide-y divide-slate-50">
                  {activeRides.map((ride) => (
                    <RideRequestRow
                      key={ride.id}
                      ride={ride}
                      onAssign={setAssignTarget}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Drivers */}
        <div className={cn('flex flex-col', activeTab === 'rides' && 'hidden sm:flex')}>
          <SectionTitle
            description={`${drivers?.filter(d => d.availability === 'AVAILABLE').length ?? 0} available`}
          >
            Drivers
          </SectionTitle>

          <div className="surface-card-primary overflow-hidden flex-1">
            {driversLoading ? (
              <div className="py-10"><Spinner size="sm" label="Loading drivers…" /></div>
            ) : !drivers?.length ? (
              <EmptyState
                icon={<Car size={24} />}
                title="No drivers"
                description="No drivers are currently registered at this terminal."
              />
            ) : (
              <div className="divide-y divide-slate-50">
                {drivers.map((driver) => (
                  <DriverQueueRow
                    key={driver.id}
                    driver={driver}
                    terminalId={terminalId}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign driver modal */}
      <AssignDriverModal
        ride={assignTarget}
        drivers={drivers ?? []}
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
      />
    </PageLayout>
  )
}
