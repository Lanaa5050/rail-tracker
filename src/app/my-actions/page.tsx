export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import type { RailItem, Rail, Company } from '@/types/database';
import MyActionsClient from './MyActionsClient';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };
export type RailItemWithContext = RailItem & {
  rail_name: string;
  company_name: string;
};

export default async function MyActionsPage() {
  const db = createServerClient();

  const [{ data: items }, { data: rails }] = await Promise.all([
    db
      .from('rail_items')
      .select('*')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false }),
    db.from('rails').select('*, companies(id, name)'),
  ]);

  // Build rail lookup map
  const railMap = new Map<string, RailWithCompany>();
  for (const rail of (rails ?? []) as RailWithCompany[]) {
    railMap.set(rail.id, rail);
  }

  const enriched: RailItemWithContext[] = ((items ?? []) as RailItem[]).map(item => {
    const rail = railMap.get(item.rail_id);
    const company = rail?.companies;
    return {
      ...item,
      rail_name: rail?.initiative_name ?? '',
      company_name: (Array.isArray(company) ? company[0]?.name : company?.name) ?? '',
    };
  });

  // Collect unique owners for suggestions
  const owners = Array.from(new Set(enriched.map(i => i.owner).filter(Boolean))).sort();

  return <MyActionsClient allItems={enriched} ownerSuggestions={owners} />;
}
