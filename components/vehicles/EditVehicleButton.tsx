'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { EditVehicleSheet } from '@/components/vehicles/EditVehicleSheet'
import type { VehicleWithProfit } from '@/lib/types'

export function EditVehicleButton({ vehicle }: { vehicle: VehicleWithProfit }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[13px] font-semibold text-white pressable"
      >
        <Pencil className="h-4 w-4" />
        Editar
      </button>
      <EditVehicleSheet
        vehicle={vehicle}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
