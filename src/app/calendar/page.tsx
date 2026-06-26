export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import type { RailItem, Rail, Company } from '@/types/database';
import CalendarClient from './CalendarClient';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };

export interface CalendarItem {
  id: string;
  rail_id: string;
  due_date: string;
  action: string;
  owner: string;
  priority: 1 | 2 | 3;
  status: RailItem['status'];
  rail_name: string;
  company_name: string;
}

export interface CalendarRail {
  id: string;
  name: string;
  company: string;
}

export default async function CalendarPage() {
  const db = createServerClient();

  const [{ data: items }, { data: rails }] = await Promise.all([
    db
      .from('rail_items')
      .select('id, rail_id, due_date, action, owner, priority, status')
      .not('due_date', 'is', null)
      .order('priority', { ascending: true }),
    db.from('rails').select('*, companies(id, name)'),
  ]);

  const railMap = new Map<string, { name: string; company: string }>();
  const sidebarRails: CalendarRail[] = [];

  for (const rail of (rails ?? []) as RailWithCompany[]) {
    const company = Array.isArray(rail.companies) ? rail.companies[0] : rail.companies;
    const info = { name: rail.initiative_name, company: company?.name ?? '' };
    railMap.set(rail.id, info);
    sidebarRails.push({ id: rail.id, name: rail.initiative_name, company: company?.name ?? '' });
  }

  const calItems: CalendarItem[] = ((items ?? []) as RailItem[])
    .filter(i => i.due_date)
    .map(i => ({
      id: i.id,
      rail_id: i.rail_id,
      due_date: i.due_date!,
      action: i.action,
      owner: i.owner,
      priority: i.priority as 1 | 2 | 3,
      status: i.status,
      rail_name: railMap.get(i.rail_id)?.name ?? '',
      company_name: railMap.get(i.rail_id)?.company ?? '',
    }));

  return <CalendarClient items={calItems} rails={sidebarRails} />;
}
