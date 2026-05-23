import Link from 'next/link'
import { ChevronRight, Car } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatBRL } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { VehicleWithProfit } from '@/lib/types'

interface Props {
  vehicles: VehicleWithProfit[]
}

export function VehicleProfitCard({ vehicles }: Props) {
  if (vehicles.length === 0) return null

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[15px] font-semibold text-ios-primary">Lucro por Veículo</p>
        <Link href="/veiculos" className="flex items-center gap-0.5 text-[13px] text-ios-secondary pressable">
          Ver todos <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="px-4 pb-3 space-y-0.5">
        {vehicles.slice(0, 4).map(v => (
          <Link
            key={v.id}
            href={`/veiculos/${v.id}`}
            className="flex items-center gap-3 py-2.5 pressable"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Car className="w-4 h-4 text-ios-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ios-primary truncate">
                {v.year} {v.make} {v.model}
              </p>
              <p className="text-[11px] text-ios-tertiary">
                {v.status === 'in_stock' ? 'Em estoque' : v.status === 'sold' ? 'Vendido' : 'Arquivado'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {v.profit !== null ? (
                <span className={cn(
                  'text-[14px] font-semibold tabular-nums',
                  v.profit >= 0 ? 'text-profit' : 'text-expense'
                )}>
                  {v.profit >= 0 ? '+' : ''}{formatBRL(v.profit)}
                </span>
              ) : (
                <span className="text-[12px] text-ios-tertiary">Em estoque</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
