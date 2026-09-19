import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Only public profile metadata is returned. PIN hashes never leave the server.
export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data: profiles, error } = await supabase
      .from('app_profiles')
      .select('id, name, role')
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    return NextResponse.json({
      profiles: (profiles ?? []).map(profile => ({
        id: profile.id,
        name: profile.name,
        type: profile.role,
      })),
    })
  } catch {
    // Do not disguise an infrastructure failure as an empty profile list.
    return NextResponse.json({ error: 'Não foi possível carregar os perfis.' }, { status: 503 })
  }
}
