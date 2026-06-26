import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const expected = process.env.INVITE_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.redirect(new URL('/locked', req.url));
  }

  const response = NextResponse.redirect(new URL('/', req.url));
  response.cookies.set('rail_access', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // 1 year
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return response;
}
