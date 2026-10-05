import { Car, ChevronRight, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistance, formatRelativeTime } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { TrackingBadge } from '@/components/ui/Badge'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import type { NearbyVehicle } from '@/types'

interface VehicleRowProps {
  vehicle: NearbyVehicle
  isSelected: boolean
  onSelect: () => void
}

function VehicleRow({ vehicle, isSelected, onSelect }: VehicleRowProps) {
  const isAvailable = vehicle.availability === 'AVAILABLE'

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150',
        'hover:bg-surface-subtle',
        isSelected && 'bg-primary-50'
      )}
    >
      {/* Vehicle icon */}
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
          isAvailable
            ? 'bg-primary-100 text-primary-600'
            : 'bg-surface-subtle text-ink-tertiary'
        )}
      >
        <Car size={16} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-ink truncate">
            {vehicle.driverName}
          </span>
          <span className="text-xs text-ink-tertiary flex-shrink-0">
            #{vehicle.driverCode}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-tertiary">{vehicle.vehicleType}</span>
          <span className="text-ink-tertiary">·</span>
          <span className="text-xs text-ink-tertiary">{vehicle.bodyNumber}</span>
          <span className="text-ink-tertiary">·</span>
          <span className="text-xs text-ink-tertiary">
            {formatRelativeTime(vehicle.locationUpdatedAt)}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <TrackingBadge source={vehicle.trackingSource} />
        <span className="text-xs font-medium text-ink-secondary">
          {formatDistance(vehicle.distanceMeters)}
        </span>
      </div>

      <ChevronRight
        size={14}
        className={cn(
          'text-ink-tertiary flex-shrink-0 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      />
    </button>
  )
}

interface AvailableVehiclesProps {
  vehicles: NearbyVehicle[] | undefined
  isLoading: boolean
  isRefetching?: boolean
  onRefresh?: () => void
}

export default function AvailableVehicles({
  vehicles,
  isLoading,
  isRefetching,
  onRefresh,
}: AvailableVehiclesProps) {
  const { selectedVehicleId, setSelectedVehicleId } = useUiStore()

  const available = vehicles?.filter((v) => v.availability === 'AVAILABLE') ?? []
  const other = vehicles?.filter((v) => v.availability !== 'AVAILABLE') ?? []

  return (
    <div className="surface-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-ink">Available Vehicles</h3>
          {!isLoading && (
            <p className="text-xs text-ink-tertiary mt-0.5">
              {available.length} available nearby
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Status summary pills */}
          {!isLoading && vehicles && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-ink-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-status-live" />
                {vehicles.filter((v) => v.trackingSource === 'LIVE_APP').length} live
              </span>
              <span className="flex items-center gap-1 text-xs text-ink-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-status-terminal" />
                {vehicles.filter((v) => v.trackingSource === 'TERMINAL').length} terminal
              </span>
            </div>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefetching}
            className={cn(
              'p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-all',
              isRefetching && 'animate-spin text-primary-500'
            )}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-8">
          <Spinner size="sm" label="Loading vehicles…" />
        </div>
      ) : !vehicles?.length ? (
        <EmptyState
          icon={<Car size={24} />}
          title="No vehicles nearby"
          description="There are no vehicles within range right now. Try refreshing in a moment."
        />
      ) : (
        <div className="divide-y divide-slate-50">
          {/* Available first */}
          {available.map((vehicle) => (
            <VehicleRow
              key={vehicle.driverId}
              vehicle={vehicle}
              isSelected={selectedVehicleId === vehicle.driverId}
              onSelect={() => setSelectedVehicleId(
                selectedVehicleId === vehicle.driverId ? null : vehicle.driverId
              )}
            />
          ))}

          {/* Others with a subtle separator */}
          {other.length > 0 && available.length > 0 && (
            <div className="px-5 py-2 bg-surface-subtle">
              <span className="text-xs text-ink-tertiary font-medium uppercase tracking-wide">
                Busy / Offline
              </span>
            </div>
          )}

          {other.map((vehicle) => (
            <VehicleRow
              key={vehicle.driverId}
              vehicle={vehicle}
              isSelected={selectedVehicleId === vehicle.driverId}
              onSelect={() => setSelectedVehicleId(
                selectedVehicleId === vehicle.driverId ? null : vehicle.driverId
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
