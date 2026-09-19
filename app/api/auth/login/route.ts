import { NextRequest, NextResponse } from 'next/server'
import { compareSync } from 'bcryptjs'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/session'
import type { SessionData } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import { DEFAULT_EMPLOYEE_PERMISSIONS, type PermissionSet } from '@/lib/permissions'
import { getOwnerUserId } from '@/lib/supabase/service'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return { allowed: true }
  }
  if (entry.count >= 5) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Muitas tentativas incorretas. Aguarde ${rateCheck.retryAfter}s.` },
      { status: 429 }
    )
  }

  let body: { userId?: unknown; pin?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const { userId, pin } = body
  if (typeof userId !== 'string' || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  let role: 'owner' | 'employee'
  let name: string
  let resolvedUserId: string
  let permissions: PermissionSet = {}

  try {
    const supabase = createServiceClient()
    const { data: profile, error } = await supabase
      .from('app_profiles')
      .select('id, name, role, pin_hash, is_active, permissions')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!profile || !profile.is_active || !compareSync(pin, profile.pin_hash)) {
      return NextResponse.json({ error: 'PIN incorreto.' }, { status: 401 })
    }

    role = profile.role as 'owner' | 'employee'
    name = profile.name
    // Business records remain owned by the established Supabase owner account.
    resolvedUserId = role === 'owner' ? getOwnerUserId() : profile.id
    permissions = role === 'employee'
      ? { ...DEFAULT_EMPLOYEE_PERMISSIONS, ...(profile.permissions ?? {}) }
      : {}
  } catch {
    return NextResponse.json({ error: 'Sistema de autenticação indisponível.' }, { status: 503 })
  }

  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.loggedIn = true
  session.role = role
  session.userId = resolvedUserId
  session.name = name
  session.permissions = permissions
  session.lastActivity = Date.now()
  await session.save()

  return NextResponse.json({ ok: true })
}
