import { useState } from 'react';
import { API_BASE_URL } from '../constants/maintenance.constants';

export const useBranches = (language: string) => {
  const [branches, setBranches] = useState<{id: number, name: string, name_ar:string}[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const fetchBranches = async (tenantId: number) => {
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
      console.error(error);
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

  return { branches, branchesLoading, branchesError, fetchBranches };
};