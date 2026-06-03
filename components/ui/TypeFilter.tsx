'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type TxFilter = 'all' | 'expense' | 'sale'

const FILTERS: { key: TxFilter; label: string }[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'expense', label: 'Despesas' },
  { key: 'sale', label: 'Vendas' },
]

export function TypeFilter({ current }: { current?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function select(key: TxFilter) {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'all') {
      params.delete('type')
    } else {
      params.set('type', key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const active = (current ?? 'all') as TxFilter

  return (
    <div className="flex bg-ios-fill rounded-xl p-1 gap-1">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => select(key)}
          className={cn(
            'flex-1 py-2 rounded-lg text-[13px] font-medium transition-all',
            active === key
              ? 'bg-white shadow-sm text-ios-primary'
              : 'text-ios-secondary'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
