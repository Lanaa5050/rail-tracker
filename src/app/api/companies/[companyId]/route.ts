import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ companyId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { companyId } = await params;
  const db = createServerClient();
  const { error } = await db.from('companies').delete().eq('id', companyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
