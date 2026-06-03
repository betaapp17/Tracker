import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import type { IntegrityIssue } from '@/lib/types'

const CHECKS = [
  'Todos os veículos vendidos têm transação de venda',
  'Nenhuma venda registrada sem veículo vinculado',
  'Preços de compra preenchidos em todos os veículos',
  'Contagens de veículos e transações consistentes',
]

export function IntegrityCard({ issues }: { issues: IntegrityIssue[] }) {
  const allClear = issues.length === 0
  const hasError = issues.some(i => i.severity === 'error')

  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-4">
        {allClear
          ? <CheckCircle2 className="w-5 h-5 text-profit flex-shrink-0" />
          : hasError
            ? <AlertCircle className="w-5 h-5 text-expense flex-shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
        }
        <div>
          <p className="text-[14px] font-semibold text-ios-primary">
            {allClear ? 'Integridade dos Dados' : 'Problemas Detectados'}
          </p>
          <p className="text-[11px] text-ios-tertiary">
            {allClear
              ? '4 verificações passaram'
              : `${issues.length} problema${issues.length > 1 ? 's' : ''} encontrado${issues.length > 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {allClear ? (
        <div className="space-y-2.5">
          {CHECKS.map(check => (
            <div key={check} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-profit flex-shrink-0" />
              <span className="text-[13px] text-ios-secondary">{check}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {issues.map(issue => (
            <div
              key={issue.type}
              className={cn(
                'rounded-xl px-3.5 py-3',
                issue.severity === 'error' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
              )}
            >
              <div className="flex items-start gap-2.5">
                {issue.severity === 'error'
                  ? <AlertCircle className="w-4 h-4 text-expense flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                }
                <div className="min-w-0">
                  <p className={cn(
                    'text-[13px] font-semibold',
                    issue.severity === 'error' ? 'text-expense' : 'text-amber-700'
                  )}>
                    {issue.label}
                  </p>
                  <p className="text-[11px] text-ios-tertiary mt-0.5 leading-relaxed">{issue.detail}</p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-ios-tertiary text-center pt-1">
            Corrija os itens acima para garantir precisão nos números.
          </p>
        </div>
      )}
    </Card>
  )
}
