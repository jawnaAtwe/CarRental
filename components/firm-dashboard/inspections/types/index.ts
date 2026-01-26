// ==================== Session Types ====================
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

// ==================== Inspection Types ====================
export type InspectionDB = {
  id: number;
  booking_id: number;
  vehicle_id: number;
  vehicle_name: string;
  inspection_type: 'pre_rental' | 'post_rental';
  inspection_date: string;
  inspected_by?: number | null;
  odometer?: number | null;
  fuel_level?: number | null;
  checklist_results?: any | null;
  notes?: string | null;
  status: 'pending' | 'completed';
  created_at?: string;
  updated_at?: string;
  inspected_by_name_ar?: string;
  inspected_by_name?: string;
  customer_name?: string;
};

export type InspectionForm = {
  id?: number;
  booking_id: number;
  vehicle_id: number;
  vehicle_name: string;
  inspection_type: 'pre_rental' | 'post_rental';
  inspection_date?: string;
  inspected_by?: number;
  odometer?: number;
  fuel_level?: number;
  checklist_results?: any;
  notes?: string;
  status: InspectionDB['status'];
  inspected_by_name_ar?: string;
  inspected_by_name?: string;
  tenant_id?: number;
};

// ==================== Damage Types ====================
export interface Damage {
  id: number;
  inspection_id: number;
  damage_type: string;
  damage_severity: string;
  damage_location?: string;
  description?: string;
  is_new_damage?: boolean;
  estimated_cost?: number;
  final_cost?: number;
  insurance_required?: boolean;
  insurance_provider?: string;
  claim_number?: string;
  claim_status?: string;
  claim_amount?: string;
}

export type DamageForm = {
  damage_type: string;
  damage_severity: string;
  damage_location: string;
  description: string;
  estimated_cost: number;
  final_cost: number;
  insurance_required: boolean;
  insurance_provider: string;
  claim_number: string;
  claim_amount: string;
  claim_status: string;
};

export type EditDamageForm = DamageForm & {
  id: number;
  inspection_id: number;
  is_new_damage: boolean;
};

// ==================== Other Types ====================
export type DeleteTarget = {
  type: 'single' | 'bulk';
  id?: number;
};

export type Tenant = {
  id: number;
  name: string;
};

export type Booking = {
  id: number;
  name: string;
};

export type Vehicle = {
  id: number;
  name: string;
};