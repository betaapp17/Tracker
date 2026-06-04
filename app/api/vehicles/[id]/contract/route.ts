import { NextRequest, NextResponse } from 'next/server'
import { deleteReceiptByPublicUrl, uploadReceipt } from '@/lib/receipts'
import { getCurrentUser } from '@/lib/auth'
import { updateVehicleContract } from '@/lib/actions/vehicles'

type RouteContext = {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const user = await getCurrentUser()

  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  let file: FormDataEntryValue | null
  try {
    const formData = await request.formData()
    file = formData.get('file')
  } catch {
    return jsonError('Arquivo inválido.', 400)
  }

  if (!(file instanceof File)) {
    return jsonError('Selecione um PDF ou imagem para anexar.', 400)
  }

  let uploadedUrl: string | null = null

  try {
    uploadedUrl = await uploadReceipt(file)
    await updateVehicleContract(id, uploadedUrl)
    return NextResponse.json({ contractUrl: uploadedUrl })
  } catch (err) {
    if (uploadedUrl) {
      await deleteReceiptByPublicUrl(uploadedUrl).catch(console.error)
    }
    return jsonError(err instanceof Error ? err.message : 'Erro ao anexar documento.', 500)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    await updateVehicleContract(id, null)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Erro ao remover documento.', 500)
  }
}
