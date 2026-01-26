// hooks/usePayments.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { Payment, PaymentStatus } from '../types/paymentTypes';
import { API_BASE_URL, PAGE_SIZE } from '../constants/paymentConstants';

export const usePayments = (language: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const fetchPayments = async (tenantId?: number) => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId.toString(),
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      const response = await fetch(`${API_BASE_URL}/payments?${params}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      setPayments(data.data || []);
      setTotalPages(Math.ceil((data.total ?? data.data?.length ?? 0) / PAGE_SIZE));
      setTotalCount(data.total ?? data.data?.length ?? 0);
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || 'Failed to fetch payments',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: number, status: PaymentStatus, onSuccess?: () => void) => {
    setUpdatingStatus(paymentId);

    try {
      const res = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': language,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to update payment status');
      }

      addToast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description:
          language === 'ar'
            ? 'تم تحديث حالة الدفع بنجاح'
            : 'Payment status updated successfully',
        color: 'success',
      });

      onSuccess?.();
    } catch (error: any) {
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || 'Failed to update status',
        color: 'danger',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  return {
    payments,
    loading,
    page,
    setPage,
    totalPages,
    totalCount,
    updatingStatus,
    fetchPayments,
    updatePaymentStatus,
  };
};