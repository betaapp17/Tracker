'use client'

import { Input } from '@/components/ui/Input'
import { formatCurrencyInput } from '@/lib/currency'

interface CurrencyInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helper?: string
  error?: string
}

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = '0,00',
  helper,
  error,
}: CurrencyInputProps) {
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
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          error={error}
          helper={helper}
          onChange={event => onChange(formatCurrencyInput(event.target.value))}
          className="pl-11 tabular-nums"
        />
      </div>
    </div>
  )
}
