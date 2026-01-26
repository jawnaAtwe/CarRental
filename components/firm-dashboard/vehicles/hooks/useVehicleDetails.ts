// hooks/useVehicleDetails.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { VehicleDB } from '../types/vehicle.types';
import { API_BASE_URL } from '../constants/vehicle.constants';

export const useVehicleDetails = () => {
  const [loading, setLoading] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<VehicleDB | null>(null);

  const fetchVehicleDetails = async (
    vehicleId: number,
    selectedTenantId: number | undefined,
    language: string,
    onSuccess?: () => void
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/vehicles/${vehicleId}?tenant_id=${selectedTenantId}`,
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

      if (!response.ok) {
        throw new Error(msg || response.statusText);
      }

      setActiveVehicle(data);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error fetching vehicle details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          error?.message ||
          (language === 'ar'
            ? 'خطأ في جلب بيانات المركبة'
            : 'Error fetching vehicle details'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    activeVehicle,
    setActiveVehicle,
    fetchVehicleDetails,
  };
};