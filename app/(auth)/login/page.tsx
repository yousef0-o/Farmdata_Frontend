'use client'

import React, { useState } from 'react'
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Leaf,
  LogIn,
  ShieldCheck,
} from 'lucide-react'
import { z } from 'zod'
import { useLogin } from '@/lib/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

const baseInputClassName =
  'min-h-12 w-full rounded-xl border bg-surface-muted px-4 py-3 text-sm text-ink outline-none transition-[border-color,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-ink-muted hover:border-line-strong hover:bg-surface focus:border-action-primary focus:bg-surface focus:ring-4 focus:ring-action-primary/15 disabled:cursor-not-allowed disabled:opacity-60'

const getInputClassName = (hasError: boolean, alignment = 'text-right') =>
  `${baseInputClassName} ${alignment} ${
    hasError
      ? 'border-danger bg-danger-soft/20 focus:border-danger focus:ring-danger/15'
      : 'border-line'
  }`

export default function LoginPage() {
  const loginMutation = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0] as 'email' | 'password'
        if (!fieldErrors[field]) fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    loginMutation.mutate({ email, password })
  }

  const isLoading = loginMutation.isPending
  const apiError = loginMutation.error

  const clearError = (field: 'email' | 'password') => {
    if (!errors[field]) return

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
  }

  return (
    <main className="min-h-screen bg-background text-ink" dir="rtl">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-[27rem]">
          <div className="rounded-2xl bg-surface p-6 shadow-[0_18px_60px_rgba(26,25,22,0.07)] ring-1 ring-line/80 sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-5">
              <div className="space-y-2 text-right">
                <p className="text-xs font-semibold text-action-primary">
                  فارم داتا
                </p>
                <h1 className="text-[2rem] font-bold leading-[1.35] text-ink">
                  مرحباً بك مجدداً
                </h1>
                <p className="text-sm leading-6 text-ink-soft">
                  ادخل إلى لوحة التشغيل.
                </p>
              </div>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-action-primary ring-1 ring-line/70"
                aria-hidden="true"
              >
                <Leaf className="h-5 w-5" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {apiError ? (
                <div
                  className="flex items-start gap-3 rounded-xl bg-danger-soft/80 px-4 py-3 text-danger-strong ring-1 ring-danger/15"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">
                    تعذر الدخول. تحقق من البريد وكلمة المرور.
                  </p>
                </div>
              ) : null}

              <div className="group space-y-2">
                <label
                  className="flex items-center justify-start gap-2.5 text-sm font-semibold text-ink-soft"
                  htmlFor="email"
                >
                  <Mail
                    className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                      errors.email
                        ? 'text-danger'
                        : 'text-ink-muted group-focus-within:text-action-primary'
                    }`}
                    aria-hidden="true"
                  />
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  placeholder="name@company.com"
                  className={getInputClassName(Boolean(errors.email), 'text-left')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearError('email')
                  }}
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email ? (
                  <p id="email-error" className="text-xs font-medium text-danger">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="group space-y-2">
                <label
                  className="flex items-center justify-start gap-2.5 text-sm font-semibold text-ink-soft"
                  htmlFor="password"
                >
                  <Lock
                    className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                      errors.password
                        ? 'text-danger'
                        : 'text-ink-muted group-focus-within:text-action-primary'
                    }`}
                    aria-hidden="true"
                  />
                  كلمة المرور
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="كلمة المرور"
                  className={getInputClassName(Boolean(errors.password))}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearError('password')
                  }}
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                {errors.password ? (
                  <p id="password-error" className="text-xs font-medium text-danger">
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-action-primary px-4 py-3 text-sm font-bold text-ink-inverse shadow-[0_10px_24px_rgba(194,65,12,0.18)] outline-none transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-action-primary-hover hover:shadow-[0_14px_30px_rgba(194,65,12,0.22)] focus-visible:ring-4 focus-visible:ring-action-primary/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none disabled:active:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2.5">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    جاري التحقق...
                  </span>
                ) : (
                  <>
                    <LogIn
                      className="h-5 w-5 shrink-0 -scale-x-100"
                      aria-hidden="true"
                    />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-muted">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                اتصال آمن لفريق التشغيل
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
