import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from('custom_columns')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = createServerClient();

  // Determine next display_order
  const { data: existing } = await db
    .from('custom_columns')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = ((existing?.display_order ?? -1) as number) + 1;

  const { data, error } = await db
    .from('custom_columns')
    .insert({
      label: body.label,
      data_type: body.data_type ?? 'text',
      dropdown_options: body.dropdown_options ?? null,
      display_order: nextOrder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
