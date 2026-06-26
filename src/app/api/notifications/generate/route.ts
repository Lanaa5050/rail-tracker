import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/notifications/generate
// Called daily by Vercel Cron (see vercel.json). Also callable manually.
// Protected by CRON_SECRET env var when set.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const db = createServerClient();

  // Fetch all non-closed items that have a due date
  const { data: items, error } = await db
    .from('rail_items')
    .select('id, due_date, owner, status')
    .neq('status', 'Closed')
    .not('due_date', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const today = new Date(new Date().toDateString()); // midnight local

  // Fetch all existing notifications so we can deduplicate
  const { data: existing } = await db
    .from('notifications')
    .select('rail_item_id, type');

  const alreadyFired = new Set<string>();
  for (const n of existing ?? []) {
    alreadyFired.add(`${n.rail_item_id}:${n.type}`);
  }

  const toInsert: { rail_item_id: string; type: string; owner: string | null }[] = [];

  for (const item of items ?? []) {
    if (!item.due_date) continue;
    const due = new Date(item.due_date);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const candidates: string[] = [];
    if (diffDays < 0) candidates.push('overdue');
    if (diffDays === 7) candidates.push('due_soon_7');
    if (diffDays === 2) candidates.push('due_soon_2');

    for (const type of candidates) {
      const key = `${item.id}:${type}`;
      if (!alreadyFired.has(key)) {
        toInsert.push({ rail_item_id: item.id, type, owner: item.owner || null });
        alreadyFired.add(key); // prevent dupes within this run
      }
    }
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  const { data: inserted, error: insertErr } = await db
    .from('notifications')
    .insert(toInsert)
    .select();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ created: inserted?.length ?? 0 });
}
