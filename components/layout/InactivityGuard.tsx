'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes — keep in sync with INACTIVITY_TIMEOUT_MS in lib/session.ts

export function InactivityGuard() {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const loggedOutRef = useRef(false)

  useEffect(() => {
    const logout = async () => {
      if (loggedOutRef.current) return
      loggedOutRef.current = true
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    }

    const reset = () => {
      lastActivityRef.current = Date.now()
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(logout, TIMEOUT_MS)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // App returned from background — check if timeout already passed
        const elapsed = Date.now() - lastActivityRef.current
        if (elapsed >= TIMEOUT_MS) {
          logout()
        } else {
          // Reschedule for the remaining time
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(logout, TIMEOUT_MS - elapsed)
        }
      } else {
        // App going to background — pause the timer so it doesn't fire while hidden
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }

    const events = ['touchstart', 'mousedown', 'keydown', 'scroll'] as const
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibility)

    reset()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [router])

  return null
}
