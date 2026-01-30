// hooks/useBranches.ts

import { useState } from 'react';
import { Branch } from '../types/vehicle.types';
import { API_BASE_URL } from '../constants/vehicle.constants';

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const fetchBranches = async (tenantId: number, language: string) => {
    setBranchesLoading(true);
    setBranchesError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/branches?tenant_id=${tenantId}`,
        {
          headers: {
            'accept-language': language,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      setBranches(data.data || []);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      setBranches([]);
      setBranchesError(
        language === 'ar'
          ? 'فشل تحميل الفروع'
          : 'Failed to load branches'
      );
    } finally {
      setBranchesLoading(false);
    }
  };

  const clearBranches = () => {
    setBranches([]);
    setBranchesError(null);
  };

  return {
    branches,
    branchesLoading,
    branchesError,
    fetchBranches,
    clearBranches,
  };
};