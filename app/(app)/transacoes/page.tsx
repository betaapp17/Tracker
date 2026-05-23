import { Suspense } from 'react'
import { getTransactions } from '@/lib/actions/transactions'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { currentMonthISO } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { MonthFilter } from '@/components/ui/MonthFilter'

export const dynamic = 'force-dynamic'

interface SearchParams {
  month?: string
  type?: string
}

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const month = params.month ?? currentMonthISO()
  const type = params.type as never

  const { data: transactions } = await getTransactions({ month, type, limit: 50 })

  const byDate = transactions.reduce<Record<string, typeof transactions>>((acc, tx) => {
    const key = tx.date
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  const monthOpt = new Date(month + '-02')
  const monthDisplay = monthOpt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="px-4 pt-12">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-ios-primary">Transações</h1>
        <p className="text-[14px] text-ios-secondary capitalize">{monthDisplay}</p>
      </div>

      {/* Month filter */}
      <div className="mb-4">
        <Suspense fallback={null}>
          <MonthFilter value={month} />
        </Suspense>
      </div>

      {sortedDates.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[14px] text-ios-secondary">Nenhuma transação este mês.</p>
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
