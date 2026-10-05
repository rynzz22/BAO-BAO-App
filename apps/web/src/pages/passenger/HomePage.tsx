import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyVehicles } from '@/hooks/useNearbyVehicles'
import PageLayout from '@/components/layout/PageLayout'
import LiveMap from '@/components/map/LiveMap'
import RideRequestPanel from '@/components/passenger/RideRequestPanel'
import AvailableVehicles from '@/components/passenger/AvailableVehicles'
import { useUiStore } from '@/stores/uiStore'
import { useRideStore } from '@/stores/rideStore'

// Talibon, Bohol fallback
const TALIBON_LAT = 10.1508
const TALIBON_LNG = 124.3316

export default function PassengerHomePage() {
  const geo = useGeolocation()
  const { setSelectedVehicleId } = useUiStore()
  const { draft } = useRideStore()

  const lat = geo.lat ?? TALIBON_LAT
  const lng = geo.lng ?? TALIBON_LNG

  const { data: vehicles, isLoading, isRefetching, refetch } = useNearbyVehicles({
    lat,
    lng,
    radiusMeters: 5000,
    enabled: true,
  })

  return (
    <PageLayout className="pt-14" maxWidth="7xl">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
          Find a Ride in Talibon
        </h1>
        <p className="text-ink-secondary mt-1 text-sm sm:text-base">
          Real-time vehicle tracking &amp; community dispatch
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-5 items-start">
        {/* Left: Map */}
        <div className="flex flex-col gap-5">
          <LiveMap
            vehicles={vehicles}
            onVehicleClick={(v) => setSelectedVehicleId(v.driverId)}
            pickupLat={draft.pickup?.lat}
            pickupLng={draft.pickup?.lng}
            destinationLat={draft.destination?.lat}
            destinationLng={draft.destination?.lng}
            height="480px"
            className="w-full shadow-frost-md"
          />

          {/* Vehicle list below map on desktop */}
          <div className="hidden lg:block">
            <AvailableVehicles
              vehicles={vehicles}
              isLoading={isLoading}
              isRefetching={isRefetching}
              onRefresh={() => refetch()}
            />
          </div>
        </div>

        {/* Right: Ride request */}
        <div className="flex flex-col gap-5">
          <RideRequestPanel />

          {/* Vehicle list below request panel on tablet/mobile */}
          <div className="lg:hidden">
            <AvailableVehicles
              vehicles={vehicles}
              isLoading={isLoading}
              isRefetching={isRefetching}
              onRefresh={() => refetch()}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
