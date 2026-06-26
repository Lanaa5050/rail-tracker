'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { RailItemWithContext } from './page';
import type { RailItemStatus } from '@/types/database';
import StatusBadge, { STATUS_OPTIONS } from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import TopNav from '@/components/TopNav';

interface Props {
  allItems: RailItemWithContext[];
  ownerSuggestions: string[];
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(due_date: string | null, status: RailItemStatus) {
  if (!due_date || status === 'Closed') return false;
  return new Date(due_date) < new Date(new Date().toDateString());
}

export default function MyActionsClient({ allItems, ownerSuggestions }: Props) {
  const [owner, setOwner] = useState('');
  const [statusFilter, setStatusFilter] = useState<RailItemStatus | ''>('');
  const [dueDateFilter, setDueDateFilter] = useState<'overdue' | 'this-week' | 'all'>('all');

  const today = new Date(new Date().toDateString());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);

  const filtered = useMemo(() => {
    return allItems.filter(item => {
      if (owner && !item.owner.toLowerCase().includes(owner.toLowerCase())) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (dueDateFilter === 'overdue' && !isOverdue(item.due_date, item.status)) return false;
      if (dueDateFilter === 'this-week') {
        if (!item.due_date || item.status === 'Closed') return false;
        const d = new Date(item.due_date);
        if (d < today || d > weekFromNow) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, owner, statusFilter, dueDateFilter]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav activePath="/my-actions" />
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-900">My Actions</h1>
        <p className="text-sm text-zinc-500 mt-0.5">All action items across every RAIL, filtered by owner</p>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Owner</label>
          <input
            list="owner-suggestions"
            className="text-sm border border-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 w-48"
            placeholder="Filter by owner…"
            value={owner}
            onChange={e => setOwner(e.target.value)}
          />
          <datalist id="owner-suggestions">
            {ownerSuggestions.map(o => <option key={o} value={o} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</label>
          <select
            className="text-sm border border-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as RailItemStatus | '')}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Due Date</label>
          <select
            className="text-sm border border-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={dueDateFilter}
            onChange={e => setDueDateFilter(e.target.value as typeof dueDateFilter)}
          >
            <option value="all">All dates</option>
            <option value="this-week">Due this week</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {(owner || statusFilter || dueDateFilter !== 'all') && (
          <button
            className="self-end text-xs text-zinc-400 hover:text-zinc-700 pb-1.5"
            onClick={() => { setOwner(''); setStatusFilter(''); setDueDateFilter('all'); }}
          >
            Clear filters
          </button>
        )}

        <span className="self-end pb-1.5 text-xs text-zinc-400 ml-auto">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 py-6">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 px-6 py-12 text-center text-zinc-400 italic">
            No items match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-sm bg-white">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Priority</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Action</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Owner</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Due Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">RAIL / Company</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(item => {
                  const overdue = isOverdue(item.due_date, item.status);
                  const closed = item.status === 'Closed';
                  return (
                    <tr key={item.id} className={closed ? 'opacity-50 bg-zinc-50' : 'hover:bg-blue-50/30'}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="px-3 py-2 max-w-sm">
                        <p className="font-medium text-zinc-800">{item.action || <span className="italic text-zinc-400">—</span>}</p>
                        {item.notes && <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.notes}</p>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-zinc-700">{item.owner || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className={`px-3 py-2 whitespace-nowrap ${overdue ? 'text-red-600 font-medium' : 'text-zinc-600'}`}>
                        {item.due_date ? formatDate(item.due_date) : <span className="text-zinc-300">—</span>}
                        {overdue && <span className="block text-[10px] font-semibold text-red-500 uppercase tracking-wide">Overdue</span>}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/rail/${item.rail_id}`}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          {item.rail_name}
                        </Link>
                        <p className="text-xs text-zinc-400">{item.company_name}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
