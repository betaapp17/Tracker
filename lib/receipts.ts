'use server'

import { createServiceClient, getOwnerUserId } from '@/lib/supabase/service'

const RECEIPTS_BUCKET = 'receipts'

export async function uploadReceipt(file: File): Promise<string> {
  const supabase = createServiceClient()
  const userId = getOwnerUserId()
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
