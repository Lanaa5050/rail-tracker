export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import RailPageClient from './RailPageClient';
import NotificationBell from '@/components/NotificationBell';
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
  const closedAt: string | null = (rail as { closed_at?: string | null }).closed_at ?? null;

  const itemIds = (items ?? []).map((i: { id: string }) => i.id);
  let customValues: ItemCustomValue[] = [];
  if (itemIds.length > 0) {
    const { data } = await db.from('item_custom_values').select('*').in('rail_item_id', itemIds);
    customValues = (data ?? []) as ItemCustomValue[];
  }

  let visibilityRows: CompanyColumnVisibility[] = [];
  if (companyId) {
    const { data } = await db.from('company_column_visibility').select('*').eq('company_id', companyId);
    visibilityRows = (data ?? []) as CompanyColumnVisibility[];
  }

  const hiddenColumnIds = new Set(visibilityRows.filter(r => r.hidden).map(r => r.custom_column_id));

  const customValuesByItem: Record<string, Record<string, unknown>> = {};
  for (const cv of customValues) {
    if (!customValuesByItem[cv.rail_item_id]) customValuesByItem[cv.rail_item_id] = {};
    customValuesByItem[cv.rail_item_id][cv.custom_column_id] = cv.value;
  }

  return (
    <div className="min-h-full bg-zinc-50">
      {/* Header bar — mobile: hamburger floats at top-left and aligns with this bar */}
      <div className="bg-white border-b border-zinc-200">
        <div className="pl-10 pr-3 sm:pl-6 sm:pr-4 py-3 flex items-center justify-between gap-2 min-h-[52px]">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-0.5 truncate">
              {company?.name ?? 'Unknown Company'}
            </p>
            <h1 className="text-lg font-bold text-zinc-900 flex items-center gap-2 leading-tight">
              <span className="truncate">{rail.initiative_name}</span>
              {closedAt && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">Archived</span>
              )}
            </h1>
          </div>
          {/* Bell is always in the header, right-aligned */}
          <div className="shrink-0">
            <NotificationBell />
          </div>
        </div>
      </div>

      {itemsError ? (
        <div className="mx-4 sm:mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          Failed to load items: {itemsError.message}
        </div>
      ) : (
        <RailPageClient
          railId={railId}
          companyId={companyId}
          initialItems={items ?? []}
          allColumns={(allColumns ?? []) as CustomColumn[]}
          initialHiddenColumnIds={[...hiddenColumnIds]}
          initialCustomValues={customValuesByItem}
          initialClosedAt={closedAt}
        />
      )}
    </div>
  );
}
