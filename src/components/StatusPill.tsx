import React from 'react';
import { RideStatus } from '@bao-bao/shared';

interface StatusPillProps {
  status: RideStatus | string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  let color = 'bg-gray-100 text-gray-800 border-gray-300';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case RideStatus.REQUESTED:
      color = 'bg-yellow-50 text-yellow-800 border-yellow-300';
      label = 'SEARCHING FOR DRIVER';
      break;
    case RideStatus.DISPATCHING:
      color = 'bg-blue-50 text-blue-800 border-blue-300 animate-pulse';
      label = 'DISPATCHING';
      break;
    case RideStatus.OFFERED:
      color = 'bg-indigo-50 text-indigo-800 border-indigo-300';
      label = 'OFFER SENT TO DRIVER';
      break;
    case RideStatus.ACCEPTED:
      color = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      label = 'DRIVER ACCEPTED';
      break;
    case RideStatus.DRIVER_EN_ROUTE:
      color = 'bg-teal-50 text-teal-800 border-teal-300';
      label = 'DRIVER ON THE WAY';
      break;
    case RideStatus.ARRIVED:
      color = 'bg-purple-50 text-purple-800 border-purple-300 font-bold';
      label = 'DRIVER ARRIVED AT PICKUP';
      break;
    case RideStatus.IN_PROGRESS:
      color = 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold';
      label = 'TRIP IN PROGRESS';
      break;
    case RideStatus.COMPLETED:
      color = 'bg-green-100 text-green-900 border-green-400 font-bold';
      label = 'COMPLETED';
      break;
    case RideStatus.CANCELLED:
      color = 'bg-red-50 text-red-800 border-red-300';
      label = 'CANCELLED';
      break;
    case RideStatus.EXPIRED:
    case RideStatus.NO_DRIVER_FOUND:
      color = 'bg-orange-50 text-orange-800 border-orange-300';
      label = 'NO DRIVER FOUND';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${color}`}
    >
      {label}
    </span>
  );
};
