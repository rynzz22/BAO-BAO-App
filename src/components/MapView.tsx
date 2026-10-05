import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NearbyVehicleDto } from '@bao-bao/shared';

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  vehicles?: NearbyVehicleDto[];
  pickup?: { lat: number; lng: number; label?: string } | null;
  destination?: { lat: number; lng: number; label?: string } | null;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  center = { lat: 10.1503, lng: 124.3305 }, // Talibon Poblacion
  zoom = 15,
  vehicles = [],
  pickup = null,
  destination = null,
  onMapClick,
  height = '360px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkersRef = useRef<L.Marker[]>([]);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([center.lat, center.lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.lat, center.lng]);
    }
  }, [center.lat, center.lng]);

  // Update Vehicle Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    vehicleMarkersRef.current.forEach((m) => m.remove());
    vehicleMarkersRef.current = [];

    vehicles.forEach((v) => {
      let iconColor = '#10B981'; // Green (LIVE_APP)
      let badgeLabel = '🟢 LIVE';

      if (v.trackingSource === 'LAST_REPORTED') {
        iconColor = '#F59E0B'; // Yellow/Amber
        badgeLabel = '🟡 LAST REPORTED';
      } else if (v.trackingSource === 'TERMINAL') {
        iconColor = '#64748B'; // Slate
        badgeLabel = '⚪ TERMINAL';
      } else if (v.trackingSource === 'GPS_TRACKER') {
        iconColor = '#0EA5E9'; // Sky Blue
        badgeLabel = '🔵 GPS TRACKER';
      }

      const customHtml = `
        <div style="background-color: ${iconColor}; color: white; border-radius: 9999px; padding: 4px 8px; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
          <span>🛵 #${v.driverCode}</span>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        html: customHtml,
        className: 'vehicle-marker-icon',
        iconAnchor: [30, 15],
      });

      const marker = L.marker([v.lat, v.lng], { icon: vehicleIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 160px;">
          <strong style="font-size: 13px;">${v.driverName} (#${v.driverCode})</strong><br/>
          <span style="font-size: 11px; color: #555;">Vehicle: ${v.vehicleType} (${v.plateOrBodyNo})</span><br/>
          <span style="font-size: 11px; color: #555;">Capacity: ${v.capacity} pax</span><br/>
          <div style="margin-top: 4px; font-size: 10px; font-weight: bold;">Tracking: ${badgeLabel}</div>
        </div>
      `);
      vehicleMarkersRef.current.push(marker);
    });
  }, [vehicles]);

  // Update Pickup Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    if (pickup) {
      const pickupIcon = L.divIcon({
        html: `<div style="background-color: #059669; color: white; border-radius: 9999px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>`,
        className: 'pickup-marker-icon',
        iconAnchor: [14, 14],
      });
      pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup:</b> ${pickup.label || 'Pickup Location'}`);
    }
  }, [pickup]);

  // Update Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    if (destination) {
      const destIcon = L.divIcon({
        html: `<div style="background-color: #DC2626; color: white; border-radius: 9999px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎯</div>`,
        className: 'dest-marker-icon',
        iconAnchor: [14, 14],
      });
      destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b> ${destination.label || 'Destination'}`);
    }
  }, [destination]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '0.75rem', zIndex: 10 }}
      className="shadow-inner border border-gray-200"
    />
  );
};
