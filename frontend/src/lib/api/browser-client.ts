import { api } from '../../../../libs/api-client/src';

/**
 * Browser-side API client.
 * Axios will automatically send cookies to the same domain.
 * Since we are using the Next.js Proxy Route Handler (/api/proxy), 
 * request will go to our own server, then be proxied with auth token.
 */
const browserClient = api;

// Configure for proxy if on client
if (typeof window !== 'undefined') {
  browserClient.defaults.baseURL = '/api/proxy';
}

export default browserClient;
