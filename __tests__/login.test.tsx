import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from '../app/(auth)/login/page'
import React from 'react'

// Mock useLogin
const mockMutate = vi.fn()
vi.mock('@/lib/hooks/useAuth', () => ({
  useLogin: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  })
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)
    expect(screen.getByText('مرحباً بك مجدداً')).toBeInTheDocument()
    expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument()
  })

  it('shows inline validation errors for empty fields', async () => {
    render(<LoginPage />)
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i })
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('بريد إلكتروني غير صالح')).toBeInTheDocument()
      expect(screen.getByText('كلمة المرور مطلوبة')).toBeInTheDocument()
    })
  })

  it('handles successful login submission', async () => {
    render(<LoginPage />)
    
    fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), { target: { value: 'admin@farmdata.com' } })
    fireEvent.change(screen.getByLabelText(/كلمة المرور/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول/i }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'admin@farmdata.com',
        password: 'password123',
      })
    })
  })
})
