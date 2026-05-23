export function formatCurrencyInput(rawValue: string): string {
  const cleaned = rawValue.replace(/[^\d,.]/g, '')
  if (!cleaned) return ''

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  const decimalIndex = Math.max(lastComma, lastDot)
  const hasDecimal = decimalIndex >= 0

  const integerPart = hasDecimal ? cleaned.slice(0, decimalIndex) : cleaned
  const decimalPart = hasDecimal ? cleaned.slice(decimalIndex + 1).replace(/\D/g, '').slice(0, 2) : ''
  const integerDigits = integerPart.replace(/\D/g, '')
  const integerNumber = Number(integerDigits || '0')
  const formattedInteger = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(integerNumber)

  if (!hasDecimal) return formattedInteger
  return `${formattedInteger},${decimalPart}`
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '')
  if (!cleaned) return 0

  const [integerPart, decimalPart = ''] = cleaned.split(',')
  const integer = integerPart.replace(/\D/g, '') || '0'
  const decimal = decimalPart.replace(/\D/g, '').slice(0, 2)
  return Number(`${integer}.${decimal || '0'}`)
}

export function currencyInputFromNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric === 0) return ''

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)
}
