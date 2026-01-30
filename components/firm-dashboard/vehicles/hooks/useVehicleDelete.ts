// hooks/useVehicleDelete.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { API_BASE_URL } from '../constants/vehicle.constants';

export const useVehicleDelete = () => {
  const [loading, setLoading] = useState(false);

  const deleteVehicle = async (
    id: number,
    tenantId: number | undefined,
    language: string,
    onSuccess?: () => void
  ) => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: tenantId }),
      });

      if (!response.ok) throw new Error(await response.text());

      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: '',
        color: 'success',
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('Error deleting vehicle:', err);
      addToast({
        title: 'Error',
        description: err?.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteVehicles = async (
    vehicleIds: number[],
    tenantId: number | undefined,
    language: string,
    onSuccess?: () => void
  ) => {
    if (!tenantId || !vehicleIds.length) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'DELETE',
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: tenantId, vehicle_ids: vehicleIds }),
      });

      if (!response.ok) throw new Error(await response.text());

      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: '',
        color: 'success',
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('Error bulk deleting vehicles:', err);
      addToast({
        title: 'Error',
        description: err?.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    deleteVehicle,
    bulkDeleteVehicles,
  };
};