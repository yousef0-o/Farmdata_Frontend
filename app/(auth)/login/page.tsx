'use client'

import React, { useState } from 'react'
import { Mail, Lock, Loader2, AlertCircle, Leaf } from 'lucide-react'
import { z } from 'zod'
import { useLogin } from '@/lib/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

const operationalNotes = [
  {
    title: 'بوابة تشغيل موحدة',
    description: 'الوصول إلى السجلات اليومية، المخزون، والتقارير من نقطة دخول واحدة.',
  },
  {
    title: 'جلسات آمنة للفريق',
    description: 'التحقق من الهوية يتم قبل فتح لوحات المتابعة والبيانات التشغيلية.',
  },
  {
    title: 'جاهز للعمل الميداني',
    description: 'النموذج مهيأ للاستخدام السريع على الهاتف مع أهداف لمس واضحة وثابتة.',
  },
]

const baseInputClassName =
  'min-h-11 w-full rounded-xl border bg-surface-muted px-4 py-3 text-right text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-action-primary disabled:cursor-not-allowed disabled:opacity-60 transition-colors duration-150'

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

  return (
    <main className="min-h-screen bg-background text-ink" dir="rtl">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full lg:flex lg:items-stretch lg:gap-6">
          <section className="w-full rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8 lg:max-w-[28rem] lg:flex-none">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="text-right">
                <p className="text-xs font-semibold text-ink-muted">بوابة العمليات</p>
                <h1 className="mt-2 text-3xl font-bold text-ink">مرحباً بك مجدداً</h1>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  أدخل بيانات الاعتماد للوصول إلى لوحة التشغيل والسجلات اليومية.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-subtle text-action-primary">
                <Leaf className="h-5 w-5" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {apiError ? (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-danger bg-danger-soft px-4 py-3 text-danger transition-opacity duration-150"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">بيانات الاعتماد غير صالحة</p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-ink-soft"
                  htmlFor="email"
                >
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <Mail
                      className={`h-5 w-5 transition-colors duration-150 ${
                        errors.email ? 'text-danger' : 'text-ink-muted'
                      }`}
                    />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className={`${baseInputClassName} pr-11 ${
                      errors.email ? 'border-danger' : 'border-line'
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email ? (
                  <p id="email-error" className="text-xs font-medium text-danger">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-ink-soft"
                  htmlFor="password"
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <Lock
                      className={`h-5 w-5 transition-colors duration-150 ${
                        errors.password ? 'text-danger' : 'text-ink-muted'
                      }`}
                    />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`${baseInputClassName} pr-11 ${
                      errors.password ? 'border-danger' : 'border-line'
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                </div>
                {errors.password ? (
                  <p id="password-error" className="text-xs font-medium text-danger">
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-11 w-full items-center justify-center rounded-xl border border-transparent bg-action-primary px-4 py-3 text-sm font-bold text-ink-inverse focus:outline-none focus:ring-2 focus:ring-action-primary focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-70 transition-colors duration-150 hover:bg-action-primary-hover"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 transition-opacity duration-150">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري التحقق...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-line pt-6">
              <p className="text-xs text-center text-ink-muted">
                © 2026 أنظمة فارم داتا. جميع الحقوق محفوظة.
              </p>
            </div>
          </section>

          <aside className="mt-6 flex-1 rounded-3xl border border-line bg-surface-subtle p-6 sm:p-8 lg:mt-0">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between gap-4 border-b border-line pb-6">
                <div className="text-right">
                  <p className="text-xs font-semibold text-ink-muted">Field Ledger</p>
                  <h2 className="mt-2 text-2xl font-bold text-ink">
                    مساحة دخول هادئة للمتابعة اليومية
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ink-soft">
                    صممت الواجهة لتقليل التشتيت قبل الدخول إلى النظام، مع إبقاء
                    المعلومات الأساسية قريبة وواضحة للفريق الإداري والميداني.
                  </p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface text-action-primary sm:flex">
                  <Leaf className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {operationalNotes.map((note) => (
                  <article
                    key={note.title}
                    className="rounded-2xl border border-line bg-surface p-4"
                  >
                    <p className="text-sm font-semibold text-ink">{note.title}</p>
                    <p className="mt-2 text-xs leading-6 text-ink-soft">
                      {note.description}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
                <p className="text-sm font-semibold text-ink">قبل المتابعة</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-start justify-between gap-4 rounded-xl bg-surface-muted px-4 py-3">
                    <span className="text-xs text-ink-muted">نوع الجلسة</span>
                    <span className="text-sm font-semibold text-ink">دخول إداري آمن</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 rounded-xl bg-surface-muted px-4 py-3">
                    <span className="text-xs text-ink-muted">الدعم المتاح</span>
                    <span className="text-sm font-semibold text-ink">متابعة التشغيل والبيانات</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
