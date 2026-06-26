import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ railId: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { itemId } = await params;
  const body = await req.json();
  const db = createServerClient();

  // Strip read-only fields — last_update is handled by the DB trigger
  const { id: _id, rail_id: _rail, last_update: _lu, created_at: _ca, ...patch } = body;

  const { data, error } = await db
    .from('rail_items')
    .update(patch)
    .eq('id', itemId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { itemId } = await params;
  const db = createServerClient();

  const { error } = await db.from('rail_items').delete().eq('id', itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
