import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { ChevronLeft, Car, TrendingUp } from 'lucide-react'
import { getVehicleWithProfit } from '@/lib/actions/vehicles'
import { formatBRL, formatDateFull } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { EditVehicleButton } from '@/components/vehicles/EditVehicleButton'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const statusLabel = { in_stock: 'Em Estoque', sold: 'Vendido', archived: 'Arquivado' }

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const vehicle = await getVehicleWithProfit(id)
  if (!vehicle) notFound()

  const hasSale = vehicle.sale_price !== null
  const profitColor = !hasSale ? 'text-ios-secondary'
    : vehicle.profit! >= 0 ? 'text-profit' : 'text-expense'

  const rows = [
    { label: 'Preço de Compra',  value: formatBRL(vehicle.purchase_price), color: 'text-expense' },
    { label: 'Despesas Vinculadas', value: formatBRL(vehicle.linked_expenses), color: 'text-expense' },
    { label: 'Custo Total',      value: formatBRL(vehicle.total_cost), color: 'text-expense', bold: true },
    ...(hasSale
      ? [{ label: 'Preço de Venda', value: formatBRL(vehicle.sale_price!), color: 'text-profit', bold: true }]
      : []),
  ]

  return (
    <div className="px-4 pt-12">
      {/* Back */}
      <Link href="/veiculos" className="flex items-center gap-1 text-[14px] text-ios-secondary mb-5 pressable -ml-1">
        <ChevronLeft className="w-5 h-5" />
        Veículos
      </Link>

      {/* Hero */}
      <div className="bg-ios-primary rounded-3xl p-6 text-white mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[12px] text-white/50 uppercase tracking-wider mb-1">
              {statusLabel[vehicle.status]}
            </p>
            <h1 className="text-[24px] font-bold">{vehicle.year} {vehicle.make}</h1>
            <p className="text-[20px] font-medium text-white/80">{vehicle.model}</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Car className="w-6 h-6 text-white/60" />
          </div>
        </div>

        <div className="mb-4">
          <EditVehicleButton vehicle={vehicle} />
        </div>

        {vehicle.plate && (
          <div className="inline-flex px-3 py-1 bg-white/10 rounded-lg mb-4">
            <span className="text-[13px] font-mono text-white/80">{vehicle.plate}</span>
          </div>
        )}

        <div>
          <p className="text-[12px] text-white/50 mb-1">
            {hasSale ? 'Lucro Final' : 'Custo até agora'}
          </p>
          <p className={cn('text-[36px] font-bold tabular-nums', hasSale ? profitColor : 'text-taquinho')}>
            {hasSale
              ? `${vehicle.profit! >= 0 ? '+' : ''}${formatBRL(vehicle.profit!)}`
              : formatBRL(vehicle.total_cost)
            }
          </p>
          {hasSale && vehicle.profit_margin !== null && (
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[12px] text-white/50">
                {vehicle.profit_margin.toFixed(1)}% de margem
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profit breakdown */}
      <Card className="mb-4">
        <p className="text-[14px] font-semibold text-ios-primary mb-4">Detalhamento</p>
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[13px] text-ios-secondary">{row.label}</span>
              <span className={cn(
                'text-[14px] tabular-nums',
                row.bold ? 'font-semibold' : 'font-medium',
                row.color
              )}>
                {row.value}
              </span>
            </div>
          ))}

          {hasSale && (
            <>
              <div className="border-t border-ios-border pt-3 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ios-primary">Lucro Líquido</span>
                <span className={cn('text-[16px] font-bold tabular-nums', profitColor)}>
                  {vehicle.profit! >= 0 ? '+' : ''}{formatBRL(vehicle.profit!)}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Info */}
      <Card className="mb-4">
        <p className="text-[14px] font-semibold text-ios-primary mb-3">Informações</p>
        <div className="space-y-2">
          <Row label="Data de Compra" value={formatDateFull(vehicle.purchase_date)} />
          {vehicle.notes && <Row label="Observações" value={vehicle.notes} />}
          {vehicle.receipt_url && (
            <div className="pt-2">
              <p className="text-[13px] text-ios-secondary mb-2">Comprovante</p>
              <a href={vehicle.receipt_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-ios-fill">
                <img src={vehicle.receipt_url} alt="Comprovante do veículo" className="h-40 w-full object-cover" />
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Transactions */}
      {vehicle.transactions.length > 0 && (
        <Card padding="none" className="mb-4">
          <p className="text-[14px] font-semibold text-ios-primary px-4 pt-4 pb-2">
            Transações ({vehicle.transactions.length})
          </p>
          <div className="px-4 pb-2 divide-y divide-ios-border/50">
            {vehicle.transactions.map(tx => (
              <TransactionItem key={tx.id} tx={tx as never} showCategory />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] text-ios-secondary flex-shrink-0">{label}</span>
      <span className="text-[13px] text-ios-primary text-right">{value}</span>
    </div>
  )
}
