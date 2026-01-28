import { useState } from 'react';
import { addToast } from '@heroui/react';
import { CustomerForm, CustomerDB } from './types';
import { customerService } from '../services/customerService';

export const useCustomerForm = (language: string) => {
  const [formData, setFormData] = useState<CustomerForm>({
    customer_type: 'individual',
    status: 'active',
    full_name: '',
    profile_image: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setFormData({
      customer_type: 'individual',
      status: 'active',
      first_name: '',
      last_name: '',
      full_name: '',
      profile_image: null,
      email: '',
      phone: '',
      whatsapp: '',
      nationality: '',
      date_of_birth: '',
      gender: undefined,
      id_type: undefined,
      id_number: '',
      driving_license_number: '',
      license_country: '',
      license_expiry_date: '',
      address: '',
      city: '',
      country: '',
      preferred_language: language || 'en',
      notes: '',
      password: '',
    });
    setSubmitError([]);
    setIsEditing(false);
  };

  const setEditMode = (customer: CustomerDB) => {
    setIsEditing(true);
    setFormData({
      id: customer.id,
      customer_type: customer.customer_type,
      status: customer.status,
      profile_image: customer.profile_image ?? '',
      first_name: customer.first_name ?? '',
      last_name: customer.last_name ?? '',
      full_name: customer.full_name ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      whatsapp: (customer as any).whatsapp ?? '',
      nationality: (customer as any).nationality ?? '',
      date_of_birth: (customer as any).date_of_birth ?? '',
      gender: (customer as any).gender ?? undefined,
      id_type: (customer as any).id_type ?? undefined,
      id_number: (customer as any).id_number ?? '',
      driving_license_number: (customer as any).driving_license_number ?? '',
      license_country: (customer as any).license_country ?? '',
      license_expiry_date: (customer as any).license_expiry_date ?? '',
      address: (customer as any).address ?? '',
      city: (customer as any).city ?? '',
      country: (customer as any).country ?? '',
      preferred_language: (customer as any).preferred_language ?? 'en',
      notes: (customer as any).notes ?? '',
      password: '',
    });
    setSubmitError([]);
  };

  const setCreateMode = () => {
    setIsEditing(false);
    resetForm();
  };

  const saveCustomer = async (onSuccess: () => void) => {
    setLoading(true);
    try {
      const response = formData.id
        ? await customerService.updateCustomer(formData.id, formData, language)
        : await customerService.createCustomer(formData, language);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ العميل بنجاح' : 'Customer saved successfully'),
        color: 'success',
      });

      resetForm();
      onSuccess();
    } catch (error) {
      console.error(error);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = <K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
    saveCustomer,
    updateForm,
  };
};