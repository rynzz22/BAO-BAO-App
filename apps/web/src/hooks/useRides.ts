import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { RideRequest, LocationPoint } from '@/types'

export function useActiveRide() {
  return useQuery({
    queryKey: ['ride', 'active'],
    queryFn: () => api.get<RideRequest | null>('/rides/active'),
    refetchInterval: 1000 * 5, // poll every 5s while waiting
    retry: false,
  })
}

export function useRide(rideId: string | undefined) {
  return useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => api.get<RideRequest>(`/rides/${rideId}`),
    enabled: !!rideId,
    refetchInterval: 1000 * 5,
  })
}

export function useRideHistory() {
  return useQuery({
    queryKey: ['rides', 'history'],
    queryFn: () => api.get<RideRequest[]>('/rides'),
  })
}

interface CreateRidePayload {
  pickup: LocationPoint
  destination: LocationPoint
  passengerCount: number
  notes?: string
}

export function useCreateRide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRidePayload) =>
      api.post<RideRequest>('/rides', payload),
    onSuccess: (ride) => {
      qc.setQueryData(['ride', 'active'], ride)
      qc.invalidateQueries({ queryKey: ['rides', 'history'] })
    },
  })
}

export function useCancelRide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rideId, reason }: { rideId: string; reason?: string }) =>
      api.post(`/rides/${rideId}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ride', 'active'] })
      qc.invalidateQueries({ queryKey: ['rides', 'history'] })
    },
  })
}

export function useRateRide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rideId, score, comment }: { rideId: string; score: number; comment?: string }) =>
      api.post(`/rides/${rideId}/rating`, { score, comment }),
    onSuccess: (_data, { rideId }) => {
      qc.invalidateQueries({ queryKey: ['ride', rideId] })
    },
  })
}
