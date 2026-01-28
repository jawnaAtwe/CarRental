export type Permission = {
  permission_id: number;
  id?: number;
  name: string;
  name_ar?: string;
  code?: string;
  description?: string;
  description_ar?: string;
};

export type AvailablePermission = {
  id: number;
  name: string;
  name_ar?: string;
  code: string;
  description?: string;
  description_ar?: string;
};

export type RoleDB = {
  id: number;
  tenant_id: number;
  slug: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  created_at?: string | null;
  permissions?: Permission[];
};

export type RoleForm = {
  id?: number;
  slug: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  tenant_id?: number;
  permissions: number[];
};

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