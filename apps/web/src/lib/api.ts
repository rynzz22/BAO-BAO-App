import { getAuthHeader } from './supabase'
import type { ApiError } from '@/types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1'

class ApiClientError extends Error {
  constructor(public error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeader()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    let error: ApiError
    try {
      error = await response.json()
    } catch {
      error = {
        statusCode: response.status,
        code: 'UNKNOWN_ERROR',
        message: response.statusText || 'An error occurred',
      }
    }
    throw new ApiClientError(error)
  }

  if (response.status === 204) return undefined as T

  return response.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export { ApiClientError }
