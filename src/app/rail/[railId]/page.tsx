export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import RailTable from '@/components/RailTable';
import type { Metadata } from 'next';

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

  const [{ data: rail, error: railError }, { data: items, error: itemsError }] = await Promise.all([
    db
      .from('rails')
      .select('*, companies(id, name)')
      .eq('id', railId)
      .single(),
    db
      .from('rail_items')
      .select('*')
      .eq('rail_id', railId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
  ]);

  if (railError || !rail) notFound();

  const company = Array.isArray(rail.companies) ? rail.companies[0] : rail.companies;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">
                {company?.name ?? 'Unknown Company'}
              </p>
              <h1 className="text-xl font-bold text-zinc-900">{rail.initiative_name}</h1>
            </div>
            <a
              href="/"
              className="text-sm text-zinc-400 hover:text-zinc-700 whitespace-nowrap mt-1"
            >
              ← All RAILs
            </a>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {itemsError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Failed to load items: {itemsError.message}
          </div>
        ) : (
          <RailTable railId={railId} initialItems={items ?? []} />
        )}
      </div>
    </div>
  );
}
