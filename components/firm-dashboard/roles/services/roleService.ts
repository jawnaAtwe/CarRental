import { API_BASE_URL } from '../constants';
import { RoleForm } from '../hooks/types';

export const roleService = {
  async fetchRoles(params: URLSearchParams, language: string) {
    const response = await fetch(`${API_BASE_URL}/roles?${params}`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async fetchRoleById(id: number, tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}?tenant_id=${tenantId}`, {
      headers: { 'accept-language': language },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async createRole(data: RoleForm, language: string) {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  async updateRole(id: number, data: RoleForm, language: string) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  async deleteRole(id: number, tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId }),
    });
    return response;
  },

  async bulkDeleteRoles(roleIds: number[], tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, role_ids: roleIds }),
    });
    return response;
  },
};