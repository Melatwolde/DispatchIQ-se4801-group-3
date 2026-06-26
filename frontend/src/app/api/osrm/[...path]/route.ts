import { NextRequest, NextResponse } from 'next/server';

const OSRM_URL = process.env.OSRM_URL || 'http://localhost:5000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const segment = path.join('/');
  const search = request.nextUrl.search;
  const url = `${OSRM_URL}/${segment}${search}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OSRM proxy error:', error);
    return NextResponse.json({ code: 'ProxyError', message: 'OSRM unavailable' }, { status: 502 });
  }
}
