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
  const requestOptions: RequestInit = { ...options }
  const requestedMethod = options.method?.toUpperCase()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (requestedMethod === 'DELETE') {
    requestOptions.method = 'POST'
    requestOptions.body = new URLSearchParams({ _method: 'DELETE' }).toString()
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...requestOptions, headers })

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
    const payload = await res.json().catch(() => null)
    const error = new Error(apiErrorMessage(payload, res.status))
    ;(error as Error & { status?: number; payload?: unknown }).status = res.status
    ;(error as Error & { status?: number; payload?: unknown }).payload = payload
    throw error
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

function apiErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const data = payload as {
      message?: unknown
      error?: unknown
      errors?: Record<string, unknown>
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }

    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error
    }

    if (data.errors && typeof data.errors === 'object') {
      const first = Object.values(data.errors)[0]
      if (Array.isArray(first) && typeof first[0] === 'string') {
        return first[0]
      }
      if (typeof first === 'string') {
        return first
      }
    }
  }

  return `Request failed (${status})`
}

export function wrapResponse<T>(promise: Promise<unknown>): Promise<{ data: T }> {
  return promise.then(res => {
    if (res && typeof res === 'object' && 'data' in res) {
      return res as { data: T }
    }
    return { data: res as T }
  })
}
