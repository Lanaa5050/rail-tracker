import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ railId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { railId } = await params;
  const body = await req.json();
  const db = createServerClient();

  const allowed = ['closed_at', 'initiative_name'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await db.from('rails').update(update).eq('id', railId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
