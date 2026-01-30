// hooks/useTenants.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { Tenant, TenantCurrency } from '../types/vehicle.types';
import { API_BASE_URL } from '../constants/vehicle.constants';

export const useTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantCurrency, setTenantCurrency] = useState<TenantCurrency | null>(null);

  const fetchTenants = async (language: string) => {
    setTenantsLoading(true);
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
      console.error('Error fetching tenants:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as any)?.message || 'Failed to fetch tenants',
        color: 'danger',
      });
    } finally {
      setTenantsLoading(false);
    }
  };

  const fetchTenantCurrency = async (tenantId: number, language: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
        headers: { 'accept-language': language },
      });

      if (!response.ok) throw new Error('Failed to fetch tenant details');

      const data = await response.json();
      
      const currency: TenantCurrency = {
        currency: data.currency || '',
        currency_code: data.currency_code || '',
      };

      setTenantCurrency(currency);
      return currency;
    } catch (error) {
      console.error('Error fetching tenant currency:', error);
      setTenantCurrency(null);
      return null;
    }
  };

  const clearTenantCurrency = () => {
    setTenantCurrency(null);
  };

  return {
    tenants,
    tenantsLoading,
    tenantCurrency,
    fetchTenants,
    fetchTenantCurrency,
    clearTenantCurrency,
  };
};