import type { UserRole } from './session'

export const PERMISSIONS = {
  view_financials:     (role: UserRole) => role === 'owner',
  view_reports:        (role: UserRole) => role === 'owner',
  delete_transactions: (role: UserRole) => role === 'owner',
  delete_vehicles:     (role: UserRole) => role === 'owner',
  edit_transactions:   (_role: UserRole) => true,
  edit_vehicles:       (_role: UserRole) => true,
  manage_employees:    (role: UserRole) => role === 'owner',
  view_vehicle_profit: (role: UserRole) => role === 'owner',
} as const

export function can(role: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission](role)
}
