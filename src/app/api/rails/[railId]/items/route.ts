import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ railId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { railId } = await params;
  const db = createServerClient();

  const { data, error } = await db
    .from('rail_items')
    .select('*')
    .eq('rail_id', railId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { railId } = await params;
  const body = await req.json();
  const db = createServerClient();

  const { data, error } = await db
    .from('rail_items')
    .insert({
      rail_id: railId,
      priority: body.priority ?? 2,
      action: body.action ?? '',
      owner: body.owner ?? '',
      notes: body.notes ?? '',
      due_date: body.due_date ?? null,
      status: body.status ?? 'New',
      sort_order: body.sort_order ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
