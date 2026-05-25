'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [pending, setPending] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setPending(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
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
