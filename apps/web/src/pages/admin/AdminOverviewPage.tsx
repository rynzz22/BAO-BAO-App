import { useState } from 'react'
import {
  Car, Users, TrendingUp, Clock, CheckCircle2,
  XCircle, AlertTriangle, ChevronRight, RefreshCw,
  LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRideStatusLabel, getRideStatusColor, getApprovalColor, getChannelIcon, formatDate, formatTime } from '@/lib/utils'
import { useAdminDashboard, useAdminDrivers, useAdminVehicles, useAdminRides, useApproveDriver, useApproveVehicle } from '@/hooks/useAdmin'
import { useUiStore } from '@/stores/uiStore'
import PageLayout, { SectionTitle } from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import type { Driver, Vehicle } from '@/types'

// ─── KPI Card ─────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  trend,
  color = 'primary',
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  trend?: string
  color?: 'primary' | 'green' | 'amber' | 'slate'
}) {
  const colorMap = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', value: 'text-primary-700' },
    green:   { bg: 'bg-status-live-bg', text: 'text-status-live', value: 'text-status-live' },
    amber:   { bg: 'bg-amber-50', text: 'text-amber-600', value: 'text-amber-700' },
    slate:   { bg: 'bg-surface-subtle', text: 'text-ink-tertiary', value: 'text-ink-secondary' },
  }
  const c = colorMap[color]

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg, c.text)}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-ink-tertiary">{trend}</span>
        )}
      </div>
      <p className={cn('text-2xl font-display font-bold', c.value)}>{value}</p>
      <p className="text-xs text-ink-tertiary mt-0.5">{label}</p>
    </div>
  )
}

// ─── Approve Driver Modal ─────────────────────────────────────

