import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';

type BranchDB = {
  id: number;
  tenant_id: number;
  name: string;
  name_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status: 'active' | 'deleted';
  created_at?: string | null;
};

const API_BASE_URL = '/api/v1/admin';
const pageSize = 6;

export const useBranches = (
  language: string,
  selectedTenantId?: number,
  search?: string,
  statusFilter?: 'all' | 'active' | 'deleted',
  page?: number
) => {
  const [branches, setBranches] = useState<BranchDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBranches = async () => {
    if (!selectedTenantId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: selectedTenantId.toString(),
        page: String(page || 1),
        pageSize: String(pageSize),
        ...(search && { search }),
        sortBy: 'created_at',
        sortOrder: 'desc',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`${API_BASE_URL}/branches?${params}`, {
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setBranches(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.count ?? (data.data ? data.data.length : 0));
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ في جلب الفروع' : 'Error fetching branches',
        description: error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId }),
      });

      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg);
      await fetchBranches();
      addToast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted', description: msg, color: 'success' });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في حذف الفرع' : 'Error deleting branch'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (branchIds: number[]) => {
    if (branchIds.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/branches`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId, branch_ids: branchIds }),
      });

      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg);
      await fetchBranches();
      addToast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted', description: msg, color: 'success' });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في حذف الفروع' : 'Error deleting branches'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchDetails = async (branchId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/branches/${branchId}?tenant_id=${selectedTenantId}`, {
        headers: { 'accept-language': language },
      });

      let data: any = null;
      let msg = '';
      try {
        data = await response.json();
        msg = data?.message || '';
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg || response.statusText);
      return data;
    } catch (error: any) {
      console.error('Error fetching branch details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في جلب بيانات الفرع' : 'Error fetching branch details'),
        color: 'danger',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [language, page, search, statusFilter, selectedTenantId]);

  return {
    branches,
    loading,
    totalPages,
    totalCount,
    fetchBranches,
    deleteBranch,
    bulkDelete,
    fetchBranchDetails,
  };
};