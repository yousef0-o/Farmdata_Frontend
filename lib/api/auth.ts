import { apiRequest } from './client'
import type { User } from '../types'

export async function login(email: string, password: string) {
  const res = await apiRequest<{ token: string; user: User }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  )
  localStorage.setItem('auth_token', res.token)
  document.cookie = `auth_token=${res.token}; path=/; max-age=${60 * 60 * 24 * 7}`
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
