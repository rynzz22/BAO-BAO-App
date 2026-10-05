import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { DriverChannel } from '@bao-bao/shared';
import {
  ListOrdered,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Car,
  UserPlus,
} from 'lucide-react';

export const TerminalQueuePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);

  // New Driver Form state
  const [fullName, setFullName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [channel, setChannel] = useState<DriverChannel>(DriverChannel.DISPATCHER);

  // 1. Fetch terminals
  const { data: terminals = [] } = useQuery({
    queryKey: ['dispatchTerminals'],
    queryFn: () => api.get<any[]>('/dispatch/terminals'),
  });

  const activeTerminal = terminals[0];

  // 2. Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['dispatchDrivers'],
    queryFn: () => api.get<any[]>('/dispatch/drivers'),
    refetchInterval: 5000,
  });

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: (driverId: string) =>
      api.post('/dispatch/queue/check-in', {
        terminalId: activeTerminal?.id,
        driverId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatchDrivers'] });
      setSelectedDriverId('');
    },
  });

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: (driverId: string) =>
      api.post('/dispatch/queue/check-out', {
        terminalId: activeTerminal?.id,
        driverId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatchDrivers'] });
    },
  });

  // Create Offline Driver Mutation
  const createDriverMutation = useMutation({
    mutationFn: (body: any) => api.post('/dispatch/drivers', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatchDrivers'] });
      setShowAddDriverModal(false);
      setFullName('');
      setLicenseNo('');
      setVehiclePlate('');
    },
  });

  // Active queue drivers
  const queuedDrivers = drivers
    .filter((d) => d.terminalQueue && !d.terminalQueue.checkedOutAt)
    .sort((a, b) => (a.terminalQueue?.position || 0) - (b.terminalQueue?.position || 0));

  const unqueuedDrivers = drivers.filter(
    (d) => !d.terminalQueue || d.terminalQueue.checkedOutAt,
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/dispatch/board"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dispatch Board</span>
        </Link>
        <button
          onClick={() => setShowAddDriverModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Traditional Driver</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-600" />
              {activeTerminal?.name || 'Talibon Seaport Terminal Queue'}
            </h2>
            <p className="text-xs text-slate-500">
              FIFO queue for terminal stationed drivers with no smartphone
            </p>
          </div>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            {queuedDrivers.length} in line
          </span>
        </div>

        {/* Check In Driver Form */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="w-full sm:flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Select driver to check in to queue --</option>
            {unqueuedDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} (#{d.driverCode}) — [{d.primaryChannel}]
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedDriverId && checkInMutation.mutate(selectedDriverId)}
            disabled={!selectedDriverId || checkInMutation.isPending}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap"
          >
            Check In Driver
          </button>
        </div>

        {/* Queue Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Current Queue Line (FIFO)
          </h3>
          {queuedDrivers.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              Queue is empty. Check in drivers as they arrive at the terminal.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {queuedDrivers.map((d, index) => (
                <div
                  key={d.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-sm text-slate-900">
                        {d.fullName}
                      </span>
                      <span className="ml-2 font-mono text-xs text-slate-500">
                        #{d.driverCode}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        Channel: <strong>{d.primaryChannel}</strong> · Plate:{' '}
                        <strong>{d.vehicle?.plateOrBodyNo || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => checkOutMutation.mutate(d.id)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Traditional/Offline Driver */}
      {showAddDriverModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Register Traditional / Offline Driver
            </h3>
            <p className="text-xs text-slate-500">
              Create a record on behalf of an older or basic-phone driver in Talibon.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDriverMutation.mutate({
                  fullName,
                  licenseNo,
                  vehiclePlate,
                  primaryChannel: channel,
                  vehicleTypeCode: 'TRICYCLE',
                  homeTerminalId: activeTerminal?.id,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Mang Tomas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  required
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="e.g. LIC-TAL-888"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Vehicle Body / Plate Number
                </label>
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="e.g. TRIC-888"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Primary Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as DriverChannel)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  <option value={DriverChannel.DISPATCHER}>DISPATCHER (Terminal Stationed)</option>
                  <option value={DriverChannel.SMS}>SMS (Basic Phone)</option>
                  <option value={DriverChannel.APP}>APP (Smartphone)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDriverMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
