import React from 'react';
import { TrackingSource } from '@bao-bao/shared';

interface TrackingBadgeProps {
  source: TrackingSource | string;
  updatedAt?: string;
  compact?: boolean;
}

export const TrackingBadge: React.FC<TrackingBadgeProps> = ({
  source,
  updatedAt,
  compact = false,
}) => {
  let label = 'UNKNOWN';
  let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-300';
  let dotColor = 'bg-gray-400';

  switch (source) {
    case TrackingSource.LIVE_APP:
      label = 'LIVE GPS';
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm';
      dotColor = 'bg-emerald-500 animate-pulse';
      break;
    case TrackingSource.LAST_REPORTED:
      label = 'LAST REPORTED';
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
      dotColor = 'bg-amber-500';
      break;
    case TrackingSource.TERMINAL:
      label = 'TERMINAL QUEUE';
      badgeStyle = 'bg-slate-100 text-slate-800 border-slate-300';
      dotColor = 'bg-slate-500';
      break;
    case TrackingSource.GPS_TRACKER:
      label = 'GPS TRACKER';
      badgeStyle = 'bg-sky-50 text-sky-800 border-sky-300';
      dotColor = 'bg-sky-500';
      break;
    default:
      label = 'UNTRACKED';
      badgeStyle = 'bg-gray-100 text-gray-600 border-gray-200';
      dotColor = 'bg-gray-400';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}
      title={updatedAt ? `Last reported: ${new Date(updatedAt).toLocaleTimeString()}` : undefined}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{label}</span>
      {!compact && updatedAt && (
        <span className="text-[10px] opacity-75 font-normal ml-0.5">
          ({formatTimeAgo(updatedAt)})
        </span>
      )}
    </span>
  );
};

function formatTimeAgo(dateStr: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  } catch {
    return '';
  }
}
