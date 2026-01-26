// types/payment.types.ts

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  paid_amount?: number;
  partial_amount?: number;
  status: PaymentStatus;
  created_at: string;
}

export interface BookingDB {
  id: number;
  tenant_id: number;
  branch_id?: number | null;
  customer_id: number;
  customer_name: string;
  vehicle_id: number;
  vehicle_name?: string | null;
  late_fee_day?: number | null;
  start_date: string;
  end_date: string;
  total_amount: number;
  currency_code: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  branch_name?: string | null;
  branch_name_ar?: string | null;
  created_at?: string | null;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: "user" | "customer";
  roles: string[];
  permissions: string[];
  tenantId: number;
  roleId: number;
}

export interface Tenant {
  id: number;
  name: string;
}