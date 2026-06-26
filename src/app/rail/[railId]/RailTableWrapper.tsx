'use client';

import { useState } from 'react';
import type { RailItem, CustomColumn } from '@/types/database';
import RailTable from '@/components/RailTable';
import AdminPanel from '@/components/AdminPanel';

type CustomValueMap = Record<string, Record<string, unknown>>;

interface Props {
  railId: string;
  companyId: string;
  initialItems: RailItem[];
  allColumns: CustomColumn[];
  initialHiddenColumnIds: string[];
  visibleColumns: CustomColumn[];
  initialCustomValues: CustomValueMap;
}

export default function RailTableWrapper({
  railId,
  companyId,
  initialItems,
  allColumns,
  initialHiddenColumnIds,
  visibleColumns: initialVisibleColumns,
  initialCustomValues,
}: Props) {
  const [allCols, setAllCols] = useState<CustomColumn[]>(allColumns);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set(initialHiddenColumnIds));

  const visibleColumns = allCols.filter(col => !hiddenIds.has(col.id));

  const handleColumnAdded = (col: CustomColumn) => {
    setAllCols(prev => [...prev, col]);
  };

  const handleVisibilityChanged = (columnId: string, hidden: boolean) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (hidden) next.add(columnId);
      else next.delete(columnId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AdminPanel
          companyId={companyId}
          allColumns={allCols}
          hiddenColumnIds={hiddenIds}
          onColumnAdded={handleColumnAdded}
          onVisibilityChanged={handleVisibilityChanged}
        />
      </div>

      <RailTable
        railId={railId}
        initialItems={initialItems}
        customColumns={visibleColumns}
        initialCustomValues={initialCustomValues}
      />
    </div>
  );
}
