import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { StatusPill } from '../../components/StatusPill';
import { TrackingBadge } from '../../components/TrackingBadge';
import { MapView } from '../../components/MapView';
import { RideStatus } from '@bao-bao/shared';
import {
  MapPin,
  Navigation,
  Clock,
  User,
  Car,
  Star,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  RotateCcw,
} from 'lucide-react';

export const RideDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratedSuccess, setRatedSuccess] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed plans');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Poll ride details every 5 seconds
  const { data: ride, isLoading, error } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => api.get<any>(`/rides/${id}`),
    refetchInterval: 5000,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/rides/${id}/cancel`, { reason: cancelReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride', id] });
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      setShowCancelModal(false);
    },
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: () => api.post(`/rides/${id}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride', id] });
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
    },
  });

  // Rate mutation
  const rateMutation = useMutation({
    mutationFn: () => api.post(`/rides/${id}/rating`, { score: ratingScore, comment: ratingComment }),
    onSuccess: () => {
      setRatedSuccess(true);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-500 text-sm">
        <Clock className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
        Loading ride status...
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl shadow-sm border border-red-200 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 mb-1">Ride Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">Could not load ride details.</p>
        <Link to="/app/home" className="text-xs font-bold text-emerald-600 hover:underline">
          Return to Booking
        </Link>
      </div>
    );
  }

  const isPreTrip = [
    RideStatus.REQUESTED,
    RideStatus.DISPATCHING,
    RideStatus.OFFERED,
    RideStatus.ACCEPTED,
    RideStatus.DRIVER_EN_ROUTE,
  ].includes(ride.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/home"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Ride #{ride.publicCode}</span>
          <StatusPill status={ride.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Map Tracking */}
        <div className="md:col-span-7 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <MapView
            center={ride.pickupPoint}
            pickup={ride.pickupPoint}
            destination={ride.destinationPoint}
            vehicles={
              ride.driver && ride.driverLocation
                ? [
                    {
                      driverId: ride.driver.id,
                      driverCode: ride.driver.driverCode,
                      driverName: ride.driver.fullName,
                      channel: ride.driver.primaryChannel,
                      vehicleType: ride.vehicle?.vehicleType || 'TRICYCLE',
                      plateOrBodyNo: ride.vehicle?.plateOrBodyNo || 'N/A',
                      capacity: ride.vehicle?.capacity || 3,
                      lat: ride.driverLocation.lat,
                      lng: ride.driverLocation.lng,
                      trackingSource: ride.driverLocation.trackingSource,
                      locationUpdatedAt: ride.driverLocation.updatedAt,
                      distanceMeters: 0,
                    },
                  ]
                : []
            }
            height="340px"
          />

          {/* Locations Card */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">Pickup:</span>
                <p className="font-semibold text-slate-900">{ride.pickupLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">Destination:</span>
                <p className="font-semibold text-slate-900">{ride.destinationLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Driver Information & Actions */}
        <div className="md:col-span-5 space-y-4">
          {/* Driver Assigned Card */}
          {ride.driver ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                    🛵
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>{ride.driver.fullName}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                        #{ride.driver.driverCode}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Channel: <span className="font-semibold uppercase">{ride.channelUsed || ride.driver.primaryChannel}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Freshness Label */}
              {ride.driverLocation && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tracking Status:</span>
                  <TrackingBadge
                    source={ride.driverLocation.trackingSource}
                    updatedAt={ride.driverLocation.updatedAt}
                  />
                </div>
              )}

              {/* Vehicle info */}
              {ride.vehicle && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Vehicle Body/Plate:</span>
                    <span className="font-bold font-mono text-slate-800">{ride.vehicle.plateOrBodyNo}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Vehicle Type:</span>
                    <span className="font-semibold text-slate-800">{ride.vehicle.vehicleType}</span>
                  </div>
                </div>
              )}

              {/* Notice: Privacy Honesty */}
              <p className="text-[11px] text-slate-400 italic">
                *Driver direct phone number is kept private to protect driver safety per platform privacy guidelines.
              </p>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {ride.status === 'NO_DRIVER_FOUND' ? 'No Driver Found' : 'Dispatching to Drivers'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {ride.status === 'NO_DRIVER_FOUND'
                    ? 'All candidate drivers were busy or timed out. You may retry your request.'
                    : 'System is searching eligible drivers via App, SMS broadcast, and Terminal queue.'}
                </p>
              </div>

              {ride.status === 'NO_DRIVER_FOUND' && (
                <button
                  onClick={() => retryMutation.mutate()}
                  disabled={retryMutation.isPending}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Request Now</span>
                </button>
              )}
            </div>
          )}

          {/* Cancellation Control (Only if pre-trip) */}
          {isPreTrip && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              {!showCancelModal ? (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Ride Request</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800">Reason for cancellation:</span>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                    >
                      Confirm Cancel
                    </button>
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completed Rating Card */}
          {ride.status === RideStatus.COMPLETED && (
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Rate Your Trip
              </h4>
              {ratedSuccess ? (
                <p className="text-xs text-emerald-700 font-semibold">
                  Thank you! Your rating has been submitted.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingScore(s)}
                        className={`p-2 rounded-lg text-sm font-bold ${
                          ratingScore >= s ? 'text-amber-500' : 'text-slate-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Optional feedback..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                  <button
                    onClick={() => rateMutation.mutate()}
                    disabled={rateMutation.isPending}
                    className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                  >
                    Submit Rating
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
