'use client'

import { useState, useEffect, useRef } from 'react'

// If a save takes longer than this, unstick the UI and let the user retry.
const STUCK_TIMEOUT_MS = 20_000

/**
 * Drop-in replacement for useTransition in form saves.
 *
 * Problem: useTransition's pending state cannot be externally reset. On iOS PWA,
 * when the app is backgrounded while a server-action fetch is in-flight, the OS
 * suspends the TCP connection. The async function never resolves or rejects, so
 * pending stays true forever. Every subsequent save tap is silently blocked by
 * the "if (pending) return" guard.
 *
 * This hook uses plain useState (externally resettable) plus:
 *  - A visibilitychange listener: resets saving and calls onAbort when the app
 *    returns from background mid-save.
 *  - A 20-second timeout: resets saving if the network never responds.
 */
export function useSafeSubmit() {
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)   // mirror for event listeners (avoids stale closure)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onAbortRef = useRef<((reason: 'timeout' | 'background') => void) | null>(null)

  function _reset() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    savingRef.current = false
    setSaving(false)
  }

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && savingRef.current) {
        _reset()
        onAbortRef.current?.('background')
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  /**
   * @param fn        The async save function (throws on error, resolves on success)
   * @param onAbort   Called when the save is aborted (timeout or iOS background).
   *                  Use this to show an error message prompting the user to retry.
   */
  async function run(
    fn: () => Promise<void>,
    onAbort?: (reason: 'timeout' | 'background') => void
  ): Promise<void> {
    if (savingRef.current) return
    onAbortRef.current = onAbort ?? null
    savingRef.current = true
    setSaving(true)

    timerRef.current = setTimeout(() => {
      _reset()
      onAbortRef.current?.('timeout')
    }, STUCK_TIMEOUT_MS)

    try {
      await fn()
    } finally {
      _reset()
    }
    // Errors propagate to the caller's catch block
  }

  return { saving, run }
}
