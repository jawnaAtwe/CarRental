// types/vehicle.types.ts

export type VehicleDB = {
  id: number;
  tenant_id: number;
  branch_id?: number | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  late_fee_day?: number | null;
  trim?: string | null;
  category?: string | null;
  price_per_day: number;
  price_per_week?: number | null;
  price_per_month?: number | null;
  price_per_year?: number | null;
  currency?: string | null;     
  currency_code?: string | null;  
  license_plate?: string | null;
  vin?: string | null;
  color?: string | null;
  image?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  mileage?: number | null;
  status: 'available' | 'rented' | 'maintenance' | 'reserved' | 'deleted';
  created_at?: string | null;
};

export type VehicleForm = {
  id?: number;
  make: string;
  model: string;
  year?: number;
  late_fee_day?: number;
  trim?: string;
  category?: string;
  price_per_day: number;
  price_per_week?: number;
  price_per_month?: number;
  price_per_year?: number;
  currency?: string;     
  currency_code?: string;  
  license_plate?: string;
  vin?: string;
  color?: string;
  image?: string | null;
  fuel_type?: string;
  transmission?: string;
  mileage?: number;
  status: VehicleDB['status'];
  branch_id?: number;
  tenant_id?: number;
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