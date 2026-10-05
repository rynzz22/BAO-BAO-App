import { create } from 'zustand'
import type { Toast, ModalType } from '@/types'

interface UiState {
  // Toasts
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Modal
  modal: ModalType
  modalData: unknown
  openModal: (type: ModalType, data?: unknown) => void
  closeModal: () => void

  // Sidebar (mobile)
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Map
  mapCenter: { lat: number; lng: number }
  mapZoom: number
  setMapView: (center: { lat: number; lng: number }, zoom: number) => void

  // Selected vehicle on map
  selectedVehicleId: string | null
  setSelectedVehicleId: (id: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, toast.duration ?? 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  modal: null,
  modalData: null,
  openModal: (type, data = null) => set({ modal: type, modalData: data }),
  closeModal: () => set({ modal: null, modalData: null }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Default center: Talibon, Bohol, Philippines
  mapCenter: { lat: 10.1508, lng: 124.3316 },
  mapZoom: 15,
  setMapView: (mapCenter, mapZoom) => set({ mapCenter, mapZoom }),

  selectedVehicleId: null,
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
}))
