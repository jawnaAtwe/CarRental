import { useState } from 'react';
import { addToast } from '@heroui/react';
import { ContractTemplateForm } from './types/contract-template.types';

const API_BASE_URL = '/api/v1/admin';

export const useContractTemplateForm = (language: string, selectedTenantId?: number) => {
  const [formData, setFormData] = useState<ContractTemplateForm>({
    language: 'en',
    name: '',
    content: '',
    status: 'active',
    tenant_id: selectedTenantId,
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | string>([]);
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setFormData({
      language: 'en',
      name: '',
      content: '',
      status: 'active',
      tenant_id: selectedTenantId,
    });
    setSubmitError([]);
  };

  const setEditMode = (template: any) => {
    setIsEditing(true);
    setFormData({
      id: template.id,
      language: template.language,
      name: template.name ?? '',
      content: template.content,
      status: template.status,
      tenant_id: template.tenant_id ?? selectedTenantId,
    });
    setSubmitError([]);
  };

  const setCreateMode = () => {
    setIsEditing(false);
    resetForm();
  };

  const saveTemplate = async (onSuccess: () => void) => {
    const payload: Record<string, any> = {
      tenant_id: formData.tenant_id ?? selectedTenantId,
      language: formData.language,
      name: formData.name?.trim() || null,
      content: formData.content?.trim(),
      status: formData.status,
    };

    setLoading(true);
    try {
      const endpoint =
        isEditing && formData.id
          ? `${API_BASE_URL}/contract-templates/${formData.id}`
          : `${API_BASE_URL}/contract-templates`;
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
        description: data?.message || (language === 'ar' ? 'تم حفظ القالب بنجاح' : 'Template saved successfully'),
        color: 'success',
      });
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('saveTemplate error:', error);
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
    saveTemplate,
  };
};