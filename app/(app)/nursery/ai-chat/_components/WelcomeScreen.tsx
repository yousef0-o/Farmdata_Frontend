'use client'

import React from 'react'
import { Bot, Waves, Sprout, AlertCircle, FileText, Sparkles } from 'lucide-react'

const suggestions = [
  { text: 'ما هي حالة الحوض الحالي وجدول ريّه؟', icon: Waves, gradient: 'from-blue-500/10 to-cyan-500/10' },
  { text: 'اقترح برنامج تسميد لدورة الإنتاج النشطة', icon: Sprout, gradient: 'from-emerald-500/10 to-green-500/10' },
  { text: 'كيف أشخص أوراق النبات الصفراء المصابة؟', icon: AlertCircle, gradient: 'from-amber-500/10 to-orange-500/10' },
  { text: 'اعرض ملخص العمليات الأخيرة بالمشتل', icon: FileText, gradient: 'from-purple-500/10 to-indigo-500/10' },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return 'مساء الخير 🌙'
  if (hour < 12) return 'صباح الخير ☀️'
  if (hour < 17) return 'مرحباً 🌤️'
  return 'مساء الخير 🌅'
}

export default function WelcomeScreen({
  onSuggestionClick,
  disabled,
}: {
  onSuggestionClick: (text: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8 px-4 animate-fade-in-up">
      {/* AI Logo with glow */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-action-primary/20 via-transparent to-action-secondary/20 blur-2xl" />
        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-action-primary/10 to-action-secondary/10 animate-pulse" style={{ animationDuration: '3s' }} />

        {/* Icon container */}
        <div className="relative rounded-2xl bg-gradient-to-br from-action-primary/15 to-action-secondary/15 p-6 shadow-lg ring-1 ring-action-primary/10">
          <Bot className="h-14 w-14 text-action-primary" />
          <Sparkles className="absolute -top-2 -left-2 h-5 w-5 text-action-primary/60 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* Greeting & description */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-ink-muted">{getGreeting()}</p>
        <h2 className="text-xl font-black text-ink tracking-tight">المستشار الزراعي الذكي</h2>
        <p className="text-sm text-ink-muted leading-relaxed max-w-md mx-auto">
          يمكنك السؤال مباشرة عن أي حوض أو دورة أو مخزون. اختيارات التركيز السريع تساعد المستشار فقط ولا تقيد المحادثة.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {suggestions.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(chip.text)}
            disabled={disabled}
            className={`group relative flex items-start gap-3 p-4 text-right rounded-2xl border border-line bg-gradient-to-br ${chip.gradient} backdrop-blur-sm hover:border-action-primary/40 hover:shadow-md disabled:opacity-50 transition-all duration-300 active:scale-[0.98]`}
            style={{ animationDelay: `${idx * 100}ms`, animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards' }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface shadow-sm ring-1 ring-line transition-all group-hover:ring-action-primary/30 group-hover:shadow-md">
              <chip.icon className="h-4.5 w-4.5 text-action-primary" />
            </div>
            <span className="text-xs font-bold leading-relaxed text-ink-soft group-hover:text-ink transition-colors pt-1.5">
              {chip.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
