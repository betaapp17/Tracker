import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import type { Transaction } from '@/lib/types'

interface Props {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: Props) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[15px] font-semibold text-ios-primary">Transações Recentes</p>
        <Link href="/transacoes" className="flex items-center gap-0.5 text-[13px] text-ios-secondary pressable">
          Ver todas <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="px-4 pb-4">
          <p className="text-[13px] text-ios-tertiary text-center py-6">
            Nenhuma transação ainda.<br />
            Toque no + para começar.
          </p>
        </div>
      ) : (
        <div className="px-4 pb-2 divide-y divide-ios-border/50">
          {transactions.map(tx => (
            <TransactionItem key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </Card>
  )
}
