'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  value: string
}

export function MonthFilter({ value }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <input
      type="month"
      defaultValue={value}
      className="w-full px-4 py-3 rounded-xl bg-white border border-ios-border text-[14px] text-ios-primary shadow-card focus:outline-none"
      onChange={e => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('month', e.target.value)
        router.push(`?${params.toString()}`)
      }}
    />
  )
}
