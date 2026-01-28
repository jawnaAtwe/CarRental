export type ContractStatus = 'draft' | 'signed' | 'cancelled';

export type RentalContractDB = {
  id: number;
  tenant_id: number;
  booking_id: number;
  customer_id: number;
  vehicle_id: number;
  template_id: number;
  contract_number?: string | null;
  status: ContractStatus;
  pdf_path: string;
  created_at?: string | null;
};

export type RentalContractForm = {
  id?: number;
  tenant_id?: number;
  booking_id?: number;
  customer_id?: number;
  vehicle_id?: number;
  template_id?: number;
  contract_number?: string | null;
  pdf_path?: string;
  status?: ContractStatus;
};

export interface BookingDB {
  id: number;
  customer_id: number;
  vehicle_id: number;
  customer_name?: string;
  vehicle_name?: string;
  [key: string]: any;
}
export interface ContractTemplateDB {
  id: number;
  name: string;
  language: string;
  [key: string]: any;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: 'user' | 'customer';
  roles: string[];
  permissions: string[];
  tenantId: number;
  roleId: number;
}

export interface Tenant {
  id: number;
  name: string;
}