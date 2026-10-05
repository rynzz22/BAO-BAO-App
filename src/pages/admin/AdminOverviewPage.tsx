import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import {
  ShieldCheck,
  Users,
  Car,
  Clock,
  Radio,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => api.get<any>('/admin/dashboard'),
    refetchInterval: 5000,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: () => api.get<any[]>('/admin/audit-logs'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            LGU Transport Admin Console
          </h2>
          <p className="text-xs text-slate-500">
            Overview of transportation operations, driver fleets, and fulfillments in Talibon
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/drivers"
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
          >
            Manage Drivers
          </Link>
          <Link
            to="/admin/rides"
            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100"
          >
            All Rides
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Drivers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.activeDrivers ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">of {stats?.totalDrivers ?? 0} registered</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Vehicles</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.activeVehicles ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">approved & active</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase">Rides Today</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.ridesToday ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">{stats?.activeRides ?? 0} in progress</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Search</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.pendingRequests ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">in dispatch pipeline</span>
        </div>
      </div>

      {/* Acceptance Rate by Channel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Driver Acceptance Rate by Channel
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
            <span className="text-xs font-bold text-slate-600 uppercase">App Channel</span>
            <div className="text-xl font-black text-emerald-700">
              {stats?.acceptanceRateByChannel?.APP ?? 100}%
            </div>
            <p className="text-[11px] text-slate-400">Smartphone drivers with instant modals</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
            <span className="text-xs font-bold text-slate-600 uppercase">SMS Channel</span>
            <div className="text-xl font-black text-amber-700">
              {stats?.acceptanceRateByChannel?.SMS ?? 100}%
            </div>
            <p className="text-[11px] text-slate-400">Basic phone drivers replying "1" / "2"</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
            <span className="text-xs font-bold text-slate-600 uppercase">Dispatcher Channel</span>
            <div className="text-xl font-black text-purple-700">
              {stats?.acceptanceRateByChannel?.DISPATCHER ?? 100}%
            </div>
            <p className="text-[11px] text-slate-400">Terminal queue assigned by console staff</p>
          </div>
        </div>
      </div>

      {/* Recent Audit Trail */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Administrative Audit Trail</h3>
        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No administrative actions logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold font-mono text-slate-800">{log.action}</span>
                  <span className="ml-2 text-slate-500">
                    on {log.entity} ({log.entityId})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
