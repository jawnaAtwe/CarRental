import { useState } from 'react';
import { addToast } from '@heroui/react';

type BranchForm = {
  id?: number;
  name: string;
  name_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status?: 'active' | 'deleted';
  tenant_id?: number;
};

const API_BASE_URL = '/api/v1/admin';

export const useBranchForm = (language: string, selectedTenantId?: number) => {
  const [formData, setFormData] = useState<BranchForm>({
    name: '',
    name_ar: '',
    address: '',
    address_ar: '',
    latitude: '',
    longitude: '',
    status: 'active',
    tenant_id: selectedTenantId,
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | string>([]);
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      address: '',
      address_ar: '',
      latitude: '',
      longitude: '',
      status: 'active',
      tenant_id: selectedTenantId,
    });
    setSubmitError([]);
  };

  const setEditMode = (branch: any) => {
    setIsEditing(true);
    setFormData({
      id: branch.id,
      name: branch.name,
      name_ar: branch.name_ar ?? '',
      address: branch.address ?? '',
      address_ar: branch.address_ar ?? '',
      latitude: branch.latitude ?? '',
      longitude: branch.longitude ?? '',
      status: branch.status,
      tenant_id: branch.tenant_id ?? selectedTenantId,
    });
    setSubmitError([]);
  };

  const setCreateMode = () => {
    setIsEditing(false);
    resetForm();
  };

  const saveBranch = async (onSuccess: () => void) => {
    const payload: Record<string, any> = {
      tenant_id: formData.tenant_id ?? selectedTenantId,
      name: formData.name?.trim(),
      name_ar: formData.name_ar?.trim() || null,
      address: formData.address?.trim() || null,
      address_ar: formData.address_ar?.trim() || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
    };

    setLoading(true);
    try {
      const endpoint = isEditing && formData.id ? `${API_BASE_URL}/branches/${formData.id}` : `${API_BASE_URL}/branches`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ الفرع بنجاح' : 'Branch saved successfully'),
        color: 'success',
      });
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('saveBranch error:', error);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    submitError,
    isEditing,
    resetForm,
    setEditMode,
    setCreateMode,
    saveBranch,
  };
};