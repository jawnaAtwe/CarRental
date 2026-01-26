// hooks/useVehicleSave.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { VehicleForm } from '../types/vehicle.types';
import { API_BASE_URL } from '../constants/vehicle.constants';

export const useVehicleSave = () => {
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | string>([]);

  const saveVehicle = async (
    formData: VehicleForm,
    isEditing: boolean,
    selectedTenantId: number | undefined,
    selectedBranchId: number | null,
    language: string,
    onSuccess?: () => void
  ) => {
    setLoadingForm(true);
    try {
      const payload = {
        ...formData,
        tenant_id: selectedTenantId,
        branch_id: formData.branch_id ?? selectedBranchId 
      };

      const endpoint = isEditing && formData.id
        ? `${API_BASE_URL}/vehicles/${formData.id}`
        : `${API_BASE_URL}/vehicles`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ المركبة بنجاح' : 'Vehicle saved successfully'),
        color: 'success'
      });

      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoadingForm(false);
    }
  };

  return {
    loadingForm,
    submitError,
    setSubmitError,
    saveVehicle,
  };
};