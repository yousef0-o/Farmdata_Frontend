'use client'

import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { useMe } from '@/lib/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useMe()
  const router = useRouter()

  useEffect(() => {
    if (isError) {
      router.push('/login')
    }
  }, [isError, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200" dir="rtl">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">{children}</div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
