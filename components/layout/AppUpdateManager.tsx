'use client'

import { useEffect } from 'react'

const VERSION_URL = '/app-version.json'
const VERSION_KEY = 'taquinho-app-version'
const RELOADED_KEY = 'taquinho-reloaded-version'

export function AppUpdateManager() {
  useEffect(() => {
    let cancelled = false
    let checking = false

    const reloadForVersion = (version: string) => {
      if (sessionStorage.getItem(RELOADED_KEY) === version) return
      sessionStorage.setItem(RELOADED_KEY, version)
      localStorage.setItem(VERSION_KEY, version)
      window.location.reload()
    }

    const checkForUpdate = async () => {
      if (checking || cancelled) return
      checking = true

      try {
        const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
          cache: 'no-store',
        })

        if (!response.ok) return

        const data = await response.json() as { version?: string }
        const version = data.version
        if (!version) return

        const currentVersion = localStorage.getItem(VERSION_KEY)
        if (!currentVersion) {
          localStorage.setItem(VERSION_KEY, version)
          return
        }

        if (currentVersion !== version) {
          reloadForVersion(version)
        }
      } catch {
        // Ignore offline checks; the next online/focus event will retry.
      } finally {
        checking = false
      }
    }

    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) return

      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none',
        })

        await registration.update()
      } catch {
        // The app still works without service worker registration.
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate()
      }
    }

    void registerServiceWorker()
    void checkForUpdate()

    window.addEventListener('focus', checkForUpdate)
    window.addEventListener('online', checkForUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const interval = window.setInterval(checkForUpdate, 10 * 60 * 1000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', checkForUpdate)
      window.removeEventListener('online', checkForUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
