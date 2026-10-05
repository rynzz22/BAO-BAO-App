import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { StatusPill } from '../../components/StatusPill';
import { TrackingBadge } from '../../components/TrackingBadge';
import { DriverChannel, RideStatus } from '@bao-bao/shared';
import {
  Radio,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  ArrowRight,
  ListOrdered,
  PlusCircle,
} from 'lucide-react';

export const DispatchBoardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [assigningDriverId, setAssigningDriverId] = useState<string>('');

  // 1. Fetch rides
  const { data: rides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ['dispatchRides'],
    queryFn: () => api.get<any[]>('/dispatch/rides'),
    refetchInterval: 4000,
  });

  // 2. Fetch available drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['dispatchDrivers'],
    queryFn: () => api.get<any[]>('/dispatch/drivers'),
    refetchInterval: 4000,
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: ({ rideId, driverId }: { rideId: string; driverId: string }) =>
      api.post(`/dispatch/rides/${rideId}/assign`, { driverId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatchRides'] });
      queryClient.invalidateQueries({ queryKey: ['dispatchDrivers'] });
      setSelectedRideId(null);
    },
  });

  // Status on behalf mutation
  const statusOnBehalfMutation = useMutation({
    mutationFn: ({ rideId, status }: { rideId: string; status: RideStatus }) =>
      api.post(`/dispatch/rides/${rideId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatchRides'] });
      queryClient.invalidateQueries({ queryKey: ['dispatchDrivers'] });
    },
  });

  const pendingRides = rides.filter(
    (r) =>
      r.status === RideStatus.REQUESTED ||
      r.status === RideStatus.DISPATCHING ||
      r.status === RideStatus.OFFERED,
  );

  const activeRides = rides.filter(
    (r) =>
      r.status === RideStatus.ACCEPTED ||
      r.status === RideStatus.DRIVER_EN_ROUTE ||
      r.status === RideStatus.ARRIVED ||
      r.status === RideStatus.IN_PROGRESS,
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            Terminal Dispatcher Console
          </h2>
          <p className="text-xs text-slate-500">
            Monitor and assign rides for Talibon Seaport & Poblacion Terminals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dispatch/queue"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 shadow-xs"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Manage Terminal Queue</span>
          </Link>
        </div>
      </div>

      {/* Grid: Pending Requests & Available Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending & Active Rides */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pending Rides requiring dispatch or manual assignment */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Pending Ride Requests ({pendingRides.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Awaiting driver match or manual dispatcher assignment
                </p>
              </div>
            </div>

            {pendingRides.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No pending requests. All rides are fulfilled or in progress.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{ride.publicCode}
                        </span>
                        <StatusPill status={ride.status} />
                        <span className="text-xs text-slate-500">
                          {ride.passengerCount} pax
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span>{ride.pickupLabel}</span>
                        <span>→</span>
                        <span>{ride.destinationLabel}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedRideId(ride.id);
                          setAssigningDriverId(drivers[0]?.id || '');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Assign Driver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Rides in Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Active Trips in Progress ({activeRides.length})
            </h3>
            {activeRides.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No active trips in transit right now.
              </p>
            ) : (
              <div className="space-y-3">
                {activeRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{ride.publicCode}
                        </span>
                        <StatusPill status={ride.status} />
                        {ride.driverName && (
                          <span className="text-xs font-bold text-slate-700">
                            Driver: {ride.driverName} (#{ride.driverCode})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        {ride.pickupLabel} → {ride.destinationLabel}
                      </div>
                    </div>

                    {/* Dispatcher Actions on Driver's Behalf */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ride.status === RideStatus.ACCEPTED && (
                        <button
                          onClick={() =>
                            statusOnBehalfMutation.mutate({
                              rideId: ride.id,
                              status: RideStatus.DRIVER_EN_ROUTE,
                            })
                          }
                          className="px-2.5 py-1 text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded-md"
                        >
                          En Route
                        </button>
                      )}
                      {(ride.status === RideStatus.ACCEPTED ||
                        ride.status === RideStatus.DRIVER_EN_ROUTE) && (
                        <button
                          onClick={() =>
                            statusOnBehalfMutation.mutate({
                              rideId: ride.id,
                              status: RideStatus.ARRIVED,
                            })
                          }
                          className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-md"
                        >
                          Arrived
                        </button>
                      )}
                      {ride.status === RideStatus.ARRIVED && (
                        <button
                          onClick={() =>
                            statusOnBehalfMutation.mutate({
                              rideId: ride.id,
                              status: RideStatus.IN_PROGRESS,
                            })
                          }
                          className="px-2.5 py-1 text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md"
                        >
                          Boarded
                        </button>
                      )}
                      {ride.status === RideStatus.IN_PROGRESS && (
                        <button
                          onClick={() =>
                            statusOnBehalfMutation.mutate({
                              rideId: ride.id,
                              status: RideStatus.COMPLETED,
                            })
                          }
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Available Drivers Roster */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Registered Drivers</h3>
                <p className="text-xs text-slate-500">Across 3 inclusive channels</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                {drivers.length} total
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {drivers.map((d) => (
                <div key={d.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      {d.fullName} (#{d.driverCode})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        d.availability === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.availability === 'BUSY'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {d.availability}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Channel: <strong>{d.primaryChannel}</strong></span>
                    <TrackingBadge source={d.trackingSource} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Driver Assignment Modal */}
      {selectedRideId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Assign Driver to Ride
            </h3>
            <p className="text-xs text-slate-500">
              Select an available driver from App, SMS, or Terminal Queue:
            </p>

            <select
              value={assigningDriverId}
              onChange={(e) => setAssigningDriverId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} (#{d.driverCode}) — [{d.primaryChannel}] — {d.availability}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRideId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!assigningDriverId || assignMutation.isPending}
                onClick={() =>
                  assignMutation.mutate({
                    rideId: selectedRideId,
                    driverId: assigningDriverId,
                  })
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
