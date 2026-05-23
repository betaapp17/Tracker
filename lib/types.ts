export type InventoryType = 'owned' | 'consigned'
export type VehicleStatus = 'in_stock' | 'sold' | 'archived'
export type TransactionType = 'expense' | 'sale' | 'vehicle_purchase' | 'adjustment'
export type PaymentMethod = 'cash' | 'pix' | 'card' | 'transfer' | 'financing'

export interface TransactionCategory {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: 'expense' | 'income'
  is_default: boolean
  created_at: string
}

export interface Vehicle {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  plate: string | null
  inventory_type: InventoryType
  purchase_price: number
  owner_payout_amount: number | null
  dealership_markup: number | null
  estimated_sale_price: number | null
  purchase_date: string
  status: VehicleStatus
  notes: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string | null
  category_id: string | null
  vehicle_id: string | null
  date: string
  payment_method: PaymentMethod | null
  notes: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
  // Joined
  category?: TransactionCategory | null
  vehicle?: Vehicle | null
}

export interface VehicleWithProfit extends Vehicle {
  sale_price: number | null
  linked_expenses: number
  total_cost: number
  profit: number | null
  profit_margin: number | null
  transactions: Transaction[]
}

export interface DashboardStats {
  gross_sales: number
  operating_expenses: number
  cars_sold: number
  gross_profit: number
  consignment_profit: number
  owned_profit: number
  avg_profit_per_car: number
  expenses_by_category: Array<{ name: string; amount: number; color: string; icon: string }>
  monthly_trend: Array<{ month: string; sales: number; expenses: number; profit: number }>
}

export interface InventoryStats {
  cars_in_stock: number
  owned_count: number
  consigned_count: number
  total_invested: number
  owned_value: number
  consigned_value: number
  total_market_value: number
  potential_profit: number
  missing_estimate_count: number
}
