'use server'

import { createServiceClient, getOwnerUserId } from '@/lib/supabase/service'

const RECEIPTS_BUCKET = 'receipts'
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

const contentTypeByExt: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}

const extensionByContentType: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

function getSupportedExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (extension && contentTypeByExt[extension]) return extension

  const contentType = file.type.toLowerCase()
  const extensionFromType = extensionByContentType[contentType]
  if (extensionFromType) return extensionFromType

  throw new Error('Tipo de arquivo não suportado. Envie PDF ou imagem.')
}

function getReceiptPathFromPublicUrl(publicUrl: string) {
  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${RECEIPTS_BUCKET}/`
    const decodedPathname = decodeURIComponent(url.pathname)
    const markerIndex = decodedPathname.indexOf(marker)
    if (markerIndex === -1) return null

    const path = decodedPathname.slice(markerIndex + marker.length)
    return path || null
  } catch {
    return null
  }
}

export async function uploadReceipt(file: File): Promise<string> {
  const supabase = createServiceClient()
  const userId = getOwnerUserId()
  const extension = getSupportedExtension(file)
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Arquivo muito grande. Envie um arquivo de até 10 MB.')
  }

  // Prefer extension-derived content type because mobile browsers often send generic file.type values.
  const contentType = contentTypeByExt[extension]

  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      contentType,
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteReceiptByPublicUrl(publicUrl: string): Promise<void> {
  const path = getReceiptPathFromPublicUrl(publicUrl)
  if (!path) return

  const supabase = createServiceClient()
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}
