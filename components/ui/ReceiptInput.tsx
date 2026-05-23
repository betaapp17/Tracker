'use client'

import { ImagePlus, X } from 'lucide-react'

interface ReceiptInputProps {
  label?: string
  receiptUrl?: string
  file: File | null
  onFileChange: (file: File | null) => void
  onRemoveReceipt?: () => void
}

export function ReceiptInput({
  label = 'Comprovante',
  receiptUrl,
  file,
  onFileChange,
  onRemoveReceipt,
}: ReceiptInputProps) {
  const previewUrl = file ? URL.createObjectURL(file) : receiptUrl

  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-medium text-ios-secondary">
        {label}
      </label>

      {previewUrl && (
        <div className="relative overflow-hidden rounded-xl border border-ios-border bg-ios-fill">
          <img
            src={previewUrl}
            alt="Comprovante"
            className="h-36 w-full object-cover"
          />
          {(file || receiptUrl) && (
            <button
              type="button"
              onClick={() => {
                onFileChange(null)
                onRemoveReceipt?.()
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remover comprovante"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ios-border bg-ios-fill px-4 py-3 text-[14px] font-semibold text-ios-primary pressable">
        <ImagePlus className="h-4 w-4" />
        {file ? file.name : receiptUrl ? 'Trocar imagem' : 'Adicionar imagem'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={event => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
