export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import type { RailItem, Rail, Company } from '@/types/database';
import TopNav from '@/components/TopNav';
import PriorityBoardClient, { type EnrichedItem } from './PriorityBoardClient';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };

export default async function PriorityBoardPage() {
  const db = createServerClient();

  const [{ data: items }, { data: rails }] = await Promise.all([
    db
      .from('rail_items')
      .select('*')
      .neq('status', 'Closed')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false }),
    db.from('rails').select('*, companies(id, name)'),
  ]);

  const railMap = new Map<string, { name: string; company: string }>();
  for (const rail of (rails ?? []) as RailWithCompany[]) {
    const company = Array.isArray(rail.companies) ? rail.companies[0] : rail.companies;
    railMap.set(rail.id, { name: rail.initiative_name, company: company?.name ?? '' });
  }

  const enriched: EnrichedItem[] = ((items ?? []) as RailItem[]).map(item => {
    const info = railMap.get(item.rail_id);
    return { ...item, rail_name: info?.name ?? '', company_name: info?.company ?? '' };
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav activePath="/priority-board" />
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-900">Priority Board</h1>
        <p className="text-sm text-zinc-500 mt-0.5">All open items across every RAIL — what matters most right now</p>
      </div>
      <PriorityBoardClient items={enriched} />
    </div>
  );
}
