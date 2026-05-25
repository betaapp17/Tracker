'use server'

import { revalidatePath } from 'next/cache'
import { hashSync } from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/service'
import { requireOwner } from '@/lib/auth'

export async function getEmployees() {
  await requireOwner()
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('app_employees')
    .select('id, name, is_active, created_at')
    .order('name')
  return data ?? []
}

export async function addEmployee(name: string, pin: string) {
  await requireOwner()

  if (!name.trim()) throw new Error('Nome é obrigatório.')
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN deve ter 4 dígitos numéricos.')

  const pinHash = hashSync(pin, 10)
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('app_employees')
    .insert({ name: name.trim(), pin_hash: pinHash, is_active: true })

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateEmployeePin(id: string, newPin: string) {
  await requireOwner()

  if (!/^\d{4}$/.test(newPin)) throw new Error('PIN deve ter 4 dígitos numéricos.')

  const pinHash = hashSync(newPin, 10)
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('app_employees')
    .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function toggleEmployee(id: string, isActive: boolean) {
  await requireOwner()

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('app_employees')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function deleteEmployee(id: string) {
  await requireOwner()

  const supabase = createServiceClient()
  const { error } = await supabase.from('app_employees').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateOwnerPin(currentPin: string, newPin: string) {
  await requireOwner()

  if (!/^\d{4}$/.test(newPin)) throw new Error('Novo PIN deve ter 4 dígitos numéricos.')

  // Verify current PIN before changing
  const { compareSync } = await import('bcryptjs')
  const ownerHash = process.env.OWNER_PIN_HASH
  if (!ownerHash || !compareSync(currentPin, ownerHash)) {
    throw new Error('PIN atual incorreto.')
  }

  const newHash = hashSync(newPin, 10)
  // In production, OWNER_PIN_HASH would be updated via environment variable management.
  // We can't update process.env at runtime — return the new hash for the user to update .env.local.
  return { newHash }
}
