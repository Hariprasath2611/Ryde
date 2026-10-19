/**
 * Ryde Capital API Client
 *
 * Configured with base URL from environment and automatically attaches
 * the active Supabase JWT session token to all outbound requests.
 */

let activeAuthToken: string | null = null;

export function setApiAuthToken(token: string | null): void {
  activeAuthToken = token;
}

export function getApiAuthToken(): string | null {
  return activeAuthToken;
}

export const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] || 'http://localhost:4000/api/v1';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Content-Type', 'application/json');

  if (activeAuthToken) {
    requestHeaders.set('Authorization', `Bearer ${activeAuthToken}`);
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.error?.message || `API request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}
