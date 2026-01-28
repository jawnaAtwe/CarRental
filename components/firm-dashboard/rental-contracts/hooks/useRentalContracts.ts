import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { RentalContractDB, ContractStatus } from './types';
import { rentalContractService } from '../services/rentalContractService';

export const useRentalContracts = (
  language: string,
  selectedTenantId: number | undefined,
  statusFilter: ContractStatus | 'all',
  bookingId?: number
) => {
  const [contracts, setContracts] = useState<RentalContractDB[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContracts = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: selectedTenantId.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(bookingId && { booking_id: bookingId.toString() }),
      });

      const data = await rentalContractService.fetchContracts(params, language);
      setContracts(data.data || []);
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ في جلب العقود' : 'Error fetching contracts',
        description: error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelContract = async (id: number, tenantId: number) => {
    setLoading(true);
    try {
      const response = await rentalContractService.cancelContract(id, tenantId, language);

      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg);

      await fetchContracts();
      addToast({
        title: language === 'ar' ? 'تم الإلغاء' : 'Cancelled',
        description: msg,
        color: 'success',
      });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في إلغاء العقد' : 'Error cancelling contract'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContractDetails = async (contractId: number, tenantId: number) => {
    setLoading(true);
    try {
      const result = await rentalContractService.fetchContractById(contractId, tenantId, language);
      return result.data;
    } catch (error: any) {
      console.error('Error fetching contract details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          error?.message || (language === 'ar' ? 'خطأ في جلب بيانات العقد' : 'Error fetching contract details'),
        color: 'danger',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [language, selectedTenantId, statusFilter, bookingId]);

  return {
    contracts,
    loading,
    fetchContracts,
    cancelContract,
    fetchContractDetails,
  };
};