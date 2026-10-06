import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../lib/auth-store';
import { api } from '../../lib/api-client';
import { MapView } from '../../components/MapView';
import { TrackingBadge } from '../../components/TrackingBadge';
import { NearbyVehicleDto, ZoneDto } from '@bao-bao/shared';
import {
  MapPin,
  Navigation,
  Users,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const PassengerHomePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [pickupLabel, setPickupLabel] = useState('Poblacion Plaza');
  const [pickupLat, setPickupLat] = useState(10.1503);
  const [pickupLng, setPickupLng] = useState(124.3305);
  const [destLabel, setDestLabel] = useState('Talibon Public Market');
  const [destLat, setDestLat] = useState(10.1531);
  const [destLng, setDestLng] = useState(124.335);
  const [passengerCount, setPassengerCount] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch nearby available vehicles
  const {
    data: nearbyVehicles = [],
    isLoading: vehiclesLoading,
    isError: vehiclesError,
  } = useQuery<NearbyVehicleDto[]>({
    queryKey: ['nearbyVehicles', pickupLat, pickupLng],
    queryFn: () =>
      api.get<NearbyVehicleDto[]>(`/vehicles/nearby?lat=${pickupLat}&lng=${pickupLng}&radius=3500`),
    refetchInterval: 5000,
  });

  // 2. Fetch zones for quick selection
  const { data: zones = [] } = useQuery<ZoneDto[]>({
    queryKey: ['zones'],
    queryFn: () => api.get<ZoneDto[]>('/zones'),
  });

  // 3. Check for active ride
  const { data: activeRide } = useQuery({
    queryKey: ['activeRide'],
    queryFn: () => api.get<any>('/rides/active'),
    refetchInterval: 5000,
  });

  // Create Ride mutation
  const createRideMutation = useMutation({
    mutationFn: (body: any) => api.post<any>('/rides', body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      navigate(`/app/ride/${data.id}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to request ride');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    createRideMutation.mutate({
      pickup: {
        lat: pickupLat,
        lng: pickupLng,
        label: pickupLabel,
      },
      destination: {
        lat: destLat,
        lng: destLng,
        label: destLabel,
      },
      passengerCount,
    });
  };

  const selectPickupZone = (zone: ZoneDto) => {
    setPickupLabel(zone.name);
    if (zone.center) {
      setPickupLat(zone.center.lat);
      setPickupLng(zone.center.lng);
    }
  };

  const selectDestZone = (zone: ZoneDto) => {
    setDestLabel(zone.name);
    if (zone.center) {
      setDestLat(zone.center.lat);
      setDestLng(zone.center.lng);
    }
  };

  return (
    <div className="passenger-page space-y-8">
      <section className="welcome-heading">
        <p className="eyebrow">YOUR TOWN. YOUR RIDE.</p>
        <h1>Asa ta, {user?.fullName?.split(' ')[0] || 'amigo'}?</h1>
        <p>A little closer to wherever you need to be.</p>
      </section>

      {activeRide && (
        <div className="ride-notice" role="status">
          <div>
            <strong>You have an active ride</strong>
            <p>
              #{activeRide.publicCode} · {activeRide.status.replaceAll('_', ' ')}
            </p>
          </div>
          <Link to={`/app/ride/${activeRide.id}`} className="text-link">
            Track ride <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <section className="booking-surface frost-surface" aria-labelledby="booking-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LET’S GET YOU THERE</p>
            <h2 id="booking-title">Where are you headed?</h2>
          </div>
          <span className="location-tag">
            <MapPin size={14} /> Talibon, Bohol
          </span>
        </div>
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 flex gap-2"
          >
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="route-fields">
            <div className="route-field">
              <MapPin className="route-icon text-teal-700" size={20} />
              <div>
                <label htmlFor="pickup">Pick me up at</label>
                <input
                  id="pickup"
                  required
                  value={pickupLabel}
                  onChange={(e) => setPickupLabel(e.target.value)}
                  placeholder="Your pickup location"
                />
              </div>
            </div>
            <div className="route-field">
              <Navigation className="route-icon text-amber-700" size={20} />
              <div>
                <label htmlFor="destination">Take me to</label>
                <input
                  id="destination"
                  required
                  value={destLabel}
                  onChange={(e) => setDestLabel(e.target.value)}
                  placeholder="Your destination"
                />
              </div>
            </div>
          </div>
          {zones.length > 0 && (
            <details className="quiet-details">
              <summary>Choose a popular place</summary>
              <div className="zone-selectors">
                <label>
                  Pickup
                  <select
                    value=""
                    onChange={(e) => {
                      const zone = zones.find((z) => z.id === e.target.value);
                      if (zone) selectPickupZone(zone);
                    }}
                  >
                    <option value="" disabled>
                      Select a pickup
                    </option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Destination
                  <select
                    value=""
                    onChange={(e) => {
                      const zone = zones.find((z) => z.id === e.target.value);
                      if (zone) selectDestZone(zone);
                    }}
                  >
                    <option value="" disabled>
                      Select a destination
                    </option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </details>
          )}
          <div className="booking-actions">
            <label className="passenger-select" htmlFor="passengers">
              <Users size={18} />
              <select
                id="passengers"
                aria-label="Number of passengers"
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'passenger' : 'passengers'}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={createRideMutation.isPending || !!activeRide}
              className="primary-action"
            >
              {createRideMutation.isPending
                ? 'Finding your ride…'
                : activeRide
                  ? 'You have an active ride'
                  : 'Request a ride'}
              <ArrowRight size={18} />
            </button>
          </div>
          <p className="booking-note">
            <ShieldCheck size={15} /> Connecting you with local drivers, by app, SMS, or terminal.
          </p>
        </form>
      </section>

      <section className="coverage-section" aria-labelledby="coverage-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AROUND YOUR NEIGHBORHOOD</p>
            <h2 id="coverage-title">A look around Talibon</h2>
          </div>
          <span className="availability-label">
            {vehiclesLoading
              ? 'Checking nearby rides…'
              : vehiclesError
                ? 'Availability unavailable'
                : `${nearbyVehicles.length} vehicles nearby`}
          </span>
        </div>
        <div className="map-frame">
          <MapView
            center={{ lat: pickupLat, lng: pickupLng }}
            pickup={{ lat: pickupLat, lng: pickupLng, label: pickupLabel }}
            destination={{ lat: destLat, lng: destLng, label: destLabel }}
            vehicles={nearbyVehicles}
            height="300px"
            onMapClick={(lat, lng) => {
              setPickupLat(lat);
              setPickupLng(lng);
              setPickupLabel(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            }}
          />
        </div>
        <p className="map-caption">
          <MapPin size={14} /> Tap the map to adjust your pickup point.
        </p>
        <details className="quiet-details vehicle-details">
          <summary>Nearby drivers & tracking details</summary>
          <p className="text-sm text-slate-500 py-3">
            GPS: recently updated location. Last reported: SMS or older location. Terminal: queued
            at a terminal.
          </p>
          {vehiclesError ? (
            <p className="text-sm py-3">
              We couldn’t check nearby drivers. Please try again shortly.
            </p>
          ) : nearbyVehicles.length === 0 ? (
            <p className="text-sm py-3">
              {vehiclesLoading
                ? 'Looking for nearby drivers…'
                : 'No nearby drivers right now. You can still send a ride request to dispatch.'}
            </p>
          ) : (
            <div className="divide-y divide-teal-900/10">
              {nearbyVehicles.map((v) => (
                <div key={v.driverId} className="vehicle-row">
                  <div>
                    <strong>{v.driverName}</strong>
                    <p>
                      {v.vehicleType} · {v.plateOrBodyNo} · {v.distanceMeters}m away
                    </p>
                  </div>
                  <TrackingBadge source={v.trackingSource} updatedAt={v.locationUpdatedAt} />
                </div>
              ))}
            </div>
          )}
        </details>
      </section>
      <Link to="/app/history" className="history-link">
        <Clock size={17} /> Your past rides <ArrowRight size={16} />
      </Link>
    </div>
  );
};
