'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RailItem, CustomColumn } from '@/types/database';
import RailTable from '@/components/RailTable';
import AdminPanel from '@/components/AdminPanel';
import NotificationBell from '@/components/NotificationBell';
import { MenuButton } from '@/components/RailSidebar';
import { useAdmin } from '@/context/AdminContext';

type CustomValueMap = Record<string, Record<string, unknown>>;

interface Props {
  railId: string;
  companyId: string;
  companyName: string;
  initiativeName: string;
  initialItems: RailItem[];
  allColumns: CustomColumn[];
  initialHiddenColumnIds: string[];
  initialCustomValues: CustomValueMap;
  initialClosedAt: string | null;
}

export default function RailPageClient({
  railId,
  companyId,
  companyName,
  initiativeName,
  initialItems,
  allColumns,
  initialHiddenColumnIds,
  initialCustomValues,
  initialClosedAt,
}: Props) {
  const [allCols, setAllCols] = useState<CustomColumn[]>(allColumns);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set(initialHiddenColumnIds));
  const [closedAt, setClosedAt] = useState<string | null>(initialClosedAt);
  const [toggling, setToggling] = useState(false);
  const { isAdmin } = useAdmin();
  const router = useRouter();

  const visibleColumns = allCols.filter(col => !hiddenIds.has(col.id));
  const isClosed = !!closedAt;

  const toggleClosed = async () => {
    if (!confirm(isClosed
      ? 'Reopen this RAIL? It will appear as active again.'
      : 'Close this RAIL? It will be archived but all data will be preserved.')) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/rails/${railId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closed_at: isClosed ? null : new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setClosedAt(updated.closed_at ?? null);
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50">
      {/* Header — shrink-0 keeps it outside any scroll container */}
      <div className="shrink-0 bg-white border-b border-zinc-200 w-full">
        {/* Row 1: company + initiative title, full width */}
        <div className="px-3 sm:px-6 pt-3 pb-1 min-w-0 overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-0.5 truncate">
            {companyName}
          </p>
          <h1 className="text-lg font-bold text-zinc-900 flex items-center gap-2 leading-tight min-w-0">
            <span className="truncate min-w-0">{initiativeName}</span>
            {isClosed && (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">Archived</span>
            )}
          </h1>
        </div>

        {/* Row 2: hamburger (mobile only) on left, controls on right */}
        <div className="px-3 sm:px-6 pb-2 sm:pb-0 sm:pt-0 flex items-center justify-between gap-2 lg:hidden">
          <MenuButton />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={toggleClosed}
                disabled={toggling}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50',
                  isClosed
                    ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700',
                ].join(' ')}
              >
                {toggling ? '…' : isClosed ? '↩ Reopen' : '✕ Close'}
              </button>
            )}
            <AdminPanel
              companyId={companyId}
              allColumns={allCols}
              hiddenColumnIds={hiddenIds}
              onColumnAdded={col => setAllCols(prev => [...prev, col])}
              onVisibilityChanged={(columnId, hidden) => setHiddenIds(prev => {
                const next = new Set(prev);
                if (hidden) next.add(columnId); else next.delete(columnId);
                return next;
              })}
            />
            <NotificationBell />
          </div>
        </div>

        {/* Desktop: controls row aligned to the right, no hamburger */}
        <div className="hidden lg:flex px-6 pb-3 justify-end items-center gap-2">
          {isAdmin && (
            <button
              onClick={toggleClosed}
              disabled={toggling}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50',
                isClosed
                  ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                  : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700',
              ].join(' ')}
            >
              {toggling ? '…' : isClosed ? '↩ Reopen' : '✕ Close'}
            </button>
          )}
          <AdminPanel
            companyId={companyId}
            allColumns={allCols}
            hiddenColumnIds={hiddenIds}
            onColumnAdded={col => setAllCols(prev => [...prev, col])}
            onVisibilityChanged={(columnId, hidden) => setHiddenIds(prev => {
              const next = new Set(prev);
              if (hidden) next.add(columnId); else next.delete(columnId);
              return next;
            })}
          />
          <NotificationBell />
        </div>
      </div>

      {/* Scrollable content — flex-1 fills remaining height, overflow-auto handles both axes */}
      <div className="flex-1 overflow-auto">
        {/* Closed banner */}
        {isClosed && (
          <div className="mx-4 sm:mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-amber-600 font-semibold text-sm">Archived RAIL</span>
            <span className="text-amber-500 text-sm">This RAIL is closed. All data is preserved in read-only state.</span>
          </div>
        )}

        {/* Table */}
        <div className="px-4 sm:px-6 py-4">
          <RailTable
            railId={railId}
            initialItems={initialItems}
            customColumns={visibleColumns}
            initialCustomValues={initialCustomValues}
          />
        </div>
      </div>
    </div>
  );
}
