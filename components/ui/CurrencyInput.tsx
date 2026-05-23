'use client'

import { Input } from '@/components/ui/Input'

interface CurrencyInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helper?: string
  error?: string
}

// Converts a raw digit string (representing centavos) to formatted BRL
// "12000000" → "120.000,00"
function centsToFormatted(digits: string): string {
  const n = parseInt(digits, 10)
  if (!digits || n === 0) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100)
}

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = '0,00',
  helper,
  error,
}: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip everything except digits, then treat as centavos integer
    const digits = e.target.value.replace(/\D/g, '').slice(0, 13)
    onChange(centsToFormatted(digits))
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-ios-secondary">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-ios-secondary">
          R$
        </span>
        <Input
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          error={error}
          helper={helper}
          onChange={handleChange}
          className="pl-11 tabular-nums"
        />
      </div>
    </div>
  )
}
