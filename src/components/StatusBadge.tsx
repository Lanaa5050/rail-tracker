'use client';

import type { RailItemStatus } from '@/types/database';

const CONFIG: Record<RailItemStatus, { label: string; className: string }> = {
  'New':      { label: 'New',      className: 'bg-blue-100 text-blue-800 border-blue-200' },
  'In Work':  { label: 'In Work',  className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'Waiting':  { label: 'Waiting',  className: 'bg-purple-100 text-purple-800 border-purple-200' },
  'On Hold':  { label: 'On Hold',  className: 'bg-gray-100 text-gray-600 border-gray-200' },
  'Closed':   { label: 'Closed',   className: 'bg-green-100 text-green-700 border-green-200' },
};

export default function StatusBadge({ status }: { status: RailItemStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG['New'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

export const STATUS_OPTIONS: RailItemStatus[] = ['New', 'In Work', 'Waiting', 'On Hold', 'Closed'];
