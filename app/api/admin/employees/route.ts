import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const session = await getSession()
  if (!session.loggedIn || session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('app_employees')
    .select('id, name, is_active, created_at')
    .order('name')
  return NextResponse.json({ employees: data ?? [] })
}
