import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getVehicles, getInventoryStats } from '@/lib/actions/vehicles'
import { formatBRL, formatDate, daysInStock, formatDaysInStock } from '@/lib/formatters'
import { Car, ChevronRight, Package, CheckCircle, TrendingUp, Wallet, Handshake, Key } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { InventoryStats } from '@/lib/types'

export const dynamic = 'force-dynamic'

const statusConfig = {
  in_stock: { label: 'Em Estoque', color: 'text-profit', bg: 'bg-green-50', icon: Package },
  sold:     { label: 'Vendido',    color: 'text-ios-secondary', bg: 'bg-gray-100', icon: CheckCircle },
  archived: { label: 'Arquivado', color: 'text-ios-tertiary',  bg: 'bg-gray-100', icon: Car },
}

export default async function VeiculosPage() {
  await requireAuth()
  const [vehicles, stats] = await Promise.all([getVehicles(), getInventoryStats()])

  const inStock  = vehicles.filter(v => v.status === 'in_stock')
  const sold     = vehicles.filter(v => v.status === 'sold')
  const ownedStock     = inStock.filter(v => (v.inventory_type ?? 'owned') === 'owned')
  const consignedStock = inStock.filter(v => v.inventory_type === 'consigned')

  return (
    <div className="px-4 pt-12">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-ios-primary">Estoque</h1>
        <p className="text-[14px] text-ios-secondary">
          {inStock.length} em estoque · {sold.length} vendidos
        </p>
      </div>

      {/* Inventory Stats */}
      {inStock.length > 0 && <InventoryStatsCard stats={stats} />}

      {vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <Car className="w-10 h-10 text-ios-tertiary mx-auto mb-3" />
          <p className="text-[14px] text-ios-secondary">Nenhum veículo cadastrado.</p>
          <p className="text-[12px] text-ios-tertiary mt-1">Toque no + para adicionar.</p>
        </Card>
      ) : (
        <div className="space-y-6 mt-4">
          {ownedStock.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold text-ios-secondary uppercase tracking-wider mb-2">
                Próprios em Estoque ({ownedStock.length})
              </p>
              <Card padding="none">
                <div className="divide-y divide-ios-border/50">
                  {ownedStock.map(v => <VehicleRow key={v.id} vehicle={v} />)}
                </div>
              </Card>
            </section>
          )}

          {consignedStock.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold text-ios-secondary uppercase tracking-wider mb-2">
                Consignados em Estoque ({consignedStock.length})
              </p>
              <Card padding="none">
                <div className="divide-y divide-ios-border/50">
                  {consignedStock.map(v => <VehicleRow key={v.id} vehicle={v} />)}
                </div>
              </Card>
            </section>
          )}

          {sold.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold text-ios-secondary uppercase tracking-wider mb-2">
                Vendidos ({sold.length})
              </p>
              <Card padding="none">
                <div className="divide-y divide-ios-border/50">
                  {sold.map(v => <VehicleRow key={v.id} vehicle={v} />)}
                </div>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function InventoryStatsCard({ stats }: { stats: InventoryStats }) {
  return (
    <Card className="mb-1">
      <p className="text-[14px] font-semibold text-ios-primary mb-4">Resumo do Estoque</p>
      <div className="grid grid-cols-2 gap-3">
        <StatItem
          icon={Wallet}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Capital Investido"
          value={formatBRL(stats.total_invested)}
        />
        <StatItem
          icon={TrendingUp}
          iconBg="bg-green-50"
          iconColor="text-profit"
          label="Lucro Potencial"
          value={formatBRL(stats.potential_profit)}
          valueColor={stats.potential_profit >= 0 ? 'text-profit' : 'text-expense'}
        />
        <StatItem
          icon={Key}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label={`Próprios (${stats.owned_count})`}
          value={formatBRL(stats.owned_value)}
        />
        <StatItem
          icon={Handshake}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label={`Consignados (${stats.consigned_count})`}
          value={formatBRL(stats.consigned_value)}
          valueNote="repasse"
        />
      </div>
    </Card>
  )
}

function StatItem({
  icon: Icon, iconBg, iconColor, label, value, valueColor, valueNote,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  label: string
  value: string
  valueColor?: string
  valueNote?: string
}) {
  return (
    <div className="bg-ios-fill rounded-2xl p-3">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', iconBg)}>
        <Icon className={cn('w-4 h-4', iconColor)} />
      </div>
      <p className={cn('text-[15px] font-bold tabular-nums leading-tight', valueColor ?? 'text-ios-primary')}>
        {value}
      </p>
      {valueNote && (
        <p className="text-[10px] text-ios-tertiary">{valueNote}</p>
      )}
      <p className="text-[11px] text-ios-secondary mt-0.5">{label}</p>
    </div>
  )
}

function VehicleRow({ vehicle }: { vehicle: Awaited<ReturnType<typeof getVehicles>>[0] }) {
  const cfg = statusConfig[vehicle.status as keyof typeof statusConfig] ?? statusConfig.in_stock
  const StatusIcon = cfg.icon
  const isConsigned = vehicle.inventory_type === 'consigned'
  const inStock = vehicle.status === 'in_stock'

  const displayPrice = isConsigned
    ? (vehicle.owner_payout_amount ?? 0)
    : vehicle.purchase_price

  const days = inStock ? daysInStock(vehicle.purchase_date) : null
  const daysLabel = days !== null ? formatDaysInStock(days) : null
  const daysColor = days !== null && days >= 60 ? 'text-orange-500' : 'text-ios-tertiary'

  return (
    <Link href={`/veiculos/${vehicle.id}`} className="flex items-center gap-3 px-4 py-3.5 pressable">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
        <StatusIcon className={cn('w-5 h-5', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-semibold text-ios-primary">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          {isConsigned && (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
              Cons.
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {vehicle.plate && (
            <span className="text-[11px] text-ios-tertiary">{vehicle.plate} ·</span>
          )}
          {daysLabel ? (
            <span className={cn('text-[11px] font-medium', daysColor)}>{daysLabel}</span>
          ) : (
            <span className="text-[11px] text-ios-tertiary">
              Vendido {formatDate(vehicle.purchase_date)}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[13px] font-medium text-ios-primary tabular-nums">
          {formatBRL(displayPrice)}
        </p>
        <span className={cn('text-[11px] font-medium', cfg.color)}>{cfg.label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-ios-tertiary flex-shrink-0" />
    </Link>
  )
}
