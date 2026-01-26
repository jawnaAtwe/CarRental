import { useState } from 'react';
import { addToast } from '@heroui/react';
import { API_BASE_URL, pageSize } from '../constants/maintenance.constants';
import { VehicleDB } from  '../components/types';

export const useVehicles = (language: string) => {
  const [vehicles, setVehicles] = useState<VehicleDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeVehicle, setActiveVehicle] = useState<VehicleDB | null>(null);

  const fetchVehicles = async (
    selectedTenantId: number | undefined,
    page: number,
    search: string,
    statusFilter: VehicleDB['status'] | 'all',
    selectedBranchId: number | null
  ) => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: selectedTenantId.toString(),
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        sortBy: 'created_at',
        sortOrder: 'desc',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(selectedBranchId !== null && { branch_id: String(selectedBranchId) }),
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

  const fetchVehicleDetails = async (vehicleId: number, selectedTenantId: number | undefined) => {
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
    } finally {
      setLoading(false);
    }
  };

  return {
    vehicles,
    loading,
    totalPages,
    totalCount,
    activeVehicle,
    setActiveVehicle,
    fetchVehicles,
    fetchVehicleDetails,
  };
};