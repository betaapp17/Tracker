import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Returns the list of active employee names + the owner entry.
// Used by the login screen user-selector. Only names + IDs are returned (no PINs).
export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data: employees } = await supabase
      .from('app_employees')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    return NextResponse.json({
      employees: (employees ?? []).map(e => ({
        id: e.id,
        name: e.name,
        type: 'employee',
      })),
    })
  } catch {
    return NextResponse.json({ employees: [] })
  }
}
