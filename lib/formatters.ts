export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatBRLCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  if (Math.abs(value) >= 1_000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return formatBRL(value)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr + '-01T00:00:00')
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function monthLabel(dateStr: string): string {
  const date = new Date(dateStr + '-01T00:00:00')
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function currentMonthISO(): string {
  return new Date().toISOString().slice(0, 7)
}

export function daysInStock(purchaseDateStr: string): number {
  const purchase = new Date(purchaseDateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDaysInStock(days: number): string {
  if (days === 0) return 'Entrou hoje'
  if (days === 1) return '1 dia em estoque'
  if (days < 30) return `${days} dias em estoque`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 mês em estoque' : `${months} meses em estoque`
}

export function paymentMethodLabel(method: string | null): string {
  const map: Record<string, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    card: 'Cartão',
    transfer: 'Transferência',
    financing: 'Financiamento',
  }
  return method ? (map[method] ?? method) : ''
}