function DriverApprovalModal({
  driver,
  open,
  onClose,
}: {
  driver: Driver | null
  open: boolean
  onClose: () => void
}) {
  const approveDriver = useApproveDriver()
  const { addToast } = useUiStore()

  const handle = async (status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    if (!driver) return
    try {
      await approveDriver.mutateAsync({ driverId: driver.id, status })
      addToast({ type: 'success', message: `Driver ${status.toLowerCase()}.` })
      onClose()
    } catch {
      addToast({ type: 'error', message: 'Action failed. Try again.' })
    }
  }

  if (!driver) return null

  return (
    <Modal open={open} onClose={onClose} title="Manage Driver" size="sm">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle mb-5">
        <Avatar name={driver.fullName} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink truncate">{driver.fullName}</p>
          <p className="text-xs text-ink-tertiary">
            #{driver.driverCode} · {getChannelIcon(driver.primaryChannel)} {driver.primaryChannel}
          </p>
          <p className="text-xs text-ink-tertiary">{driver.phoneNumber ?? 'No phone'}</p>
        </div>
        <span className={cn('pill text-xs', getApprovalColor(driver.approvalStatus))}>
          {driver.approvalStatus}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {driver.approvalStatus !== 'APPROVED' && (
          <Button
            variant="primary" size="md" fullWidth
            icon={<CheckCircle2 size={15} />}
            loading={approveDriver.isPending}
            onClick={() => handle('APPROVED')}
          >
            Approve Driver
          </Button>
        )}
        {driver.approvalStatus !== 'SUSPENDED' && (
          <Button
            variant="ghost" size="md" fullWidth
            icon={<AlertTriangle size={15} />}
            loading={approveDriver.isPending}
            onClick={() => handle('SUSPENDED')}
            className="text-amber-600 hover:bg-amber-50"
          >
            Suspend
          </Button>
        )}
        {driver.approvalStatus !== 'REJECTED' && (
          <Button
            variant="ghost" size="md" fullWidth
            icon={<XCircle size={15} />}
            loading={approveDriver.isPending}
            onClick={() => handle('REJECTED')}
            className="text-red-600 hover:bg-red-50"
          >
            Reject
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ─── Driver Row ───────────────────────────────────────────────

function DriverRow({
  driver,
  onManage,
}: {
  driver: Driver
  onManage: (d: Driver) => void
}) {
  return (
    <button
      onClick={() => onManage(driver)}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-surface-subtle transition-colors group"
    >
      <Avatar name={driver.fullName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{driver.fullName}</p>
        <p className="text-xs text-ink-tertiary">
          #{driver.driverCode} · {getChannelIcon(driver.primaryChannel)} {driver.primaryChannel}
          {driver.currentVehicle && ` · ${driver.currentVehicle.plateOrBodyNo}`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('pill text-xs', getApprovalColor(driver.approvalStatus))}>
          {driver.approvalStatus}
        </span>
        <Badge variant={
          driver.availability === 'AVAILABLE' ? 'live'
          : driver.availability === 'BUSY' ? 'reported'
          : 'offline'
        }>
          {driver.availability}
        </Badge>
        <ChevronRight size={14} className="text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  )
}

// ─── Vehicle Row ──────────────────────────────────────────────

function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
  const approveVehicle = useApproveVehicle()
  const { addToast } = useUiStore()

  const handleApprove = async () => {
    try {
      await approveVehicle.mutateAsync({ vehicleId: vehicle.id, status: 'APPROVED' })
      addToast({ type: 'success', message: 'Vehicle approved.' })
    } catch {
      addToast({ type: 'error', message: 'Action failed.' })
    }
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-subtle transition-colors">
      <div className="w-9 h-9 rounded-xl bg-surface-subtle flex items-center justify-center flex-shrink-0">
        <Car size={16} className="text-ink-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{vehicle.plateOrBodyNo}</p>
        <p className="text-xs text-ink-tertiary">
          {vehicle.vehicleType.name} · Capacity {vehicle.capacity}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('pill text-xs', getApprovalColor(vehicle.approvalStatus))}>
          {vehicle.approvalStatus}
        </span>
        {vehicle.approvalStatus === 'PENDING' && (
          <Button
            variant="secondary" size="sm"
            loading={approveVehicle.isPending}
            onClick={handleApprove}
          >
            Approve
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Page Tabs ────────────────────────────────────────────────

type AdminTab = 'overview' | 'drivers' | 'vehicles' | 'rides'

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Overview',  icon: <LayoutDashboard size={15} /> },
  { id: 'drivers',   label: 'Drivers',   icon: <Users size={15} /> },
  { id: 'vehicles',  label: 'Vehicles',  icon: <Car size={15} /> },
  { id: 'rides',     label: 'Rides',     icon: <TrendingUp size={15} /> },
]

// ─── Overview Tab ─────────────────────────────────────────────

function OverviewTab() {
  const { data: dashboard, isLoading, refetch, isRefetching } = useAdminDashboard()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-secondary">Live system metrics</p>
        <button
          onClick={() => refetch()}
          className={cn('p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-all', isRefetching && 'animate-spin text-primary-500')}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-10"><Spinner size="sm" label="Loading metrics…" /></div>
      ) : dashboard ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard label="Active Vehicles"   value={dashboard.activeVehicles}   icon={<Car size={18} />}         color="primary" />
            <KpiCard label="Active Drivers"    value={dashboard.activeDrivers}    icon={<Users size={18} />}       color="green" />
            <KpiCard label="Rides Today"       value={dashboard.ridesToday}       icon={<TrendingUp size={18} />}  color="primary" />
            <KpiCard label="Pending Approvals" value={dashboard.pendingApprovals} icon={<Clock size={18} />}       color="amber" />
            <KpiCard label="Completed Today"   value={dashboard.completedToday}   icon={<CheckCircle2 size={18} />} color="green" />
            <KpiCard label="Cancelled Today"   value={dashboard.cancelledToday}   icon={<XCircle size={18} />}    color="slate" />
          </div>

          {dashboard.pendingApprovals > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>{dashboard.pendingApprovals}</strong> driver or vehicle{dashboard.pendingApprovals > 1 ? 's' : ''} pending approval. Review them in the Drivers and Vehicles tabs.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

// ─── Drivers Tab ──────────────────────────────────────────────

function DriversTab() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [managingDriver, setManagingDriver] = useState<Driver | null>(null)

  const filters = statusFilter !== 'ALL' ? { status: statusFilter } : undefined
  const { data: drivers, isLoading } = useAdminDrivers(filters)

  const statuses = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED']

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'pill text-xs',
              statusFilter === s ? 'pill-active' : 'pill-muted'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="surface-card-primary overflow-hidden">
        {isLoading ? (
          <div className="py-10"><Spinner size="sm" label="Loading drivers…" /></div>
        ) : !drivers?.length ? (
          <EmptyState icon={<Users size={24} />} title="No drivers found" description="No drivers match the current filter." />
        ) : (
          <div className="divide-y divide-slate-50">
            {drivers.map((driver) => (
              <DriverRow key={driver.id} driver={driver} onManage={setManagingDriver} />
            ))}
          </div>
        )}
      </div>

      <DriverApprovalModal
        driver={managingDriver}
        open={!!managingDriver}
        onClose={() => setManagingDriver(null)}
      />
    </div>
  )
}

// ─── Vehicles Tab ─────────────────────────────────────────────

function VehiclesTab() {
  const { data: vehicles, isLoading } = useAdminVehicles()

  return (
    <div className="surface-card-primary overflow-hidden">
      {isLoading ? (
        <div className="py-10"><Spinner size="sm" label="Loading vehicles…" /></div>
      ) : !vehicles?.length ? (
        <EmptyState icon={<Car size={24} />} title="No vehicles" description="No vehicles are registered yet." />
      ) : (
        <div className="divide-y divide-slate-50">
          {vehicles.map((vehicle) => (
            <VehicleRow key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Rides Tab ────────────────────────────────────────────────

function RidesTab() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data: rides, isLoading } = useAdminRides(statusFilter ? { status: statusFilter } : undefined)

  const statuses = ['', 'REQUESTED', 'DISPATCHING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => setStatusFilter(s)}
            className={cn('pill text-xs', statusFilter === s ? 'pill-active' : 'pill-muted')}
          >
            {s || 'ALL'}
          </button>
        ))}
      </div>

      <div className="surface-card-primary overflow-hidden">
        {isLoading ? (
          <div className="py-10"><Spinner size="sm" label="Loading rides…" /></div>
        ) : !rides?.length ? (
          <EmptyState icon={<TrendingUp size={24} />} title="No rides" description="No rides match the current filter." />
        ) : (
          <div className="divide-y divide-slate-50">
            {rides.map((ride) => (
              <div key={ride.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-subtle transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-ink truncate">
                      {ride.destination.label ?? 'Destination'}
                    </p>
                  </div>
                  <p className="text-xs text-ink-tertiary">
                    {formatDate(ride.createdAt)} {formatTime(ride.createdAt)} · {ride.passengerCount}p
                    {ride.pickup.label && ` · from ${ride.pickup.label}`}
                  </p>
                </div>
                <span className={cn('pill text-xs flex-shrink-0', getRideStatusColor(ride.status))}>
                  {getRideStatusLabel(ride.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [tab, setTab] = useState<AdminTab>('overview')

  return (
    <PageLayout maxWidth="7xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">Admin Dashboard</h1>
        <p className="text-sm text-ink-secondary mt-1">Manage drivers, vehicles, zones, and monitor rides</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-surface-subtle rounded-xl mb-6 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150',
              tab === t.id
                ? 'bg-white text-ink shadow-card'
                : 'text-ink-secondary hover:text-ink'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab />}
      {tab === 'drivers'   && <DriversTab />}
      {tab === 'vehicles'  && <VehiclesTab />}
      {tab === 'rides'     && <RidesTab />}
    </PageLayout>
  )
}
