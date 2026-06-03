'use server'

import { createServiceClient, getOwnerUserId } from '@/lib/supabase/service'

const RECEIPTS_BUCKET = 'receipts'

export async function uploadReceipt(file: File): Promise<string> {
  const supabase = createServiceClient()
  const userId = getOwnerUserId()
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`

  // Derive content type from extension when file.type is missing or wrong (common on iOS PWA)
  const contentTypeByExt: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
  }
  const contentType = file.type || contentTypeByExt[extension] || 'application/octet-stream'

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
