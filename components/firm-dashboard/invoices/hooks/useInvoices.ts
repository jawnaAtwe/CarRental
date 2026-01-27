import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { InvoiceDB } from './types/invoice.types';

const API_BASE_URL = '/api/v1/admin';
const pageSize = 10;

export const useInvoices = (
  language: string,
  selectedTenantId?: number,
  search?: string,
  statusFilter?: string,
  page?: number,
  bookingId?: number,
  customerId?: number
) => {
  const [invoices, setInvoices] = useState<InvoiceDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

 const fetchInvoices = async () => {
    if (!selectedTenantId) return;
    
  setLoading(true);
  try {
    const params = new URLSearchParams({
       tenant_id: selectedTenantId.toString(),
      page: String(page || 1),
      pageSize: String(pageSize),
      ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      ...(bookingId && { booking_id: bookingId.toString() }),
      ...(customerId && { customer_id: customerId.toString() }),
    });

    const response = await fetch(`${API_BASE_URL}/invoices?${params.toString()}`, {
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();
    setInvoices(data.data || []);
    setTotalPages(data.totalPages ?? 1);
    setTotalCount(data.count ?? (data.data ? data.data.length : 0));
  } catch (error: any) {
    console.error(error);
    addToast({
      title: language === 'ar' ? 'خطأ في جلب الفواتير' : 'Error fetching invoices',
      description: error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
      color: 'danger',
    });
  } finally {
    setLoading(false);
  }
};


  const deleteInvoice = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId }),
      });

      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg);
      await fetchInvoices();
      addToast({ 
        title: language === 'ar' ? 'تم الحذف' : 'Deleted', 
        description: msg, 
        color: 'success' 
      });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في حذف الفاتورة' : 'Error deleting invoice'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (invoiceIds: number[]) => {
    if (invoiceIds.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId, invoice_ids: invoiceIds }),
      });

      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg);
      await fetchInvoices();
      addToast({ 
        title: language === 'ar' ? 'تم الحذف' : 'Deleted', 
        description: msg, 
        color: 'success' 
      });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في حذف الفواتير' : 'Error deleting invoices'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoiceId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/${invoiceId}?tenant_id=${selectedTenantId}`,
        {
          headers: { 'accept-language': language },
        }
      );

      let data: any = null;
      let msg = '';
      try {
        data = await response.json();
        msg = data?.message || '';
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg || response.statusText);
      return data;
    } catch (error: any) {
      console.error('Error fetching invoice details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في جلب بيانات الفاتورة' : 'Error fetching invoice details'),
        color: 'danger',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [language, page, search, statusFilter, selectedTenantId, bookingId, customerId]);

  return {
    invoices,
    loading,
    totalPages,
    totalCount,
    fetchInvoices,
    deleteInvoice,
    bulkDelete,
    fetchInvoiceDetails,
  };
};