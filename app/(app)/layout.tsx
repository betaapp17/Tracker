import { BottomNav } from '@/components/layout/BottomNav'
import { FAB } from '@/components/layout/FAB'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ios-bg">
      <main className="bottom-nav-offset">
        {children}
      </main>
      <BottomNav />
      <FAB />
    </div>
  )
}
