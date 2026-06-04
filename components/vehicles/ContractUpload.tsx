'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, X, Eye, RefreshCw, Image } from 'lucide-react'

const ACCEPTED_DOCUMENT_TYPES = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,application/pdf,image/*'

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

  async function readApiError(response: Response, fallback: string) {
    try {
      const body = await response.json()
      return typeof body.error === 'string' ? body.error : fallback
    } catch {
      return fallback
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/contract`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Erro ao enviar. Tente novamente.'))
      }

      const body = await response.json()
      if (typeof body.contractUrl !== 'string') {
        throw new Error('Resposta inválida ao anexar documento.')
      }

      setUrl(body.contractUrl)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.')
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
      const response = await fetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/contract`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Erro ao remover.'))
      }

      setUrl(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
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
  const isImage = url ? /\.(jpe?g|png|gif|webp|heic|heif)(\?|$)/i.test(url) : false
  const isPdf = url ? /\.pdf(\?|$)/i.test(url) : false

  return (
    <div className="pt-2 space-y-2">
      <p className="text-[13px] text-ios-secondary">Documento da Venda</p>

      {url ? (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            {isImage
              ? <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
              : <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            <span className="text-[13px] font-medium text-blue-700 flex-1 truncate">
              {isImage ? 'Imagem anexada' : isPdf ? 'PDF anexado' : 'Documento anexado'}
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
              disabled={uploading || removing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold pressable disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              Ver arquivo
            </button>
            <label className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 text-[13px] font-medium pressable cursor-pointer ${uploading || removing ? 'opacity-50 pointer-events-none' : ''}`}>
              <RefreshCw className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
              {uploading ? 'Enviando...' : 'Trocar'}
              <input
                type="file"
                accept={ACCEPTED_DOCUMENT_TYPES}
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
          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-4 text-[14px] font-semibold text-blue-600 ${uploading ? 'opacity-60 pointer-events-none' : 'pressable'}`}>
            <FileText className="h-5 w-5" />
            {uploading ? 'Enviando...' : 'Anexar documento'}
            <input
              type="file"
              accept={ACCEPTED_DOCUMENT_TYPES}
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
