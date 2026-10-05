import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminDashboard, Driver, Vehicle, RideRequest } from '@/types'

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<AdminDashboard>('/admin/dashboard'),
    refetchInterval: 1000 * 30,
  })
}

export function useAdminDrivers(filters?: { status?: string; channel?: string }) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.channel) params.set('channel', filters.channel)
  const qs = params.toString()

  return useQuery({
    queryKey: ['admin', 'drivers', filters],
    queryFn: () => api.get<Driver[]>(`/admin/drivers${qs ? `?${qs}` : ''}`),
  })
}

export function useAdminVehicles() {
  return useQuery({
    queryKey: ['admin', 'vehicles'],
    queryFn: () => api.get<Vehicle[]>('/admin/vehicles'),
  })
}

export function useAdminRides(filters?: { status?: string }) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  const qs = params.toString()

  return useQuery({
    queryKey: ['admin', 'rides', filters],
    queryFn: () => api.get<RideRequest[]>(`/admin/rides${qs ? `?${qs}` : ''}`),
  })
}

export function useApproveDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ driverId, status }: { driverId: string; status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' }) =>
      api.patch(`/admin/drivers/${driverId}/approval`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'drivers'] }),
  })
}

export function useApproveVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vehicleId, status }: { vehicleId: string; status: 'APPROVED' | 'SUSPENDED' }) =>
      api.patch(`/admin/vehicles/${vehicleId}/approval`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'vehicles'] }),
  })
}
