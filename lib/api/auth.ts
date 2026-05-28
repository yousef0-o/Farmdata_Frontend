import { apiRequest } from './client'
import type { User } from '../types'

function buildAuthCookie(token: string) {
  return [
    `auth_token=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${60 * 60 * 24 * 7}`,
    'SameSite=Lax',
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export async function login(email: string, password: string) {
  const res = await apiRequest<{ token: string; user: User }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  )
  localStorage.setItem('auth_token', res.token)
  document.cookie = buildAuthCookie(res.token)
  return res
}

export async function logout() {
  await apiRequest('/auth/logout', { method: 'POST' })
  localStorage.removeItem('auth_token')
  document.cookie = 'auth_token=; path=/; max-age=0'
}

export async function getMe(): Promise<User> {
  const res = await apiRequest<any>('/auth/me')
  return res.data ?? res
}
