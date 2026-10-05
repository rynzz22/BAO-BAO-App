import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { StatusPill } from '../../components/StatusPill';
import { RideStatus } from '@bao-bao/shared';
import {
  Car,
  MapPin,
  Navigation,
  ArrowRight,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export const DriverRidePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: ride, isLoading } = useQuery({
    queryKey: ['driverRide', id],
    queryFn: () => api.get<any>(`/rides/${id}`),
    refetchInterval: 3000,
  });

  const enRouteMutation = useMutation({
    mutationFn: () => api.post(`/driver/rides/${id}/en-route`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driverRide', id] }),
  });

  const arrivedMutation = useMutation({
    mutationFn: () => api.post(`/driver/rides/${id}/arrived`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driverRide', id] }),
  });

  const startMutation = useMutation({
    mutationFn: () => api.post(`/driver/rides/${id}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driverRide', id] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/driver/rides/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverRide', id] });
      queryClient.invalidateQueries({ queryKey: ['driverMe'] });
    },
  });

  if (isLoading || !ride) {
    return <div className="text-center py-20 text-xs text-slate-500">Loading trip details...</div>;
  }

  const isCompleted = ride.status === RideStatus.COMPLETED;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/driver/home"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Driver Dashboard</span>
        </Link>
        <StatusPill status={ride.status} />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-800">
              RIDE #{ride.publicCode}
            </span>
            <h2 className="text-xl font-black text-slate-900">
              {ride.passengerCount} Passenger{ride.passengerCount > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl">
            🛵
          </div>
        </div>

        {/* Location Targets */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                Pickup Location
              </span>
              <p className="font-bold text-sm text-slate-900">{ride.pickupLabel}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Navigation className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Destination
              </span>
              <p className="font-bold text-sm text-slate-900">{ride.destinationLabel}</p>
            </div>
          </div>
        </div>

        {/* Sequential Step Control Buttons */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
            Trip Progression
          </span>

          {ride.status === RideStatus.ACCEPTED && (
            <button
              onClick={() => enRouteMutation.mutate()}
              disabled={enRouteMutation.isPending}
              className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>1. Head to Pickup Location</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {ride.status === RideStatus.DRIVER_EN_ROUTE && (
            <button
              onClick={() => arrivedMutation.mutate()}
              disabled={arrivedMutation.isPending}
              className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>2. Mark Arrived at Pickup</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {ride.status === RideStatus.ARRIVED && (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="w-full py-4 px-6 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>3. Passenger Boarded (Start Trip)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {ride.status === RideStatus.IN_PROGRESS && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>4. Complete Trip (Passenger Dropped Off)</span>
            </button>
          )}

          {isCompleted && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm text-emerald-950">Trip Successfully Completed!</p>
              <p className="text-xs text-emerald-800">You are now available for new rides.</p>
              <button
                onClick={() => navigate('/driver/home')}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
