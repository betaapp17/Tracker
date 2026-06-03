import { requireAuth } from '@/lib/auth'
import { getVehicles, getInventoryStats } from '@/lib/actions/vehicles'
import { VehiclesContent } from '@/components/vehicles/VehiclesContent'
import { Card } from '@/components/ui/Card'
import { Car } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VeiculosPage() {
  await requireAuth()
  const [vehicles, stats] = await Promise.all([getVehicles(), getInventoryStats()])

  const inStockCount = vehicles.filter(v => v.status === 'in_stock').length
  const soldCount    = vehicles.filter(v => v.status === 'sold').length

  return (
    <div className="px-4 pt-12 pb-8 animate-page-enter">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-ios-primary">Estoque</h1>
        <p className="text-[14px] text-ios-secondary">
          {inStockCount} em estoque · {soldCount} vendidos
        </p>
      </div>

      {vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <Car className="w-10 h-10 text-ios-tertiary mx-auto mb-3" />
          <p className="text-[14px] text-ios-secondary">Nenhum veículo cadastrado.</p>
          <p className="text-[12px] text-ios-tertiary mt-1">Toque no + para adicionar.</p>
        </Card>
      ) : (
        <VehiclesContent vehicles={vehicles} stats={stats} />
      )}
    </div>
  )
}
