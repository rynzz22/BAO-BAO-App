import { create } from 'zustand'
import type { RideRequest, LocationPoint } from '@/types'

interface RideRequestDraft {
  pickup: LocationPoint | null
  destination: LocationPoint | null
  passengerCount: number
  notes: string
}

interface RideState {
  // Active ride
  activeRide: RideRequest | null
  setActiveRide: (ride: RideRequest | null) => void

  // Ride request draft
  draft: RideRequestDraft
  setPickup: (pickup: LocationPoint | null) => void
  setDestination: (destination: LocationPoint | null) => void
  setPassengerCount: (count: number) => void
  setNotes: (notes: string) => void
  resetDraft: () => void
}

const defaultDraft: RideRequestDraft = {
  pickup: null,
  destination: null,
  passengerCount: 1,
  notes: '',
}

export const useRideStore = create<RideState>((set) => ({
  activeRide: null,
  setActiveRide: (ride) => set({ activeRide: ride }),

  draft: { ...defaultDraft },
  setPickup: (pickup) => set((s) => ({ draft: { ...s.draft, pickup } })),
  setDestination: (destination) => set((s) => ({ draft: { ...s.draft, destination } })),
  setPassengerCount: (passengerCount) => set((s) => ({ draft: { ...s.draft, passengerCount } })),
  setNotes: (notes) => set((s) => ({ draft: { ...s.draft, notes } })),
  resetDraft: () => set({ draft: { ...defaultDraft } }),
}))
