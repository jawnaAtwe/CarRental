// ================= User Management Types =================

export type UserStatus = 
  | 'pending_verification' 
  | 'active' 
  | 'disabled' 
  | 'deleted' 
  | 'pending_approval';

export type UserDB = {
  id: number;
  tenant_id: number;
  role_id: number;
  full_name: string;
  full_name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  password_hash?: string | null;
  status: UserStatus;
  created_at?: string | null;
};

export type UserForm = {
  id?: number;
  name: string;
  name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  status: UserStatus;
  role_id?: string | number | null;
  password?: string;
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

export interface Role {
  id: number;
  role_id?: number;
  name: string;
  name_ar?: string;
  role_name?: string;
}

export interface Tenant {
  id: number;
  name: string;
}

export interface DeleteTarget {
  type: 'single' | 'bulk';
  id?: number;
}