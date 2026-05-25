import { requireAuth } from '@/lib/auth'
import { BottomNav } from '@/components/layout/BottomNav'
import { FAB } from '@/components/layout/FAB'
import { InactivityGuard } from '@/components/layout/InactivityGuard'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()

  return (
    <div className="min-h-dvh bg-ios-bg">
      <InactivityGuard />
      <main className="bottom-nav-offset">
        {children}
      </main>
      <BottomNav role={user.role} />
      <FAB />
    </div>
  )
}
