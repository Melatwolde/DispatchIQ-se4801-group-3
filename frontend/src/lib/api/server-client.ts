import { api } from '../../../../libs/api-client/src';
import { cookies } from 'next/headers';

/**
 * Server-side API client for Server Components and Server Actions.
 * Manually injects the auth_token cookie into the request header.
 */
export async function getServerClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const serverClient = api;
  
  if (token) {
    serverClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete serverClient.defaults.headers.common['Authorization'];
  }

  return serverClient;
}
