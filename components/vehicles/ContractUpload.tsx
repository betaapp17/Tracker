'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, X, Eye, RefreshCw, Image } from 'lucide-react'
import { uploadReceipt } from '@/lib/receipts'
import { updateVehicleContract } from '@/lib/actions/vehicles'

interface Props {
  vehicleId: string
  contractUrl: string | null
}

export function ContractUpload({ vehicleId, contractUrl }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState(contractUrl)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
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
      router.refresh()
    } catch (err) {
      setError('Erro ao enviar. Tente novamente.')
      console.error(err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemove() {
    if (removing) return
    setRemoving(true)
    setError(null)
    try {
      await updateVehicleContract(vehicleId, null)
      setUrl(null)
      router.refresh()
    } catch (err) {
      setError('Erro ao remover.')
      console.error(err)
    } finally {
      setRemoving(false)
    }
  }

  function handleView() {
    if (!url) return
    // window.open works reliably in iOS PWA standalone mode; <a target="_blank"> does not
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Detect if current contract is an image (not a PDF) so we can show a preview
  const isImage = url ? /\.(jpe?g|png|gif|webp|heic)(\?|$)/i.test(url) : false

  return (
    <div className="pt-2 space-y-2">
      <p className="text-[13px] text-ios-secondary">Contrato de Venda</p>

      {url ? (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            {isImage
              ? <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
              : <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            <span className="text-[13px] font-medium text-blue-700 flex-1 truncate">
              {isImage ? 'Imagem anexada' : 'Contrato anexado'}
            </span>
          </div>

          {isImage && (
            <div className="overflow-hidden rounded-lg">
              <img src={url} alt="Contrato" className="w-full h-32 object-cover" />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold pressable"
            >
              <Eye className="w-4 h-4" />
              Ver Arquivo
            </button>
            <label className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 text-[13px] font-medium pressable cursor-pointer ${uploading || removing ? 'opacity-50 pointer-events-none' : ''}`}>
              <RefreshCw className="w-3.5 h-3.5" />
              Trocar
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                className="hidden"
                disabled={uploading || removing}
                onChange={handleFile}
              />
            </label>
            <button
              onClick={handleRemove}
              disabled={removing || uploading}
              className="flex items-center justify-center w-10 rounded-xl bg-white border border-red-100 text-expense pressable disabled:opacity-50"
              aria-label="Remover contrato"
            >
              {removing
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <X className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-4 text-[14px] font-semibold text-blue-600 ${uploading ? 'opacity-60' : 'pressable'}`}>
            <FileText className="h-5 w-5" />
            {uploading ? 'Enviando…' : 'Anexar Contrato (PDF)'}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={handleFile}
            />
          </label>

          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ios-border bg-ios-fill px-4 py-3 text-[13px] font-medium text-ios-secondary ${uploading ? 'opacity-60' : 'pressable'}`}>
            <Upload className="h-4 w-4" />
            {uploading ? 'Enviando…' : 'Ou anexar como imagem (foto do contrato)'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleFile}
            />
          </label>
        </div>
      )}

      {error && <p className="text-[12px] text-expense">{error}</p>}
    </div>
  )
}
