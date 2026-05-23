export type RangePreset = 'month' | 'ytd' | 'custom'

export interface DateRange {
  from: string
  to: string
  preset: RangePreset
  label: string
}

export function parseDateRange(params: {
  range?: string
  from?: string
  to?: string
}): DateRange {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')

  if (params.range === 'ytd') {
    return {
      from: `${year}-01-01`,
      to: todayStr,
      preset: 'ytd',
      label: `${year} (Acumulado)`,
    }
  }

  if (params.range === 'custom' && params.from && params.to) {
    const f = new Date(params.from + 'T00:00:00')
    const t = new Date(params.to + 'T00:00:00')
    const fromLabel = f.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    const toLabel = t.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
    return {
      from: params.from,
      to: params.to,
      preset: 'custom',
      label: `${fromLabel} → ${toLabel}`,
    }
  }

  // Default: current month
  const firstDay = `${year}-${month}-01`
  const lastDay = new Date(year, today.getMonth() + 1, 0).toISOString().slice(0, 10)
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return {
    from: firstDay,
    to: lastDay,
    preset: 'month',
    label: monthName,
  }
}
