import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { StatusPill } from '../../components/StatusPill';
import { Activity, MapPin, Navigation, ArrowRight } from 'lucide-react';

export const AdminRidesPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('ALL');

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ['adminAllRides'],
    queryFn: () => api.get<any[]>('/admin/rides'),
    refetchInterval: 4000,
  });

  const filteredRides = filter === 'ALL'
    ? rides
    : rides.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Live & Historical Ride Requests
          </h2>
          <p className="text-xs text-slate-500">
            Real-time audit view of all rides across Talibon
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="DISPATCHING">DISPATCHING</option>
            <option value="OFFERED">OFFERED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-slate-500">Loading rides...</div>
        ) : filteredRides.length === 0 ? (
          <p className="text-center py-12 text-xs text-slate-400">No rides match filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code / Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRides.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        #{r.publicCode}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        {new Date(r.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{r.pickupLabel}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Navigation className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{r.destinationLabel}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {r.channelUsed || 'SYSTEM'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/app/ride/${r.id}`}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
