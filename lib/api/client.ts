export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export async function apiRequestRaw(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  return res
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiRequestRaw(path, options)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw error
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

export function wrapResponse<T>(promise: Promise<any>): Promise<{ data: T }> {
  return promise.then(res => {
    if (res && typeof res === 'object' && 'data' in res) {
      return res
    }
    return { data: res }
  })
}
