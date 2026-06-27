import { NextRequest, NextResponse } from 'next/server';

const PHOTON_URL = process.env.PHOTON_URL || 'http://localhost:2322/api';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const url = `${PHOTON_URL}${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Photon proxy error:', error);
    return NextResponse.json({ features: [], error: 'Photon unavailable' }, { status: 502 });
  }
}
