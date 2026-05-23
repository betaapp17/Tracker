import Link from 'next/link'
import { getVehicles } from '@/lib/actions/vehicles'
import { formatBRL, formatDate } from '@/lib/formatters'
import { Car, ChevronRight, Package, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const statusConfig = {
  in_stock: { label: 'Em Estoque', color: 'text-profit', bg: 'bg-green-50', icon: Package },
  sold:     { label: 'Vendido',    color: 'text-ios-secondary', bg: 'bg-gray-100', icon: CheckCircle },
  archived: { label: 'Arquivado', color: 'text-ios-tertiary',  bg: 'bg-gray-100', icon: Car },
}

export default async function VeiculosPage() {
  const vehicles = await getVehicles()

  const inStock = vehicles.filter(v => v.status === 'in_stock')
  const sold    = vehicles.filter(v => v.status === 'sold')

  return (
    <div className="px-4 pt-12">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-ios-primary">Veículos</h1>
        <p className="text-[14px] text-ios-secondary">{inStock.length} em estoque · {sold.length} vendidos</p>
      </div>

      {vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <Car className="w-10 h-10 text-ios-tertiary mx-auto mb-3" />
          <p className="text-[14px] text-ios-secondary">Nenhum veículo cadastrado.</p>
          <p className="text-[12px] text-ios-tertiary mt-1">Toque no + para adicionar.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {inStock.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold text-ios-secondary uppercase tracking-wider mb-2">
                Em Estoque ({inStock.length})
              </p>
              <Card padding="none">
                <div className="divide-y divide-ios-border/50">
                  {inStock.map(v => <VehicleRow key={v.id} vehicle={v} />)}
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

function VehicleRow({ vehicle }: { vehicle: Awaited<ReturnType<typeof getVehicles>>[0] }) {
  const cfg = statusConfig[vehicle.status as keyof typeof statusConfig] ?? statusConfig.in_stock
  const StatusIcon = cfg.icon

  return (
    <Link href={`/veiculos/${vehicle.id}`} className="flex items-center gap-3 px-4 py-3.5 pressable">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
        <StatusIcon className={cn('w-5 h-5', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-ios-primary">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {vehicle.plate && (
            <span className="text-[11px] text-ios-tertiary">{vehicle.plate} ·</span>
          )}
          <span className="text-[11px] text-ios-tertiary">
            Comprado {formatDate(vehicle.purchase_date)}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[13px] font-medium text-ios-primary tabular-nums">
          {formatBRL(vehicle.purchase_price)}
        </p>
        <span className={cn('text-[11px] font-medium', cfg.color)}>{cfg.label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-ios-tertiary flex-shrink-0" />
    </Link>
  )
}
