import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ columnId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { columnId } = await params;
  const body = await req.json();
  const db = createServerClient();

  const { id: _id, created_at: _ca, ...patch } = body;

  const { data, error } = await db
    .from('custom_columns')
    .update(patch)
    .eq('id', columnId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
