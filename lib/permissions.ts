export type UserRole = 'owner' | 'employee'

export const PERMISSION_KEYS = [
  'view_dashboard', 'view_financials', 'view_vehicles', 'add_vehicles', 'edit_vehicles',
  'delete_vehicles', 'view_vehicle_profit', 'view_transactions', 'add_expenses', 'record_sales',
  'edit_transactions', 'delete_transactions', 'view_reports', 'manage_documents', 'manage_employees',
] as const

export type Permission = typeof PERMISSION_KEYS[number]
export type PermissionSet = Partial<Record<Permission, boolean>>

export const DEFAULT_EMPLOYEE_PERMISSIONS: PermissionSet = {
  view_dashboard: true,
  view_financials: false,
  view_vehicles: true,
  add_vehicles: true,
  edit_vehicles: true,
  delete_vehicles: false,
  view_vehicle_profit: false,
  view_transactions: true,
  add_expenses: true,
  record_sales: true,
  edit_transactions: true,
  delete_transactions: false,
  view_reports: false,
  manage_documents: true,
  manage_employees: false,
}

export function can(role: UserRole, permission: Permission, permissions?: PermissionSet | null): boolean {
  if (role === 'owner') return true
  return permissions?.[permission] ?? DEFAULT_EMPLOYEE_PERMISSIONS[permission] ?? false
}
