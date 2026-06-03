'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, ArrowUpDown, Car, ChevronRight, Package, CheckCircle, TrendingUp, Wallet, Handshake, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatBRL, formatBRLCompact, formatDate, daysInStock, formatDaysInStock } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Vehicle, InventoryStats } from '@/lib/types'

type StatusFilter = 'all' | 'in_stock' | 'sold'
type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low'

const statusConfig = {
  in_stock: { label: 'Em Estoque', color: 'text-profit',         bg: 'bg-green-50',  icon: Package      },
  sold:     { label: 'Vendido',    color: 'text-ios-secondary',  bg: 'bg-gray-100',  icon: CheckCircle  },
  archived: { label: 'Arquivado', color: 'text-ios-tertiary',   bg: 'bg-gray-100',  icon: Car          },
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Mais recentes'  },
  { value: 'oldest',     label: 'Mais antigos'   },
  { value: 'price_high', label: 'Maior preço'    },
  { value: 'price_low',  label: 'Menor preço'    },
]

const sortLabel: Record<SortOption, string> = {
  newest:     'Recentes',
  oldest:     'Antigos',
  price_high: 'Maior preço',
  price_low:  'Menor preço',
}

function getPrice(v: Vehicle): number {
  return v.inventory_type === 'consigned'
    ? (v.owner_payout_amount ?? 0)
    : v.purchase_price
}

interface Props {
  vehicles: Vehicle[]
  stats: InventoryStats
}

