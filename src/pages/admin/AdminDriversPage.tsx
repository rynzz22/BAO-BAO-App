import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { TrackingBadge } from '../../components/TrackingBadge';
import { ApprovalStatus, DriverChannel } from '@bao-bao/shared';
import { Users, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';

export const AdminDriversPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['adminDrivers'],
    queryFn: () => api.get<any[]>('/admin/drivers'),
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApprovalStatus }) =>
      api.patch(`/admin/drivers/${id}/approval`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });

  const channelMutation = useMutation({
    mutationFn: ({ id, channel }: { id: string; channel: DriverChannel }) =>
      api.patch(`/admin/drivers/${id}/channel`, { channel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDrivers'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Driver Fleet Management
        </h2>
        <p className="text-xs text-slate-500">
          Review, approve, or adjust primary dispatch channels for Talibon drivers
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-slate-500">Loading drivers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{d.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Code: #{d.driverCode} · Lic: {d.licenseNo}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={d.primaryChannel}
                        onChange={(e) =>
                          channelMutation.mutate({
                            id: d.id,
                            channel: e.target.value as DriverChannel,
                          })
                        }
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value={DriverChannel.APP}>APP</option>
                        <option value={DriverChannel.SMS}>SMS</option>
                        <option value={DriverChannel.DISPATCHER}>DISPATCHER</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {d.vehicle?.plateOrBodyNo || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {d.vehicle?.vehicleTypeCode || 'TRICYCLE'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          d.approvalStatus === ApprovalStatus.APPROVED
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.approvalStatus === ApprovalStatus.SUSPENDED
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {d.approvalStatus !== ApprovalStatus.APPROVED && (
                        <button
                          onClick={() =>
                            approvalMutation.mutate({
                              id: d.id,
                              status: ApprovalStatus.APPROVED,
                            })
                          }
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      )}
                      {d.approvalStatus === ApprovalStatus.APPROVED && (
                        <button
                          onClick={() =>
                            approvalMutation.mutate({
                              id: d.id,
                              status: ApprovalStatus.SUSPENDED,
                            })
                          }
                          className="px-2.5 py-1 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50"
                        >
                          Suspend
                        </button>
                      )}
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
