import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { getTransactions } from '@/lib/actions/transactions'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { Card } from '@/components/ui/Card'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { TypeFilter } from '@/components/ui/TypeFilter'
import { parseDateRange } from '@/lib/dateRange'

export const dynamic = 'force-dynamic'

interface SearchParams {
  range?: string
  from?: string
  to?: string
  type?: string
}

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAuth()
  const params = await searchParams
  const dateRange = parseDateRange(params)
  const type = params.type as never

  const { data: transactions } = await getTransactions({
    from: dateRange.from,
    to: dateRange.to,
    type,
    limit: 100,
  })

  const byDate = transactions.reduce<Record<string, typeof transactions>>((acc, tx) => {
    const key = tx.date
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-4 pt-12 animate-page-enter">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-ios-primary">Transações</h1>
        <p className="text-[14px] text-ios-secondary capitalize">{dateRange.label}</p>
      </div>

      <div className="mb-3">
        <Suspense fallback={null}>
          <DateRangeFilter preset={dateRange.preset} from={dateRange.from} to={dateRange.to} />
        </Suspense>
      </div>

      <div className="mb-4">
        <Suspense fallback={null}>
          <TypeFilter current={params.type} />
        </Suspense>
      </div>

      {sortedDates.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[14px] text-ios-secondary">Nenhuma transação neste período.</p>
          <p className="text-[12px] text-ios-tertiary mt-1">Toque no + para adicionar.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long'
            })
            return (
              <div key={date}>
                <p className="text-[11px] font-semibold text-ios-secondary uppercase tracking-wider mb-2 capitalize">
                  {dateLabel}
                </p>
                <Card padding="none">
                  <div className="px-4 divide-y divide-ios-border/50">
                    {byDate[date].map(tx => (
                      <TransactionItem key={tx.id} tx={tx as never} />
                    ))}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
