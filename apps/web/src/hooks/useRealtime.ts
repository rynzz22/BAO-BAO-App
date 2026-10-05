import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Subscribe to real-time ride status updates for a specific ride.
 */
export function useRideRealtime(rideId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!rideId) return

    const channel = supabase
      .channel(`ride:${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_requests',
          filter: `id=eq.${rideId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['ride', rideId] })
          qc.invalidateQueries({ queryKey: ['ride', 'active'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [rideId, qc])
}

/**
 * Subscribe to real-time driver location updates.
 */
export function useDriverLocationsRealtime() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('driver-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
        },
        () => {
          qc.invalidateQueries({ queryKey: ['nearby-vehicles'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}

/**
 * Subscribe to ride offers for a driver.
 */
export function useDriverOffersRealtime(driverId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!driverId) return

    const channel = supabase
      .channel(`driver-offers:${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers',
          filter: `driver_id=eq.${driverId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['driver', 'offers'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [driverId, qc])
}

/**
 * Subscribe to new ride requests for dispatcher.
 */
export function useDispatcherRidesRealtime() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('dispatcher-rides')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
        },
        () => {
          qc.invalidateQueries({ queryKey: ['dispatcher', 'rides'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
