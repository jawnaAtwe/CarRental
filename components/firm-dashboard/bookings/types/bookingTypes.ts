// ------------------- Booking Types -------------------

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type BookingDB = {
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
  status: BookingStatus;
  branch_name?: string | null;   
  branch_name_ar?: string | null;
  created_at?: string | null;
};

export type BookingForm = {
  id?: number;
  tenant_id?: number;
  branch_id?: number;
  customer_id?: number; 
  late_fee_day?: number;
  vehicle_id?: number; 
  currency_code?: string; 
  start_date: string;
  vehicle_name?: string; 
  end_date: string;
  total_amount: number;
  status?: BookingStatus; 
};

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

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online';

export interface PaymentData {
  booking_id: number;
  amount: number;
  customer_id: number;
  payment_method: PaymentMethod;
  is_deposit: boolean;
  partial_amount: number;
  late_fee: number;
  split_details: string;
}

export interface Branch {
  id: number;
  name: string;
  name_ar: string;
}

export interface Customer {
  id: number;
  full_name: string;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
}

export interface Tenant {
  id: number;
  name: string;
}