import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { StatusPill } from '../../components/StatusPill';
import { Clock, MapPin, Navigation, ArrowRight } from 'lucide-react';

export const PassengerHistoryPage: React.FC = () => {
  const { data: rides = [], isLoading } = useQuery({
    queryKey: ['rideHistory'],
    queryFn: () => api.get<any[]>('/rides'),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Ride History</h2>
          <p className="text-xs text-slate-500">Your past trips and requests in Talibon</p>
        </div>
        <Link
          to="/app/home"
          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
        >
          Book New Ride
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading ride history...</div>
      ) : rides.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No rides yet</p>
          <Link
            to="/app/home"
            className="inline-block text-xs font-bold text-emerald-600 hover:underline"
          >
            Start your first ride in Talibon
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {rides.map((ride) => (
            <div key={ride.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">#{ride.publicCode}</span>
                  <StatusPill status={ride.status} />
                  <span className="text-[11px] text-slate-400">
                    {new Date(ride.requestedAt).toLocaleDateString()} at{' '}
                    {new Date(ride.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{ride.pickupLabel}</span>
                  </div>
                  <span className="hidden sm:inline text-slate-300">→</span>
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-red-600" />
                    <span>{ride.destinationLabel}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {ride.driver && (
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-800">{ride.driver.fullName}</span>
                    <span className="block text-[11px] text-slate-500">#{ride.driver.driverCode}</span>
                  </div>
                )}
                <Link
                  to={`/app/ride/${ride.id}`}
                  className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
