'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

export function InactivityGuard() {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const logout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    }

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(logout, TIMEOUT_MS)
    }

    // Reset timer on any interaction
    const events = ['touchstart', 'mousedown', 'keydown', 'scroll'] as const
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))

    // When returning to the app after backgrounding, trigger a server check
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    reset() // start the initial timer

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [router])

  return null
}
