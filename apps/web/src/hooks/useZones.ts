import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Zone } from '@/types'

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: () => api.get<Zone[]>('/zones'),
    staleTime: 1000 * 60 * 5, // 5 minutes — zones rarely change
  })
}
