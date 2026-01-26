// hooks/useVehicles.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { VehicleDB } from '../types/vehicle.types';
import { API_BASE_URL, pageSize } from '../constants/vehicle.constants';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<VehicleDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchVehicles = async (params: {
    selectedTenantId?: number;
    page: number;
    search: string;
    statusFilter: VehicleDB['status'] | 'all';
    selectedBranchId: number | null;
    language: string;
  }) => {
    const { selectedTenantId, page, search, statusFilter, selectedBranchId, language } = params;

    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        tenant_id: selectedTenantId.toString(),
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        sortBy: 'created_at',
        sortOrder: 'desc',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(selectedBranchId !== null && { branch_id: String(selectedBranchId) }),
      });

      const response = await fetch(`${API_BASE_URL}/vehicles?${queryParams}`, {
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
      console.error(err);
      setVehicles([]);
      setTotalPages(1);
      setTotalCount(0);

      addToast({
        title: language === 'ar' ? 'خطأ في جلب المركبات' : 'Error fetching vehicles',
        description: err?.message || (language==='ar'?'حدث خطأ غير متوقع':'Unexpected error'),
        color: 'danger',
      });
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
  };
};