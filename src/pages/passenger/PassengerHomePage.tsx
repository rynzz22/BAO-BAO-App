import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
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
  const { data: nearbyVehicles = [], refetch: refetchVehicles } = useQuery<NearbyVehicleDto[]>({
    queryKey: ['nearbyVehicles', pickupLat, pickupLng],
    queryFn: () => api.get<NearbyVehicleDto[]>(`/vehicles/nearby?lat=${pickupLat}&lng=${pickupLng}&radius=3500`),
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
    <div className="space-y-6">
      {/* Active Ride Banner */}
      {activeRide && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <div className="font-bold text-sm text-emerald-950">
                You have an active ride request (#{activeRide.publicCode})
              </div>
              <div className="text-xs text-emerald-800">
                Status: <span className="font-semibold uppercase">{activeRide.status}</span> · {activeRide.destinationLabel}
              </div>
            </div>
          </div>
          <Link
            to={`/app/ride/${activeRide.id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Track Ride →
          </Link>
        </div>
      )}

      {/* Main Grid: Map & Ride Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Map & Available Drivers */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  Live Talibon Coverage Map
                </h3>
                <p className="text-xs text-slate-500">
                  Showing active vehicles with honest tracking sources
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full">
                {nearbyVehicles.length} vehicles nearby
              </span>
            </div>

            <MapView
              center={{ lat: pickupLat, lng: pickupLng }}
              pickup={{ lat: pickupLat, lng: pickupLng, label: pickupLabel }}
              destination={{ lat: destLat, lng: destLng, label: destLabel }}
              vehicles={nearbyVehicles}
              height="380px"
              onMapClick={(lat, lng) => {
                setPickupLat(lat);
                setPickupLng(lng);
                setPickupLabel(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
              }}
            />

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700">Tracking badges:</span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 🟢 Live GPS (&lt;2 min)
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 🟡 Last Reported (SMS/stale)
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> ⚪ Terminal Queue
              </span>
            </div>
          </div>

          {/* Nearby Drivers Table */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
              Available Vehicles in Range
            </h4>
            {nearbyVehicles.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No active drivers currently within 3.5km. Request anyway and dispatch will notify drivers via SMS & Terminal.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {nearbyVehicles.map((v) => (
                  <div key={v.driverId} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{v.driverName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                          #{v.driverCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{v.vehicleType} ({v.plateOrBodyNo})</span>
                        <span>·</span>
                        <span>{v.distanceMeters}m away</span>
                      </div>
                    </div>
                    <TrackingBadge source={v.trackingSource} updatedAt={v.locationUpdatedAt} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Request Ride Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                🛺
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Request a Ride</h3>
                <p className="text-xs text-slate-500">Book local tricycles & bao bao in Talibon</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pickup Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Pickup Location
                </label>
                <div className="relative mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={pickupLabel}
                    onChange={(e) => setPickupLabel(e.target.value)}
                    placeholder="e.g. Poblacion Plaza or School Gate"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                {/* Zone Quick-Picks */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase self-center mr-1">
                    Quick Zone:
                  </span>
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => selectPickupZone(z)}
                      className="px-2 py-1 rounded-lg text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-medium transition-colors"
                    >
                      {z.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  2. Destination
                </label>
                <div className="relative mb-2">
                  <Navigation className="w-4 h-4 text-red-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={destLabel}
                    onChange={(e) => setDestLabel(e.target.value)}
                    placeholder="e.g. Talibon Public Market"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase self-center mr-1">
                    Quick Zone:
                  </span>
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => selectDestZone(z)}
                      className="px-2 py-1 rounded-lg text-xs bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium transition-colors"
                    >
                      {z.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passengers Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  3. Number of Passengers
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPassengerCount(num)}
                      className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-colors ${
                        passengerCount === num
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {num} {num === 1 ? 'pax' : 'pax'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createRideMutation.isPending || !!activeRide}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors shadow-sm disabled:opacity-50"
              >
                {createRideMutation.isPending ? (
                  <span>Dispatching to Drivers...</span>
                ) : (
                  <>
                    <span>Confirm & Request Ride</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Inclusive Channel Assurance Note */}
          <div className="p-4 bg-slate-100/80 rounded-2xl text-xs text-slate-600 space-y-1.5 border border-slate-200">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Inclusive Channel Dispatch
            </div>
            <p>
              Your request will be routed automatically to available drivers via <strong>Driver App</strong>, <strong>SMS Broadcast</strong>, or <strong>Terminal Dispatchers</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
