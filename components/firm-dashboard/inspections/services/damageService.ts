import { API_BASE_URL } from '../constants';
import type { Damage, DamageForm } from '../types';

// ==================== Fetch Inspection Damages ====================
export const fetchInspectionDamages = async (
  inspectionId: number,
  tenantId: number,
  language: string
): Promise<Damage[]> => {
  const response = await fetch(
    `${API_BASE_URL}/inspection-damages?inspection_id=${inspectionId}&tenant_id=${tenantId}`,
    { headers: { 'accept-language': language } }
  );

  if (!response.ok) throw new Error('Failed to fetch damages');
  const data = await response.json();
  return data.data || [];
};

// ==================== Save Damage ====================
export const saveDamage = async (
  damageData: DamageForm & { inspection_id: number; tenant_id: number },
  language: string
) => {
  const response = await fetch(`${API_BASE_URL}/inspection-damages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept-language': language
    },
    body: JSON.stringify(damageData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMsg = errorData?.message || 'Failed to save damage';
    throw new Error(errorMsg);
  }

  return response.json();
};

// ==================== Update Damage ====================
export const updateDamage = async (
  damageId: number,
  payload: any,
  language: string
) => {
  const response = await fetch(`${API_BASE_URL}/inspection-damages/${damageId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "accept-language": language,
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Server did not return JSON:\n${text}`);
  }

  if (!response.ok) {
    const errorMsg = data?.error || 'Failed to update damage';
    throw new Error(errorMsg);
  }

  return data;
};

// ==================== Delete Damage ====================
export const deleteDamage = async (damageId: number, language: string) => {
  const response = await fetch(`${API_BASE_URL}/inspection-damages/${damageId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'accept-language': language
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMsg = errorData?.error || 'Failed to delete damage';
    throw new Error(errorMsg);
  }

  return response.json();
};