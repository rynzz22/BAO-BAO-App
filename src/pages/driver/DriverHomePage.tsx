import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { TrackingBadge } from '../../components/TrackingBadge';
import { DriverAvailability, RideStatus } from '@bao-bao/shared';
import {
  Car,
  Power,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  Radio,
  ArrowRight,
} from 'lucide-react';

export const DriverHomePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gpsSimulating, setGpsSimulating] = useState(true);
  const [simLat, setSimLat] = useState(10.151);
  const [simLng, setSimLng] = useState(124.3312);

  // 1. Fetch driver profile & vehicle
  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driverMe'],
    queryFn: () => api.get<any>('/driver/me'),
  });

  // 2. Fetch pending offers for this driver
  const { data: offers = [] } = useQuery({
    queryKey: ['driverOffers'],
    queryFn: () => api.get<any[]>('/driver/offers'),
    refetchInterval: 3000,
    enabled: driver?.availability === DriverAvailability.AVAILABLE,
  });

  // 3. Fetch active rides assigned to this driver
  const { data: driverRides = [] } = useQuery({
    queryKey: ['driverRides'],
    queryFn: () => api.get<any[]>('/driver/rides'),
    refetchInterval: 4000,
  });

  const activeAssignedRide = driverRides.find(
    (r) =>
      r.status === RideStatus.ACCEPTED ||
      r.status === RideStatus.DRIVER_EN_ROUTE ||
      r.status === RideStatus.ARRIVED ||
      r.status === RideStatus.IN_PROGRESS,
  );

  // Mutation: Toggle Availability Status
  const statusMutation = useMutation({
    mutationFn: (newStatus: DriverAvailability) =>
      api.post('/driver/status', { availability: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverMe'] });
    },
  });

  // Mutation: Send Location Ping
  const locationMutation = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      api.post('/driver/location', coords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverMe'] });
    },
  });

  // Mutation: Accept Offer
  const acceptOfferMutation = useMutation({
    mutationFn: (offerId: string) => api.post(`/driver/offers/${offerId}/accept`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['driverOffers'] });
      queryClient.invalidateQueries({ queryKey: ['driverRides'] });
      navigate(`/driver/ride/${data.rideId}`);
    },
  });

  // Mutation: Decline Offer
  const declineOfferMutation = useMutation({
    mutationFn: (offerId: string) => api.post(`/driver/offers/${offerId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverOffers'] });
    },
  });

  // Background Geolocation Simulation ping every 10 seconds
  useEffect(() => {
    if (!gpsSimulating || !driver || driver.availability !== DriverAvailability.AVAILABLE) return;

    const interval = setInterval(() => {
      // Slightly fluctuate GPS coordinates to emulate moving tricycle in Talibon
      const deltaLat = (Math.random() - 0.5) * 0.0004;
      const deltaLng = (Math.random() - 0.5) * 0.0004;
      const nextLat = simLat + deltaLat;
      const nextLng = simLng + deltaLng;
      setSimLat(nextLat);
      setSimLng(nextLng);

      locationMutation.mutate({ lat: nextLat, lng: nextLng });
    }, 10000);

    return () => clearInterval(interval);
  }, [gpsSimulating, driver?.availability, simLat, simLng]);

  if (isLoading) {
    return <div className="text-center py-20 text-xs text-slate-500">Loading driver portal...</div>;
  }

  if (error || !driver) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <Car className="w-12 h-12 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 mb-1">No Driver Account</h3>
        <p className="text-xs text-slate-500 mb-4">
          You are currently logged in as a passenger. Switch to Mario Batumbakal using the top-right persona selector to test driver mode.
        </p>
      </div>
    );
  }

  const isOnline = driver.availability === DriverAvailability.AVAILABLE;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Driver Header Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl">
            🛵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{driver.fullName}</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                #{driver.driverCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vehicle: <strong>{driver.vehicle?.plateOrBodyNo || 'TRIC-017'}</strong> ({driver.vehicle?.vehicleTypeCode || 'TRICYCLE'})
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Channel: {driver.primaryChannel}
              </span>
              <TrackingBadge source={driver.currentLocation?.trackingSource || 'LIVE_APP'} updatedAt={driver.currentLocation?.updatedAt} />
            </div>
          </div>
        </div>

        {/* Online / Offline Toggle */}
        <div className="text-right flex flex-col sm:items-end">
          <button
            onClick={() =>
              statusMutation.mutate(
                isOnline ? DriverAvailability.OFFLINE : DriverAvailability.AVAILABLE,
              )
            }
            disabled={statusMutation.isPending || !!activeAssignedRide}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all shadow-xs ${
              isOnline
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'ONLINE & READY' : 'OFFLINE'}</span>
          </button>
          <span className="text-[11px] text-slate-400 mt-1">
            {isOnline ? 'Receiving passenger offers' : 'Tap to go online'}
          </span>
        </div>
      </div>

      {/* Active Assigned Ride Banner */}
      {activeAssignedRide && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600 animate-pulse" />
              <h3 className="font-black text-sm text-purple-950 uppercase tracking-wide">
                Active Assigned Trip (#{activeAssignedRide.publicCode})
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-200 text-purple-900">
              {activeAssignedRide.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="text-xs text-purple-900 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-purple-600 font-bold block text-[10px] uppercase">Pickup:</span>
              <span className="font-semibold">{activeAssignedRide.pickupLabel}</span>
            </div>
            <div>
              <span className="text-purple-600 font-bold block text-[10px] uppercase">Destination:</span>
              <span className="font-semibold">{activeAssignedRide.destinationLabel}</span>
            </div>
          </div>

          <Link
            to={`/driver/ride/${activeAssignedRide.id}`}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Open Trip Action Controls</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Pending Offers Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-slate-900 text-sm">Incoming Ride Offers</h3>
          </div>
          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
            {offers.length} pending
          </span>
        </div>

        {offers.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-1">
            <Clock className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No pending offers right now</p>
            <p className="text-[11px]">
              {isOnline
                ? 'Keep app open. When a passenger requests a ride, the offer modal appears here.'
                : 'Turn toggle ONLINE to start receiving offers.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/50 shadow-sm space-y-4 animate-in fade-in"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      RIDE #{offer.ride?.publicCode}
                    </span>
                    <h4 className="font-black text-base text-slate-900">
                      {offer.ride?.passengerCount} Passenger{offer.ride?.passengerCount > 1 ? 's' : ''}
                    </h4>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    TTL: 20s
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Pickup</span>
                    <span className="font-semibold text-slate-800">{offer.ride?.pickupLabel}</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Destination</span>
                    <span className="font-semibold text-slate-800">{offer.ride?.destinationLabel}</span>
                  </div>
                </div>

                {/* Big Action Buttons (Optimized for Mobile Drivers) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => acceptOfferMutation.mutate(offer.id)}
                    disabled={acceptOfferMutation.isPending}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ACCEPT</span>
                  </button>
                  <button
                    onClick={() => declineOfferMutation.mutate(offer.id)}
                    disabled={declineOfferMutation.isPending}
                    className="py-3 px-4 rounded-xl bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 font-black text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>DECLINE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GPS Simulation Controls Card */}
      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div>
          <div className="font-bold text-slate-800">Live GPS Stream Simulator (10s Ping)</div>
          <span className="text-[11px] text-slate-500">
            Coordinates: ({simLat.toFixed(4)}, {simLng.toFixed(4)}) · Source: 🟢 LIVE_APP
          </span>
        </div>
        <button
          onClick={() => setGpsSimulating(!gpsSimulating)}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
            gpsSimulating ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
          }`}
        >
          {gpsSimulating ? 'Simulating' : 'Paused'}
        </button>
      </div>
    </div>
  );
};