export function VehiclesContent({ vehicles, stats }: Props) {
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort]                 = useState<SortOption>('newest')
  const [showSort, setShowSort]         = useState(false)

  const filtered = useMemo(() => {
    let result = [...vehicles]

    if (search.trim()) {
      const q = search.toLowerCase().trim().replace(/-/g, '')
      result = result.filter(v =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        String(v.year).includes(q) ||
        (v.plate?.toLowerCase().replace(/-/g, '').includes(q) ?? false)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter)
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'newest':     return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':     return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price_high': return getPrice(b) - getPrice(a)
        case 'price_low':  return getPrice(a) - getPrice(b)
      }
    })

    return result
  }, [vehicles, search, statusFilter, sort])

  const isFiltered = search.trim() !== '' || statusFilter !== 'all'

  const inStock        = filtered.filter(v => v.status === 'in_stock')
  const sold           = filtered.filter(v => v.status === 'sold')
  const ownedStock     = inStock.filter(v => (v.inventory_type ?? 'owned') === 'owned')
  const consignedStock = inStock.filter(v => v.inventory_type === 'consigned')

  const originalInStock = vehicles.filter(v => v.status === 'in_stock')

  return (
    <div>
      {originalInStock.length > 0 && <InventoryStatsCard stats={stats} />}

      {/* Search bar */}
      <div className="relative mt-4 mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-tertiary pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar marca, modelo, placa, ano..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-ios-fill rounded-xl text-[14px] text-ios-primary placeholder:text-ios-tertiary border border-ios-border focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 pressable"
          >
            <X className="w-4 h-4 text-ios-tertiary" />
          </button>
        )}
      </div>

      {/* Filter + sort row */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none pb-0.5">
        {(['all', 'in_stock', 'sold'] as StatusFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors',
              statusFilter === s
                ? 'bg-ios-primary text-white'
                : 'bg-ios-fill text-ios-secondary border border-ios-border'
            )}
          >
            {s === 'all' ? 'Todos' : s === 'in_stock' ? 'Em Estoque' : 'Vendidos'}
          </button>
        ))}

        <button
          onClick={() => setShowSort(v => !v)}
          className={cn(
            'flex-shrink-0 ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors',
            sort !== 'newest' || showSort
              ? 'bg-ios-primary text-white border-ios-primary'
              : 'bg-ios-fill text-ios-secondary border-ios-border'
          )}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortLabel[sort]}
        </button>
      </div>

      {/* Sort dropdown */}
      {showSort && (
        <Card padding="none" className="mb-4 overflow-hidden">
          {sortOptions.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setShowSort(false) }}
              className={cn(
                'w-full px-4 py-3 text-left text-[14px] flex items-center justify-between pressable',
                i > 0 && 'border-t border-ios-border/50',
                sort === opt.value ? 'text-ios-primary font-semibold' : 'text-ios-primary'
              )}
            >
              {opt.label}
              {sort === opt.value && <Check className="w-4 h-4 text-ios-primary" />}
            </button>
          ))}
        </Card>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Search className="w-10 h-10 text-ios-tertiary mx-auto mb-3" />
          <p className="text-[14px] text-ios-secondary">Nenhum veículo encontrado.</p>
          {search && (
            <button onClick={() => setSearch('')} className="text-[13px] text-ios-primary mt-2 pressable">
              Limpar busca
            </button>
          )}
        </Card>
      ) : isFiltered ? (
        <Card padding="none">
          <div className="divide-y divide-ios-border/50">
            {filtered.map(v => <VehicleRow key={v.id} vehicle={v} />)}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
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

function VehicleRow({ vehicle: v }: { vehicle: Vehicle }) {
  const cfg = statusConfig[v.status as keyof typeof statusConfig] ?? statusConfig.in_stock
  const StatusIcon = cfg.icon
  const isConsigned = v.inventory_type === 'consigned'
  const inStock     = v.status === 'in_stock'

  const displayPrice = isConsigned ? (v.owner_payout_amount ?? 0) : v.purchase_price
  const days      = inStock ? daysInStock(v.purchase_date) : null
  const daysLabel = days !== null ? formatDaysInStock(days) : null
  const daysColor = days !== null && days >= 60 ? 'text-orange-500' : 'text-ios-tertiary'

  return (
    <Link href={`/veiculos/${v.id}`} className="flex items-center gap-3 px-4 py-3.5 pressable">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
        <StatusIcon className={cn('w-5 h-5', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-semibold text-ios-primary truncate">
            {v.year} {v.make} {v.model}
          </p>
          {isConsigned && (
            <span className="flex-shrink-0 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
              Cons.
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {v.plate && (
            <span className="text-[11px] text-ios-tertiary">{v.plate} ·</span>
          )}
          {daysLabel ? (
            <span className={cn('text-[11px] font-medium', daysColor)}>{daysLabel}</span>
          ) : (
            <span className="text-[11px] text-ios-tertiary">
              Vendido {formatDate(v.purchase_date)}
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

function InventoryStatsCard({ stats }: { stats: InventoryStats }) {
  return (
    <div className="mb-1 space-y-3">
      <div className="bg-ios-primary rounded-3xl px-6 py-5 text-white">
        <p className="text-[12px] font-medium text-white/50 uppercase tracking-wider mb-1">
          Valor do Estoque
        </p>
        <p className="text-[38px] font-bold tabular-nums leading-none text-taquinho">
          {formatBRL(stats.total_market_value)}
        </p>
        <p className="text-[13px] text-white/50 mt-2">
          {stats.cars_in_stock} {stats.cars_in_stock === 1 ? 'carro' : 'carros'} em estoque
          {stats.missing_estimate_count > 0 && (
            <span className="text-orange-300">
              {' '}· {stats.missing_estimate_count} sem preço estimado
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="space-y-1.5">
          <div className="w-7 h-7 bg-blue-50 rounded-xl flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[15px] font-bold tabular-nums text-ios-primary leading-tight">
            {formatBRLCompact(stats.total_invested)}
          </p>
          <p className="text-[10px] text-ios-tertiary leading-tight">Capital investido</p>
        </Card>

        <Card padding="sm" className="space-y-1.5">
          <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center', stats.potential_profit >= 0 ? 'bg-green-50' : 'bg-red-50')}>
            <TrendingUp className={cn('w-3.5 h-3.5', stats.potential_profit >= 0 ? 'text-profit' : 'text-expense')} />
          </div>
          <p className={cn('text-[15px] font-bold tabular-nums leading-tight', stats.potential_profit >= 0 ? 'text-profit' : 'text-expense')}>
            {stats.potential_profit >= 0 ? '+' : ''}{formatBRLCompact(stats.potential_profit)}
          </p>
          <p className="text-[10px] text-ios-tertiary leading-tight">Lucro potencial</p>
        </Card>

        <Card padding="sm" className="space-y-1.5">
          <div className="w-7 h-7 bg-amber-50 rounded-xl flex items-center justify-center">
            <Handshake className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-[15px] font-bold tabular-nums text-ios-primary leading-tight">
            {stats.consigned_count}
          </p>
          <p className="text-[10px] text-ios-tertiary leading-tight">Consignados</p>
        </Card>
      </div>
    </div>
  )
}
