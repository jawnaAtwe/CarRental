// ================= User API Service =================

import { UserDB, UserForm } from '../types/user.types';
import { API_BASE_URL } from '../constants/user.constants';

export class UserApiService {
  /**
   * Fetch all tenants (Super Admin only)
   */
  static async fetchTenants(language: string) {
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      headers: { 
        'accept-language': language, 
        'Content-Type': 'application/json' 
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch tenants');
    
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Fetch roles for a specific tenant
   */
  static async fetchRoles(language: string, tenantId: number) {
    if (!tenantId) {
      throw new Error("Tenant ID is missing");
    }

    const params = new URLSearchParams({ tenant_id: tenantId.toString() });

    const response = await fetch(`${API_BASE_URL}/roles?${params}`, {
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      throw new Error('Invalid roles data format');
    }
  }

  /**
   * Fetch users with pagination and filters
   */
  static async fetchUsers(
    language: string,
    tenantId: number,
    page: number,
    pageSize: number,
    search?: string,
    statusFilter?: string
  ) {
    const params = new URLSearchParams({
      tenant_id: tenantId.toString(),
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      sortBy: 'created_at',
      sortOrder: 'desc',
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });

    const response = await fetch(`${API_BASE_URL}/users?${params}`, {
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(response.statusText);
    
    const data = await response.json();
    return {
      users: data.data || [],
      totalPages: data.totalPages ?? 1,
      totalCount: data.count ?? (data.data ? data.data.length : 0),
    };
  }

  /**
   * Fetch single user details
   */
  static async fetchUserDetails(language: string, userId: number, tenantId: number) {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}?tenant_id=${tenantId}`,
      {
        headers: { 'accept-language': language },
      }
    );

    let msg = '';
    let data: any = null;
    
    try {
      data = await response.json();
      msg = data?.message || '';
    } catch {
      msg = await response.text();
    }

    if (!response.ok) throw new Error(msg || response.statusText);

    return data;
  }

  /**
   * Delete a single user
   */
  static async deleteUser(language: string, userId: number, tenantId: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 
        'accept-language': language, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    let msg = '';
    try {
      const data = await response.json();
      msg = data?.message || JSON.stringify(data);
    } catch {
      msg = await response.text();
    }

    if (!response.ok) throw new Error(msg);

    return msg;
  }

  /**
   * Bulk delete users
   */
  static async bulkDeleteUsers(language: string, tenantId: number, userIds: number[]) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'DELETE',
      headers: { 
        'accept-language': language, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ tenant_id: tenantId, user_ids: userIds }),
    });

    let msg = '';
    try {
      const data = await response.json();
      msg = data?.message || JSON.stringify(data);
    } catch {
      msg = await response.text();
    }

    if (!response.ok) throw new Error(msg);

    return msg;
  }

  /**
   * Update user status
   */
  static async updateUserStatus(
    language: string,
    userId: number,
    newStatus: string,
    tenantId: number
  ) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 
        'accept-language': language, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ status: newStatus, tenant_id: tenantId }),
    });

    let msg = '';
    try {
      const data = await response.json();
      msg = data?.message || '';
    } catch {
      msg = await response.text().catch(() => '');
    }

    if (!response.ok) throw new Error(msg || 'Failed to update user status');

    return msg;
  }

  /**
   * Create or update user
   */
  static async saveUser(
    language: string,
    formData: UserForm,
    isEditing: boolean,
    selectedTenantId: number
  ) {
    const payload: Record<string, any> = {
      full_name: formData.name?.trim(),
      full_name_ar: formData.name_ar?.trim() || null,
      email: formData.email?.trim() || null,
      phone: formData.phone?.trim() || null,
      role_id: Number(formData.role_id),
      tenant_id: formData.tenant_id ?? selectedTenantId,
      ...(formData.password ? { password: formData.password } : {}),
    };

    if (isEditing) {
      payload.status = formData.status;
    }

    const endpoint = isEditing && formData.id 
      ? `${API_BASE_URL}/users/${formData.id}` 
      : `${API_BASE_URL}/users`;
    
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 
        'accept-language': language, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
    }

    return data;
  }
}