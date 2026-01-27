import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { ContractTemplateDB } from './types/contract-template.types';

const API_BASE_URL = '/api/v1/admin';

export const useContractTemplates = (
  language: string,
  selectedTenantId?: number,
  languageFilter?: string
) => {
  const [templates, setTemplates] = useState<ContractTemplateDB[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: selectedTenantId.toString(),
        ...(languageFilter && { language: languageFilter }),
      });

      const response = await fetch(`${API_BASE_URL}/contract-templates?${params}`, {
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });

      // إذا كان 404 (لا توجد نتائج)، نعتبرها array فاضي
      if (response.status === 404) {
        setTemplates([]);
        return;
      }

      if (!response.ok) throw new Error(response.statusText);
      
      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error: any) {
      console.error(error);
      // لا نعرض toast إذا كان الخطأ "no templates found"
      if (!error?.message?.includes('not found') && !error?.message?.includes('404')) {
        addToast({
          title: language === 'ar' ? 'خطأ في جلب القوالب' : 'Error fetching templates',
          description: error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
          color: 'danger',
        });
      }
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/contract-templates/${id}?tenant_id=${selectedTenantId}`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });

      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg);
      await fetchTemplates();
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: msg,
        color: 'success',
      });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في حذف القالب' : 'Error deleting template'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateDetails = async (templateId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/contract-templates/${templateId}?tenant_id=${selectedTenantId}`,
        {
          headers: { 'accept-language': language },
        }
      );

      let data: any = null;
      let msg = '';
      try {
        const result = await response.json();
        data = result.data;
        msg = result?.message || '';
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg || response.statusText);
      return data;
    } catch (error: any) {
      console.error('Error fetching template details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          error?.message || (language === 'ar' ? 'خطأ في جلب بيانات القالب' : 'Error fetching template details'),
        color: 'danger',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [language, selectedTenantId, languageFilter]);

  return {
    templates,
    loading,
    fetchTemplates,
    deleteTemplate,
    fetchTemplateDetails,
  };
};