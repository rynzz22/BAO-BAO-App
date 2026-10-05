import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Driver, RideOffer, RideRequest } from '@/types'

export function useDriverMe() {
  return useQuery({
    queryKey: ['driver', 'me'],
    queryFn: () => api.get<Driver>('/driver/me'),
  })
}

export function useDriverOffers() {
  return useQuery({
    queryKey: ['driver', 'offers'],
    queryFn: () => api.get<RideOffer[]>('/driver/offers'),
    refetchInterval: 1000 * 5,
  })
}

export function useDriverActiveRide() {
  return useQuery({
    queryKey: ['driver', 'active-ride'],
    queryFn: () => api.get<RideRequest | null>('/driver/rides/active'),
    refetchInterval: 1000 * 5,
    retry: false,
  })
}

export function useSetDriverStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (availability: 'AVAILABLE' | 'OFFLINE') =>
      api.post('/driver/status', { availability }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver', 'me'] }),
  })
}

export function useUpdateDriverLocation() {
  return useMutation({
    mutationFn: ({ lat, lng, accuracy }: { lat: number; lng: number; accuracy?: number }) =>
      api.post('/driver/location', { lat, lng, accuracy }),
  })
}

export function useAcceptOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) => api.post(`/driver/offers/${offerId}/accept`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver', 'offers'] })
      qc.invalidateQueries({ queryKey: ['driver', 'active-ride'] })
    },
  })
}

export function useDeclineOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) => api.post(`/driver/offers/${offerId}/decline`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver', 'offers'] }),
  })
}

export function useUpdateRideStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rideId, action }: { rideId: string; action: 'en-route' | 'arrived' | 'start' | 'complete' }) =>
      api.post(`/driver/rides/${rideId}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver', 'active-ride'] }),
  })
}
