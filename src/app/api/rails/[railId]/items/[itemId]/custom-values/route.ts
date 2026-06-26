import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ railId: string; itemId: string }> };

// PUT body: { custom_column_id: string, value: unknown }
export async function PUT(req: NextRequest, { params }: Params) {
  const { itemId } = await params;
  const { custom_column_id, value } = await req.json();
  const db = createServerClient();

  const { data, error } = await db
    .from('item_custom_values')
    .upsert(
      { rail_item_id: itemId, custom_column_id, value },
      { onConflict: 'rail_item_id,custom_column_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
