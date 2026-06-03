'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { formatBRL } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { ChevronRight } from 'lucide-react'

interface Category {
  name: string
  category_id: string | null
  amount: number
  color: string
  icon: string
}

interface Props {
  categories: Category[]
  total: number
  drillDown?: boolean
}

export function SpendingByCategory({ categories, total, drillDown }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleClick(cat: Category) {
    if (!drillDown) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('cat_id', cat.category_id ?? '__none__')
    params.set('cat_name', cat.name)
    router.push(`${pathname}?${params.toString()}`)
  }

  if (categories.length === 0) {
    return (
      <Card>
        <p className="text-[13px] font-semibold text-ios-primary mb-1">Gastos por Categoria</p>
        <p className="text-[12px] text-ios-tertiary mt-3">Nenhuma despesa este mês.</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-semibold text-ios-primary">Gastos por Categoria</p>
        <span className="text-[12px] text-ios-secondary">{formatBRL(total)}</span>
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-2 mb-4 gap-px">
        {categories.slice(0, 6).map(cat => {
          const pct = total > 0 ? (cat.amount / total) * 100 : 0
          return (
            <div
              key={cat.name}
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: cat.color, minWidth: pct > 0 ? 4 : 0 }}
            />
          )
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        {categories.slice(0, 5).map(cat => {
          const pct = total > 0 ? (cat.amount / total) * 100 : 0
          return (
            <button
              key={cat.name}
              onClick={() => handleClick(cat)}
              disabled={!drillDown}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-ios-primary truncate">{cat.name}</span>
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-[13px] font-medium text-ios-primary tabular-nums">
                        {formatBRL(cat.amount)}
                      </span>
                      {drillDown && <ChevronRight className="w-3.5 h-3.5 text-ios-tertiary flex-shrink-0" />}
                    </div>
                  </div>
                  <div className="h-1 bg-ios-fill rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
