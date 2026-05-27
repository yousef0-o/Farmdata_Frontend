'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, AlertCircle, Leaf } from 'lucide-react'
import { z } from 'zod'
import { useLogin } from '@/lib/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

export default function LoginPage() {
  const router = useRouter()
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
    <div className="flex min-h-screen font-sans" dir="rtl">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-farm-blue text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay" />
        </div>

        <div className="relative z-10 text-right">
          <div className="flex items-center gap-2 mb-8 justify-end">
            <span className="text-3xl font-bold tracking-tight">فارم داتا</span>
            <div className="p-2 bg-farm-green rounded-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            بيانات ذكية <br />
            <span className="text-farm-green">للزراعة الحديثة.</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-md">
            نحدث ثورة في العمليات الزراعية من خلال التحليلات في الوقت الفعلي وأنظمة
            الإدارة الآمنة.
          </p>
        </div>

        <div className="relative z-10 flex gap-6 mt-auto justify-end">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">100%</span>
            <span className="text-sm text-blue-200 uppercase tracking-widest">
              آمن
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">24/7</span>
            <span className="text-sm text-blue-200 uppercase tracking-widest">
              مراقبة
            </span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md text-right">
          <div className="mb-10 text-center lg:text-right">
            <div className="lg:hidden flex justify-center items-center gap-2 mb-6">
              <span className="text-2xl font-bold text-farm-blue">فارم داتا</span>
              <Leaf className="w-8 h-8 text-farm-green" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              مرحباً بك مجدداً
            </h2>
            <p className="text-gray-500">
              يرجى إدخال بيانات الاعتماد الخاصة بك للوصول إلى حسابك.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {apiError && (
              <div className="p-4 bg-red-50 border-r-4 border-red-500 text-red-700 flex items-start gap-3 rounded-md">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">بيانات الاعتماد غير صالحة</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block" htmlFor="email">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail
                    className={`w-5 h-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`}
                  />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className={`block w-full pr-10 pl-3 py-3 border rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-farm-blue focus:border-transparent transition-colors duration-200 text-right text-gray-900 ${
                    errors.email
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:bg-white'
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 font-medium mr-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block" htmlFor="password">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock
                    className={`w-5 h-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`}
                  />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`block w-full pr-10 pl-3 py-3 border rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-farm-blue focus:border-transparent transition-colors duration-200 text-right text-gray-900 ${
                    errors.password
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:bg-white'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-medium mr-1">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-farm-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-farm-blue transition-[background-color,opacity] duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري التحقق...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              © 2026 أنظمة فارم داتا. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
