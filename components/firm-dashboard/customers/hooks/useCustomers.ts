import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { CustomerDB, CustomerStatus } from './types';
import { customerService } from '../services/customerService';
import { PAGE_SIZE } from '../constants';

export const useCustomers = (
  language: string,
  page: number,
  search: string,
  statusFilter: CustomerStatus | 'all'
) => {
  const [customers, setCustomers] = useState<CustomerDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const data = await customerService.fetchCustomers(params, language);
      setCustomers(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.count ?? (data.data ? data.data.length : 0));
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ في جلب العملاء' : 'Error fetching customers',
        description: error?.message || 'Error',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: number) => {
    setLoading(true);
    try {
      const response = await customerService.deleteCustomer(id, language);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Failed to delete');
      
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: data?.message || '',
        color: 'success',
      });
      fetchCustomers();
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'فشل الحذف' : 'Delete failed'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteCustomers = async (customerIds: number[]) => {
    if (customerIds.length === 0) return;

    setLoading(true);
    try {
      const response = await customerService.bulkDeleteCustomers(customerIds, language);
      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg);

      await fetchCustomers();
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: msg,
        color: 'success',
      });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في حذف المستخدمين' : 'Error deleting users'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: number) => {
    setLoading(true);
    try {
      const data = await customerService.fetchCustomerById(customerId, language);
      return data;
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في جلب بيانات العميل' : 'Error fetching customer details'),
        color: 'danger',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, statusFilter, language]);

  return {
    customers,
    loading,
    totalPages,
    totalCount,
    fetchCustomers,
    deleteCustomer,
    bulkDeleteCustomers,
    fetchCustomerDetails,
  };
};