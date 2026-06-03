'use client'

import { useState } from 'react'
import { FileText, Upload, X, ExternalLink } from 'lucide-react'
import { uploadReceipt } from '@/lib/receipts'
import { updateVehicleContract } from '@/lib/actions/vehicles'

interface Props {
  vehicleId: string
  contractUrl: string | null
}

export function ContractUpload({ vehicleId, contractUrl }: Props) {
  const [url, setUrl] = useState(contractUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadReceipt(file)
      await updateVehicleContract(vehicleId, uploaded)
      setUrl(uploaded)
    } catch (err) {
      setError('Erro ao enviar. Tente novamente.')
      console.error(err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemove() {
    setError(null)
    try {
      await updateVehicleContract(vehicleId, null)
      setUrl(null)
    } catch (err) {
      setError('Erro ao remover.')
      console.error(err)
    }
  }

  return (
    <div className="pt-2 space-y-2">
      <p className="text-[13px] text-ios-secondary">Contrato de Venda</p>

      {url ? (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span className="text-[13px] font-medium text-blue-700 flex-1 truncate">Contrato anexado</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm pressable"
            aria-label="Ver contrato"
          >
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </a>
          <button
            onClick={handleRemove}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm pressable"
            aria-label="Remover contrato"
          >
            <X className="w-4 h-4 text-expense" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ios-border bg-ios-fill px-4 py-3 text-[14px] font-semibold text-ios-primary pressable">
          <Upload className="h-4 w-4" />
          {uploading ? 'Enviando…' : 'Anexar Contrato PDF'}
          <input
            type="file"
            accept=".pdf,application/pdf,image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleFile}
          />
        </label>
      )}

      {error && <p className="text-[12px] text-expense">{error}</p>}
    </div>
  )
}
