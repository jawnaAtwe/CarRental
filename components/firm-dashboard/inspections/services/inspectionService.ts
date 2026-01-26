import { API_BASE_URL, PAGE_SIZE } from '../constants';
import type { InspectionDB, InspectionForm, Booking, Vehicle, Tenant } from '../types';

// ==================== Fetch Inspections ====================
export const fetchInspections = async (
  tenantId: number,
  page: number,
  search: string,
  statusFilter: string,
  language: string
) => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(search && { search }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  });

  const response = await fetch(
    `${API_BASE_URL}/inspections?tenant_id=${tenantId}&${params}`,
    { headers: { 'accept-language': language } }
  );

  if (!response.ok) throw new Error(response.statusText);
  return response.json();
};

// ==================== Fetch Inspection Details ====================
export const fetchInspectionDetails = async (
  id: number,
  tenantId: number,
  language: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/inspections/${id}?tenant_id=${tenantId}`,
    { headers: { 'accept-language': language } }
  );

  if (!response.ok) throw new Error('Failed to fetch inspection details');
  return response.json();
};

// ==================== Save Inspection ====================
export const saveInspection = async (
  formData: InspectionForm,
  isEditing: boolean,
  language: string
) => {
  const endpoint = isEditing && formData.id 
    ? `${API_BASE_URL}/inspections/${formData.id}` 
    : `${API_BASE_URL}/inspections`;
  const method = isEditing ? 'PUT' : 'POST';

  const response = await fetch(endpoint, {
    method,
    headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to save inspection');
  }
  return data;
};

// ==================== Delete Inspection ====================
export const deleteInspection = async (id: number, language: string) => {
  const response = await fetch(`${API_BASE_URL}/inspections/${id}`, {
    method: 'DELETE',
    headers: { 'accept-language': language }
  });

  let msg = '';
  try {
    const data = await response.json();
    msg = data?.message || '';
  } catch {
    msg = await response.text();
  }

  if (!response.ok) throw new Error(msg);
  return msg;
};

// ==================== Bulk Delete ====================
export const bulkDeleteInspections = async (ids: number[], language: string) => {
  const response = await fetch(`${API_BASE_URL}/inspections`, {
    method: 'DELETE',
    headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspection_ids: ids }),
  });

  let msg = '';
  try {
    const data = await response.json();
    msg = data?.message || '';
  } catch {
    msg = await response.text();
  }

  if (!response.ok) throw new Error(msg);
  return msg;
};

// ==================== Fetch Bookings ====================
export const fetchBookings = async (tenantId: number): Promise<Booking[]> => {
  const res = await fetch(`${API_BASE_URL}/bookings?tenant_id=${tenantId}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const result = await res.json();
  return result.data || [];
};

// ==================== Fetch Vehicles ====================
export const fetchVehicles = async (tenantId: number): Promise<Vehicle[]> => {
  const res = await fetch(`${API_BASE_URL}/vehicles?tenant_id=${tenantId}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const result = await res.json();
  return result.data || [];
};

// ==================== Fetch Tenants ====================
export const fetchTenants = async (language: string): Promise<Tenant[]> => {
  const response = await fetch(`${API_BASE_URL}/tenants`, {
    headers: { 'accept-language': language, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch tenants');
  const data = await response.json();
  return data.data || [];
};