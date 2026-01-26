import { useState } from 'react';
import { addToast } from '@heroui/react';
import { API_BASE_URL, pageSize } from '../constants/plans.constants';
import { PlanDB, PlanForm } from '../components/types';

export const usePlans = (language: string) => {
  const [plans, setPlans] = useState<PlanDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPlans = async (page: number, search: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: search.trim(),
      });
      const res = await fetch(`${API_BASE_URL}/plans?${query.toString()}`);
      const data = await res.json();
      setPlans(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      addToast({ title: 'Error', description: e?.message || 'Failed to fetch plans', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (formData: PlanForm, isEditing: boolean) => {
    try {
      const endpoint = isEditing && formData.id
        ? `${API_BASE_URL}/plans/${formData.id}`
        : `${API_BASE_URL}/plans`;

      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'accept-language': language },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      addToast({ title: language === 'ar' ? 'تم الحفظ' : 'Saved', color: 'success' });
      return true;
    } catch (e: any) {
      throw new Error(e.message || 'Save failed');
    }
  };

  const deletePlan = async (planId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'accept-language': language },
      });
      if (!res.ok) throw new Error('Delete failed');
      addToast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted', color: 'success' });
      return true;
    } catch (e: any) {
      addToast({ title: 'Error', description: e.message, color: 'danger' });
      return false;
    }
  };

  return {
    plans,
    loading,
    totalPages,
    fetchPlans,
    savePlan,
    deletePlan,
  };
};