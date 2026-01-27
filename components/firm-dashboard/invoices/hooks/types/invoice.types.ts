export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'partially_paid';

export type InvoiceDB = {
  id: number;
  tenant_id: number;
  booking_id: number;
  customer_id: number;
  invoice_number: string;
  status: InvoiceStatus;
  invoice_date: string;
  due_date?: string | null;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  currency_code: string;
  notes?: string | null;
  is_auto_generated: number;
  created_at?: string | null;
  updated_at?: string | null;
  // Relations
  booking_status?: string;
  customer_name?: string;
  vehicle_name?: string;
};
export type InvoiceForm = {
  id?: number;
  booking_id?: number;
  customer_id?: number;
  subtotal?: number;
  status?: InvoiceStatus;       
  vat_rate?: number;
  currency_code?: string;
  notes?: string | null;
  tenant_id?: number;
};
export type Booking = {
  id: number;
  customer_name?: string;
    customer_id?: number;
  vehicle_name?: string;
  
};
