'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-red-50 text-expense font-semibold text-[14px] pressable disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      {pending ? 'Saindo...' : 'Sair da Conta'}
    </button>
  )
}
