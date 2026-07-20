import { APP_CONFIG } from '../../constants/config';
import { secureStorage } from '../storage/secureStorage';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  isFormData?: boolean;
  auth?: boolean; // attach bearer token, defaults to true
}

/**
 * Thin fetch wrapper around the PHP REST API.
 * - Centralizes base URL, headers, and auth token attachment.
 * - Normalizes errors into ApiError so screens can show consistent messages.
 * - Keeps all API logic out of components per the master prompt's
 *   "Frontend API Integration" requirement.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false, auth = true } = options;

  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  headers['Accept'] = 'application/json';

  if (auth) {
    const token = await secureStorage.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${APP_CONFIG.API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    });
  } catch (networkError) {
    throw new ApiError(
      'Unable to reach the server. Please check your internet connection and try again.',
      0,
      networkError
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: string }).message)
        : 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PUT', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PATCH', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
  postForm: <T>(path: string, formData: FormData, auth = true) =>
    request<T>(path, { method: 'POST', body: formData, isFormData: true, auth }),
};