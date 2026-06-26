import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080/api/v1';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const headers = new Headers(request.headers);
  headers.delete('host'); // Let fetch set the host
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const body = ['POST', 'PUT', 'PATCH'].includes(request.method) 
      ? await request.text() 
      : undefined;

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
