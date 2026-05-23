'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { RangePreset } from '@/lib/dateRange'

interface Props {
  preset: RangePreset
  from: string
  to: string
}

export function DateRangeFilter({ preset, from, to }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const today = new Date().toISOString().slice(0, 10)

  const [showCustom, setShowCustom] = useState(preset === 'custom')
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)

  function navigate(p: RangePreset, f?: string, t?: string) {
    const params = new URLSearchParams()
    if (p === 'ytd') {
      params.set('range', 'ytd')
    } else if (p === 'custom' && f && t) {
      params.set('range', 'custom')
      params.set('from', f)
      params.set('to', t)
    } else {
      params.set('range', 'month')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function handlePreset(p: RangePreset) {
    if (p === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      navigate(p)
    }
  }

  function handleApply() {
    if (customFrom && customTo && customFrom <= customTo) {
      navigate('custom', customFrom, customTo)
    }
  }

  const activeTab = showCustom ? 'custom' : preset

  return (
    <div className="space-y-3">
      <div className="flex bg-ios-fill rounded-xl p-1 gap-1">
        {([
          { key: 'month', label: 'Este Mês' },
          { key: 'ytd',   label: 'Este Ano' },
          { key: 'custom', label: 'Período' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={cn(
              'flex-1 py-2 rounded-lg text-[13px] font-medium transition-all',
              activeTab === key
                ? 'bg-white shadow-sm text-ios-primary'
                : 'text-ios-secondary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <p className="text-[11px] text-ios-secondary mb-1">De</p>
            <input
              type="date"
              value={customFrom}
              max={today}
              onChange={e => setCustomFrom(e.target.value)}
              className="w-full rounded-xl bg-ios-fill px-3 py-2.5 text-[14px] text-ios-primary outline-none"
            />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-ios-secondary mb-1">Até</p>
            <input
              type="date"
              value={customTo}
              max={today}
              onChange={e => setCustomTo(e.target.value)}
              className="w-full rounded-xl bg-ios-fill px-3 py-2.5 text-[14px] text-ios-primary outline-none"
            />
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-2.5 rounded-xl bg-ios-primary text-white text-[13px] font-semibold"
          >
            Ver
          </button>
        </div>
      )}
    </div>
  )
}
