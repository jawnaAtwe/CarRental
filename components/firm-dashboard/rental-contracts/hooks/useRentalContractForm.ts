import { useState } from 'react';
import { addToast } from '@heroui/react';
import { RentalContractForm, RentalContractDB, BookingDB } from './types';
import { rentalContractService } from '../services/rentalContractService';

export const useRentalContractForm = (language: string, selectedTenantId: number | undefined) => {
  const [formData, setFormData] = useState<RentalContractForm>({
    booking_id: undefined,
    customer_id: undefined,
    vehicle_id: undefined,
    template_id: undefined,
    contract_number: '',
    pdf_path: '',
    status: 'draft',
    tenant_id: selectedTenantId,
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const fetchBookingData = async (bookingId: number) => {
    if (!selectedTenantId) return;

    try {
      const result = await rentalContractService.fetchBookingById(bookingId, selectedTenantId, language);
      const booking: BookingDB = result.data || result;

      setFormData((prev) => ({
        ...prev,
        customer_id: booking.customer_id,
        vehicle_id: booking.vehicle_id,
      }));

      addToast({
        title: language === 'ar' ? 'تم التحميل' : 'Loaded',
        description: language === 'ar' ? 'تم جلب بيانات الحجز بنجاح' : 'Booking data loaded successfully',
        color: 'success',
      });
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'فشل جلب بيانات الحجز' : 'Failed to fetch booking data'),
        color: 'danger',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      booking_id: undefined,
      customer_id: undefined,
      vehicle_id: undefined,
      template_id: undefined,
      contract_number: '',
      pdf_path: '',
      status: 'draft',
      tenant_id: selectedTenantId,
    });
    setSubmitError([]);
  };

  const setEditMode = (contract: RentalContractDB) => {
    setIsEditing(true);
    setFormData({
      id: contract.id,
      booking_id: contract.booking_id,
      customer_id: contract.customer_id,
      vehicle_id: contract.vehicle_id,
      template_id: contract.template_id,
      contract_number: contract.contract_number ?? '',
      pdf_path: contract.pdf_path,
      status: contract.status,
      tenant_id: contract.tenant_id ?? selectedTenantId,
    });
    setSubmitError([]);
  };

  const setCreateMode = () => {
    setIsEditing(false);
    resetForm();
  };

  const saveContract = async (onSuccess: () => void) => {
    const payload: Record<string, any> = {
      tenant_id: formData.tenant_id ?? selectedTenantId,
      booking_id: Number(formData.booking_id),
      customer_id: Number(formData.customer_id),
      vehicle_id: Number(formData.vehicle_id),
      template_id: Number(formData.template_id),
      contract_number: formData.contract_number?.trim() || null,
      pdf_path: formData.pdf_path?.trim(),
    };

    if (isEditing) {
      payload.status = formData.status;
    }

    setLoading(true);
    try {
      const response = isEditing && formData.id
        ? await rentalContractService.updateContract(formData.id, payload, language)
        : await rentalContractService.createContract(payload as RentalContractForm, language);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ العقد بنجاح' : 'Contract saved successfully'),
        color: 'success',
      });

      resetForm();
      onSuccess();
    } catch (error) {
      console.error('saveContract error:', error);
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
    saveContract,
    fetchBookingData,
  };
};