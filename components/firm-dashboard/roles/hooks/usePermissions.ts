import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { AvailablePermission } from './types';
import { API_BASE_URL } from '../constants';

export const usePermissions = (language: string, tenantId: number | undefined, shouldFetch: boolean) => {
  const [permissions, setPermissions] = useState<AvailablePermission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/permissions/list?tenant_id=${tenantId}`, {
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      setPermissions(data.data || data || []);
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ في جلب الصلاحيات' : 'Error fetching permissions',
        description: error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetch && tenantId) {
      fetchPermissions();
    }
  }, [shouldFetch, tenantId, language]);

  return { permissions, loading, fetchPermissions };
};