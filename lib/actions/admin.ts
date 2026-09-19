'use server'

import { revalidatePath } from 'next/cache'
import { hashSync } from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/service'
import { requireOwner } from '@/lib/auth'
import { DEFAULT_EMPLOYEE_PERMISSIONS, PERMISSION_KEYS, type PermissionSet } from '@/lib/permissions'

function sanitizePermissions(input?: PermissionSet): PermissionSet {
  const result: PermissionSet = { ...DEFAULT_EMPLOYEE_PERMISSIONS }
  for (const key of PERMISSION_KEYS) if (key !== 'manage_employees' && typeof input?.[key] === 'boolean') result[key] = input[key]
  result.manage_employees = false
  return result
}

export async function getEmployees() {
  await requireOwner(); const supabase = createServiceClient()
  const { data, error } = await supabase.from('app_profiles').select('id, name, is_active, permissions, created_at').eq('role', 'employee').order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function addEmployee(name: string, pin: string, permissions?: PermissionSet) {
  await requireOwner()
  if (!name.trim()) throw new Error('Nome é obrigatório.')
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN deve ter 4 dígitos numéricos.')
  const supabase = createServiceClient()
  const { error } = await supabase.from('app_profiles').insert({ name: name.trim(), role: 'employee', pin_hash: hashSync(pin, 10), is_active: true, permissions: sanitizePermissions(permissions) })
  if (error) throw new Error(error.message); revalidatePath('/admin')
}

export async function updateEmployeePermissions(id: string, permissions: PermissionSet) {
  await requireOwner(); const supabase = createServiceClient()
  const { error } = await supabase.from('app_profiles').update({ permissions: sanitizePermissions(permissions), updated_at: new Date().toISOString() }).eq('id', id).eq('role', 'employee')
  if (error) throw new Error(error.message); revalidatePath('/admin')
}

export async function updateEmployeePin(id: string, newPin: string) {
  await requireOwner(); if (!/^\d{4}$/.test(newPin)) throw new Error('PIN deve ter 4 dígitos numéricos.')
  const { error } = await createServiceClient().from('app_profiles').update({ pin_hash: hashSync(newPin, 10), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message); revalidatePath('/admin')
}

export async function toggleEmployee(id: string, isActive: boolean) {
  await requireOwner(); const { error } = await createServiceClient().from('app_profiles').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id).eq('role', 'employee')
  if (error) throw new Error(error.message); revalidatePath('/admin')
}

export async function deleteEmployee(id: string) {
  await requireOwner(); const { error } = await createServiceClient().from('app_profiles').delete().eq('id', id).eq('role', 'employee')
  if (error) throw new Error(error.message); revalidatePath('/admin')
}
