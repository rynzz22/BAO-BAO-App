import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { RideRequest, Driver, TerminalQueueEntry } from '@/types'

export function useDispatcherRides(terminalId?: string) {
  return useQuery({
    queryKey: ['dispatcher', 'rides', terminalId],
    queryFn: () => api.get<RideRequest[]>(`/dispatch/rides?status=REQUESTED,DISPATCHING`),
    refetchInterval: 1000 * 8,
  })
}

export function useDispatcherDrivers(terminalId?: string) {
  return useQuery({
    queryKey: ['dispatcher', 'drivers', terminalId],
    queryFn: () =>
      api.get<Driver[]>(
        `/dispatch/drivers${terminalId ? `?terminalId=${terminalId}` : ''}`
      ),
    refetchInterval: 1000 * 10,
  })
}

export function useTerminalQueue(terminalId: string | undefined) {
  return useQuery({
    queryKey: ['dispatcher', 'queue', terminalId],
    queryFn: () => api.get<TerminalQueueEntry[]>(`/dispatch/drivers?terminalId=${terminalId}`),
    enabled: !!terminalId,
    refetchInterval: 1000 * 10,
  })
}

export function useAssignDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rideId, driverId }: { rideId: string; driverId: string }) =>
      api.post(`/dispatch/rides/${rideId}/assign`, { driverId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispatcher', 'rides'] })
      qc.invalidateQueries({ queryKey: ['dispatcher', 'drivers'] })
    },
  })
}

export function useQueueCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ terminalId, driverId }: { terminalId: string; driverId: string }) =>
      api.post('/dispatch/queue/check-in', { terminalId, driverId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispatcher', 'queue'] }),
  })
}

export function useQueueCheckOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ terminalId, driverId }: { terminalId: string; driverId: string }) =>
      api.post('/dispatch/queue/check-out', { terminalId, driverId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispatcher', 'queue'] }),
  })
}
