'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RailItem, CustomColumn } from '@/types/database';
import RailTable from '@/components/RailTable';
import AdminPanel from '@/components/AdminPanel';
import { useAdmin } from '@/context/AdminContext';

type CustomValueMap = Record<string, Record<string, unknown>>;

interface Props {
  railId: string;
  companyId: string;
  initialItems: RailItem[];
  allColumns: CustomColumn[];
  initialHiddenColumnIds: string[];
  initialCustomValues: CustomValueMap;
  initialClosedAt: string | null;
}

export default function RailPageClient({
  railId,
  companyId,
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
    <>
      {/* Header buttons — rendered into the header slot via props pattern */}
      <div id="rail-header-buttons" className="contents" />

      {/* Closed banner */}
      {isClosed && (
        <div className="mx-4 sm:mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-amber-600 font-semibold text-sm">Archived RAIL</span>
          <span className="text-amber-500 text-sm">This RAIL is closed. All data is preserved in read-only state.</span>
        </div>
      )}

      {/* Admin + Close buttons bar */}
      <div className="px-4 sm:px-6 pt-4 flex justify-end gap-2">
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
            {toggling ? '…' : isClosed ? '↩ Reopen RAIL' : '✕ Close RAIL'}
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
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 py-4">
        <RailTable
          railId={railId}
          initialItems={initialItems}
          customColumns={visibleColumns}
          initialCustomValues={initialCustomValues}
        />
      </div>
    </>
  );
}
