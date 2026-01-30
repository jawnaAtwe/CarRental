// hooks/useVehicles.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { VehicleDB, VehicleStatus } from '../types/vehicle.types';
import { API_BASE_URL, PAGE_SIZE } from '../constants/vehicle.constants';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<VehicleDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchVehicles = async (
    tenantId: number | undefined,
    page: number,
    search: string,
    statusFilter: VehicleStatus | 'all',
    branchId: number | null,
    language: string
  ) => {
    if (!tenantId) {
      setVehicles([]);
      setTotalPages(1);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId.toString(),
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(search && { search }),
        sortBy: 'created_at',
        sortOrder: 'desc',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(branchId !== null && { branch_id: String(branchId) }),
      });

      const response = await fetch(`${API_BASE_URL}/vehicles?${params}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      setVehicles(Array.isArray(data?.data) ? data.data : []);
      setTotalPages(typeof data?.totalPages === 'number' ? data.totalPages : 1);
      setTotalCount(typeof data?.count === 'number' ? data.count : 0);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setVehicles([]);
      setTotalPages(1);
      setTotalCount(0);

      addToast({
        title: language === 'ar' ? 'خطأ في جلب المركبات' : 'Error fetching vehicles',
        description: err?.message || (language === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDetails = async (
    vehicleId: number,
    tenantId: number | undefined,
    language: string
  ) => {
    if (!tenantId) return null;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/vehicles/${vehicleId}?tenant_id=${tenantId}`,
        {
          headers: { 'accept-language': language },
        }
      );

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        throw new Error(await response.text());
      }

      if (!response.ok) {
        throw new Error(data?.message || response.statusText);
      }

      return data;
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
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    vehicles,
    loading,
    totalPages,
    totalCount,
    fetchVehicles,
    fetchVehicleDetails,
  };
};