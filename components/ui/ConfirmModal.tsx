'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  warning?: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  confirmLabel = 'Excluir',
  loading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center px-4 pb-8 sm:pb-0">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Icon + title */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-expense" />
            </div>
            <h2 className="text-[18px] font-bold text-ios-primary">{title}</h2>
            <p className="text-[14px] text-ios-secondary mt-2 leading-relaxed">{message}</p>
            {warning && (
              <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                <p className="text-[12px] text-orange-700 leading-relaxed">{warning}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex flex-col gap-2">
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white bg-expense pressable',
                loading && 'opacity-50'
              )}
            >
              {loading ? 'Excluindo…' : confirmLabel}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-ios-primary bg-ios-fill pressable"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
