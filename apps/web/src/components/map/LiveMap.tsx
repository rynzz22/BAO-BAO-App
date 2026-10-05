import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import { MapPin, Navigation, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime, formatDistance } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { useNearbyVehicles } from '@/hooks/useNearbyVehicles'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useDriverLocationsRealtime } from '@/hooks/useRealtime'
import type { NearbyVehicle } from '@/types'

// Talibon, Bohol default center
const TALIBON_CENTER: [number, number] = [10.1508, 124.3316]
const DEFAULT_ZOOM = 15

function createVehicleIcon(source: string, available: boolean): L.DivIcon {
  const colors: Record<string, { bg: string; ring: string }> = {
    LIVE_APP: { bg: '#16a34a', ring: '#dcfce7' },
    LAST_REPORTED: { bg: '#d97706', ring: '#fef3c7' },
    TERMINAL: { bg: '#2563eb', ring: '#dbeafe' },
    GPS_TRACKER: { bg: '#16a34a', ring: '#dcfce7' },
    UNKNOWN: { bg: '#94a3b8', ring: '#f1f5f9' },
  }

  const { bg, ring } = colors[source] ?? colors.UNKNOWN
  const opacity = available ? '1' : '0.55'

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:36px;height:36px;opacity:${opacity}">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${ring};
          ${source === 'LIVE_APP' ? 'animation:pulseDot 2s ease-in-out infinite;' : ''}
        "></div>
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:${bg};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/>
            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:20px;height:20px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:rgba(59,130,246,0.2);
          animation:pulseDot 2s ease-in-out infinite;
        "></div>
        <div style="
          position:absolute;inset:3px;border-radius:50%;
          background:#3b82f6;
          border:2px solid white;
          box-shadow:0 2px 8px rgba(59,130,246,0.5);
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function VehiclePopup({ vehicle }: { vehicle: NearbyVehicle }) {
  const sourceLabels: Record<string, string> = {
    LIVE_APP: 'Live',
    LAST_REPORTED: 'Reported',
    TERMINAL: 'Terminal',
    GPS_TRACKER: 'GPS Live',
    UNKNOWN: 'Unknown',
  }

  const sourceColors: Record<string, string> = {
    LIVE_APP: '#16a34a',
    LAST_REPORTED: '#d97706',
    TERMINAL: '#2563eb',
    GPS_TRACKER: '#16a34a',
    UNKNOWN: '#94a3b8',
  }

  return `
    <div style="font-family:Inter,sans-serif;padding:12px 14px;min-width:180px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="
          width:32px;height:32px;border-radius:10px;
          background:linear-gradient(135deg,#14b8a6,#0d9488);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <div>
          <div style="font-weight:600;font-size:13px;color:#0f172a">${vehicle.driverName}</div>
          <div style="font-size:11px;color:#94a3b8">#${vehicle.driverCode} · ${vehicle.bodyNumber}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="
          display:inline-flex;align-items:center;gap:4px;
          padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;
          background:${sourceColors[vehicle.trackingSource]}22;
          color:${sourceColors[vehicle.trackingSource]};
        ">
          <span style="width:6px;height:6px;border-radius:50%;background:${sourceColors[vehicle.trackingSource]};display:inline-block"></span>
          ${sourceLabels[vehicle.trackingSource] ?? vehicle.trackingSource}
        </span>
        <span style="font-size:11px;color:#64748b">${formatDistance(vehicle.distanceMeters)} away</span>
      </div>
      <div style="margin-top:6px;font-size:11px;color:#94a3b8">
        Updated ${formatRelativeTime(vehicle.locationUpdatedAt)}
      </div>
    </div>
  `
}

interface LiveMapProps {
  className?: string
  vehicles?: NearbyVehicle[]
  onVehicleClick?: (vehicle: NearbyVehicle) => void
  pickupLat?: number
  pickupLng?: number
  destinationLat?: number
  destinationLng?: number
  height?: string
}

export default function LiveMap({
  className,
  vehicles,
  onVehicleClick,
  pickupLat,
  pickupLng,
  destinationLat,
  destinationLng,
  height = '100%',
}: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)
  const pickupMarkerRef = useRef<L.Marker | null>(null)
  const destMarkerRef = useRef<L.Marker | null>(null)

  const { mapCenter, mapZoom, setMapView, selectedVehicleId, setSelectedVehicleId } = useUiStore()
  const geo = useGeolocation()

  useDriverLocationsRealtime()

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: TALIBON_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    // Move zoom control to bottom-right
    map.zoomControl.setPosition('bottomright')

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // User location marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !geo.lat || !geo.lng) return

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([geo.lat, geo.lng])
    } else {
      userMarkerRef.current = L.marker([geo.lat, geo.lng], { icon: createUserIcon(), zIndexOffset: 1000 }).addTo(map)
    }
  }, [geo.lat, geo.lng])

  // Vehicle markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !vehicles) return

    const currentIds = new Set(vehicles.map((v) => v.driverId))

    // Remove stale markers
    for (const [id, marker] of markersRef.current.entries()) {
      if (!currentIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }

    // Add/update markers
    for (const vehicle of vehicles) {
      const isAvailable = vehicle.availability === 'AVAILABLE'
      const icon = createVehicleIcon(vehicle.trackingSource, isAvailable)

      const existing = markersRef.current.get(vehicle.driverId)
      if (existing) {
        existing.setLatLng([vehicle.lat, vehicle.lng])
        existing.setIcon(icon)
      } else {
        const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
          .addTo(map)
          .bindPopup(VehiclePopup({ vehicle }), {
            maxWidth: 240,
            closeButton: false,
          })

        marker.on('click', () => {
          setSelectedVehicleId(vehicle.driverId)
          onVehicleClick?.(vehicle)
        })

        markersRef.current.set(vehicle.driverId, marker)
      }
    }
  }, [vehicles, onVehicleClick, setSelectedVehicleId])

  // Highlight selected vehicle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedVehicleId) return
    const marker = markersRef.current.get(selectedVehicleId)
    if (marker) {
      marker.openPopup()
      map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 })
    }
  }, [selectedVehicleId])

  // Pickup marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (pickupLat && pickupLng) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          background:linear-gradient(135deg,#14b8a6,#0d9488);
          border:3px solid white;box-shadow:0 4px 12px rgba(20,184,166,0.4);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })

      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng([pickupLat, pickupLng])
      } else {
        pickupMarkerRef.current = L.marker([pickupLat, pickupLng], { icon, zIndexOffset: 900 }).addTo(map)
        pickupMarkerRef.current.bindPopup('<div style="padding:8px 10px;font-size:13px;font-weight:600">Pickup</div>', { closeButton: false })
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove()
      pickupMarkerRef.current = null
    }
  }, [pickupLat, pickupLng])

  // Destination marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (destinationLat && destinationLng) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:#f59e0b;
          border:3px solid white;box-shadow:0 4px 12px rgba(245,158,11,0.4);
          display:flex;align-items:center;justify-content:center;
        "><div style="width:8px;height:8px;border-radius:50%;background:white"></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([destinationLat, destinationLng])
      } else {
        destMarkerRef.current = L.marker([destinationLat, destinationLng], { icon, zIndexOffset: 900 }).addTo(map)
        destMarkerRef.current.bindPopup('<div style="padding:8px 10px;font-size:13px;font-weight:600">Destination</div>', { closeButton: false })
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove()
      destMarkerRef.current = null
    }
  }, [destinationLat, destinationLng])

  const handleLocate = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    if (geo.lat && geo.lng) {
      map.flyTo([geo.lat, geo.lng], 17, { animate: true, duration: 1 })
      setMapView({ lat: geo.lat, lng: geo.lng }, 17)
    } else {
      map.flyTo(TALIBON_CENTER, DEFAULT_ZOOM, { animate: true, duration: 1 })
    }
  }, [geo.lat, geo.lng, setMapView])

  const handleRefresh = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.invalidateSize()
  }, [])

  return (
    <div className={cn('relative rounded-3xl overflow-hidden', className)} style={{ height }}>
      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Frosted floating controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Locate me button */}
        <button
          onClick={handleLocate}
          title="Center on my location"
          className={cn(
            'w-9 h-9 glass rounded-xl flex items-center justify-center',
            'text-ink-secondary hover:text-primary-600 transition-colors shadow-float',
            geo.lat && 'text-primary-500'
          )}
        >
          <Navigation size={15} />
        </button>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          title="Refresh map"
          className="w-9 h-9 glass rounded-xl flex items-center justify-center text-ink-secondary hover:text-ink transition-colors shadow-float"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Mini legend */}
      <div className="absolute bottom-4 left-4 z-10 glass rounded-xl px-3 py-2 shadow-float">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-live" />
            <span className="text-ink-secondary">Live</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-reported" />
            <span className="text-ink-secondary">Reported</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-terminal" />
            <span className="text-ink-secondary">Terminal</span>
          </span>
        </div>
      </div>

      {/* Loading overlay when no location yet */}
      {geo.loading && (
        <div className="absolute inset-0 z-10 bg-surface-base/60 backdrop-blur-xs flex items-center justify-center">
          <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3 shadow-float">
            <MapPin size={18} className="text-primary-500 animate-bounce" />
            <span className="text-sm font-medium text-ink-secondary">Finding your location…</span>
          </div>
        </div>
      )}
    </div>
  )
}
