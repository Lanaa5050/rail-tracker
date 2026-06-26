export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import RailTableWrapper from './RailTableWrapper';
import type { Metadata } from 'next';
import type { CustomColumn, CompanyColumnVisibility, ItemCustomValue } from '@/types/database';

type Props = { params: Promise<{ railId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { railId } = await params;
  const db = createServerClient();
  const { data: rail } = await db
    .from('rails')
    .select('initiative_name, companies(name)')
    .eq('id', railId)
    .single();

  if (!rail) return { title: 'RAIL Tracker' };
  const company = Array.isArray(rail.companies) ? rail.companies[0] : rail.companies;
  return { title: `${company?.name ?? ''} — ${rail.initiative_name} | RAIL Tracker` };
}

export default async function RailPage({ params }: Props) {
  const { railId } = await params;
  const db = createServerClient();

  const [
    { data: rail, error: railError },
    { data: items, error: itemsError },
    { data: allColumns },
  ] = await Promise.all([
    db.from('rails').select('*, companies(id, name)').eq('id', railId).single(),
    db
      .from('rail_items')
      .select('*')
      .eq('rail_id', railId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    db
      .from('custom_columns')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  if (railError || !rail) notFound();

  const company = Array.isArray(rail.companies) ? rail.companies[0] : rail.companies;
  const companyId: string = company?.id ?? '';

  // Fetch item_custom_values properly now that we have item IDs
  const itemIds = (items ?? []).map((i: { id: string }) => i.id);
  let customValues: ItemCustomValue[] = [];
  if (itemIds.length > 0) {
    const { data } = await db
      .from('item_custom_values')
      .select('*')
      .in('rail_item_id', itemIds);
    customValues = (data ?? []) as ItemCustomValue[];
  }

  // Fetch column visibility for this company
  let visibilityRows: CompanyColumnVisibility[] = [];
  if (companyId) {
    const { data } = await db
      .from('company_column_visibility')
      .select('*')
      .eq('company_id', companyId);
    visibilityRows = (data ?? []) as CompanyColumnVisibility[];
  }

  const hiddenColumnIds = new Set(
    visibilityRows.filter(r => r.hidden).map(r => r.custom_column_id)
  );

  const visibleColumns = ((allColumns ?? []) as CustomColumn[]).filter(
    col => !hiddenColumnIds.has(col.id)
  );

  // Build customValuesByItem map for RailTable
  const customValuesByItem: Record<string, Record<string, unknown>> = {};
  for (const cv of customValues) {
    if (!customValuesByItem[cv.rail_item_id]) customValuesByItem[cv.rail_item_id] = {};
    customValuesByItem[cv.rail_item_id][cv.custom_column_id] = cv.value;
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <div className="bg-white border-b border-zinc-200">
        <div className="px-4 sm:px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">
            {company?.name ?? 'Unknown Company'}
          </p>
          <h1 className="text-xl font-bold text-zinc-900">{rail.initiative_name}</h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6">
        {itemsError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Failed to load items: {itemsError.message}
          </div>
        ) : (
          <RailTableWrapper
            railId={railId}
            companyId={companyId}
            initialItems={items ?? []}
            allColumns={(allColumns ?? []) as CustomColumn[]}
            initialHiddenColumnIds={[...hiddenColumnIds]}
            visibleColumns={visibleColumns}
            initialCustomValues={customValuesByItem}
          />
        )}
      </div>
    </div>
  );
}
