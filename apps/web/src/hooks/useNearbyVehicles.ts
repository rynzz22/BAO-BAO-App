import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NearbyVehicle } from '@/types'

interface UseNearbyVehiclesOptions {
  lat: number
  lng: number
  radiusMeters?: number
  enabled?: boolean
}

export function useNearbyVehicles({ lat, lng, radiusMeters = 5000, enabled = true }: UseNearbyVehiclesOptions) {
  return useQuery({
    queryKey: ['nearby-vehicles', lat, lng, radiusMeters],
    queryFn: () =>
      api.get<NearbyVehicle[]>(
        `/vehicles/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`
      ),
    enabled,
    refetchInterval: 1000 * 15, // refresh every 15 seconds
    staleTime: 1000 * 10,
  })
}
