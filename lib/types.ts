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
  purchase_price: number
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
  net_profit: number
  gross_sales: number
  total_expenses: number
  cars_sold: number
  avg_profit_per_car: number
  expenses_by_category: Array<{ name: string; amount: number; color: string; icon: string }>
  monthly_trend: Array<{ month: string; sales: number; expenses: number; profit: number }>
}
