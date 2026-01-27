import { useState } from 'react';
import { addToast } from '@heroui/react';
import { InvoiceForm } from './types/invoice.types';

const API_BASE_URL = '/api/v1/admin';

export const useInvoiceForm = (language: string, selectedTenantId?: number) => {
  const [formData, setFormData] = useState<InvoiceForm>({
    booking_id: undefined,
    customer_id: undefined,
    subtotal: 0,
    vat_rate: 15,
    status:'draft',
    currency_code: 'SAR',
    notes: '',
    tenant_id: selectedTenantId,
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | string>([]);
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setFormData({
      booking_id: undefined,
      customer_id: undefined,
      subtotal: 0,
      vat_rate: 15,
      currency_code: 'SAR',
      notes: '',
      status:'draft',
      tenant_id: selectedTenantId,
    });
    setSubmitError([]);
  };

  const setEditMode = (invoice: any) => {
    setIsEditing(true);
    setFormData({
      id: invoice.id,
      booking_id: invoice.booking_id,
      customer_id: invoice.customer_id,
      subtotal: invoice.subtotal,
      vat_rate: invoice.vat_rate,
      status:invoice.status,
      currency_code: invoice.currency_code,
      notes: invoice.notes ?? '',
      tenant_id: invoice.tenant_id ?? selectedTenantId,
    });
    setSubmitError([]);
  };

  const setCreateMode = () => {
    setIsEditing(false);
    resetForm();
  };

  const saveInvoice = async (onSuccess: () => void) => {
    const payload: Record<string, any> = {
      tenant_id: formData.tenant_id ?? selectedTenantId,
      booking_id: formData.booking_id,
      customer_id: formData.customer_id,
      subtotal: Number(formData.subtotal),
        status: formData.status,
      vat_rate: Number(formData.vat_rate),
      currency_code: formData.currency_code,
      notes: formData.notes?.trim() || null,
    };

    setLoading(true);
    try {
      const endpoint = isEditing && formData.id 
        ? `${API_BASE_URL}/invoices/${formData.id}` 
        : `${API_BASE_URL}/invoices`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ الفاتورة بنجاح' : 'Invoice saved successfully'),
        color: 'success',
      });
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('saveInvoice error:', error);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    submitError,
    isEditing,
    resetForm,
    setEditMode,
    setCreateMode,
    saveInvoice,
  };
};