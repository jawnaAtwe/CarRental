// hooks/useTenants.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { Tenant } from '../types/paymentTypes';
import { API_BASE_URL } from '../constants/paymentConstants';

export const useTenants = (language: string) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch tenants');

      const data = await response.json();
      setTenants(data.data || []);
    } catch (error) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as any)?.message || 'Failed to fetch tenants',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    tenants,
    loading,
    fetchTenants,
  };
};