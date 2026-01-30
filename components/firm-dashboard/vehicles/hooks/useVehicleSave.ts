// hooks/useVehicleSave.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { VehicleForm, TenantCurrency } from '../types/vehicle.types';
import { API_BASE_URL } from '../constants/vehicle.constants';

export const useVehicleSave = () => {
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | string>([]);

  const saveVehicle = async (
    formData: VehicleForm,
    isEditing: boolean,
    tenantId: number | undefined,
    branchId: number | null,
    tenantCurrency: TenantCurrency | null,
    language: string,
    onSuccess?: () => void
  ) => {
    setLoadingForm(true);
    setSubmitError([]);

    try {
      // ✅ إضافة العملة تلقائياً من التينانت
      const payload = {
        ...formData,
        tenant_id: tenantId,
        branch_id: formData.branch_id ?? branchId,
        currency: tenantCurrency?.currency,
        currency_code: tenantCurrency?.currency_code,
      };

      console.log('💰 Currency from tenant:', tenantCurrency);
      console.log('📦 Payload being sent:', payload);

      const endpoint = isEditing && formData.id
        ? `${API_BASE_URL}/vehicles/${formData.id}`
        : `${API_BASE_URL}/vehicles`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('❌ API Error:', data);
        setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ المركبة بنجاح' : 'Vehicle saved successfully'),
        color: 'success',
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('❌ Save Error:', err);
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