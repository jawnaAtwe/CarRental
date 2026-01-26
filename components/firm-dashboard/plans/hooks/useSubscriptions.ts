import { useState } from 'react';
import { addToast } from '@heroui/react';
import { API_BASE_URL } from '../constants/plans.constants';
import { Subscription, PlanDB } from '../components/types';

export const useSubscriptions = (language: string) => {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription[]>([]);
  const [submittingSubscription, setSubmittingSubscription] = useState(false);

  const fetchSubscription = async (planId: number, tenantId?: number) => {
    if (!planId) return;

    try {
      const params: Record<string, string> = {
        plan_id: planId.toString(),
        page: "1",
        pageSize: "20",
      };

      if (tenantId) {
        params.tenant_id = tenantId.toString();
      }

      const query = new URLSearchParams(params).toString();

      const res = await fetch(`${API_BASE_URL}/subscriptions?${query}`, {
        method: "GET",
        headers: {
          "accept-language": language,
        },
      });

      if (!res.ok) {
        setCurrentSubscription([]);
        return;
      }

      const result = await res.json();
      setCurrentSubscription(result.data ?? []);

    } catch (error) {
      console.error("fetchSubscription error:", error);
      setCurrentSubscription([]);
    }
  };

  const addSubscription = async (
    tenantId: number,
    selectedPlanId: number,
    startDate: string,
    plan: PlanDB
  ) => {
    setSubmittingSubscription(true);
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      if (plan.billing_cycle === 'monthly') end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);

      const payload = {
        tenant_id: Number(tenantId),
        plan_id: Number(selectedPlanId),
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        status: 'active',
        auto_renew: true,
      };

      const res = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept-language': language },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create subscription');

      addToast({
        title: data.message || (language === 'ar' ? 'تم إضافة الاشتراك' : 'Subscription Added'),
        color: 'success',
      });

      return true;
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, color: 'danger' });
      return false;
    } finally {
      setSubmittingSubscription(false);
    }
  };

  const updateSubscription = async (subscription: Subscription, updates: Partial<Subscription>) => {
    if (!subscription.id || !subscription.tenant_id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': language,
        },
        body: JSON.stringify({ ...updates, tenant_id: subscription.tenant_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription');

      addToast({
        title: language === 'ar'
          ? updates.auto_renew !== undefined
            ? `تم ${updates.auto_renew ? 'تفعيل' : 'إيقاف'} التجديد التلقائي`
            : 'تم تجديد الاشتراك'
          : updates.auto_renew !== undefined
            ? `Auto Renew ${updates.auto_renew ? 'Enabled' : 'Disabled'}`
            : 'Subscription Renewed',
        color: 'success',
      });

      fetchSubscription(subscription.plan_id, subscription.tenant_id);
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, color: 'danger' });
    }
  };

  const deleteSubscription = async (subscription: Subscription) => {
    if (!subscription.id || !subscription.tenant_id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/${subscription.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': language,
        },
        body: JSON.stringify({ tenant_id: subscription.tenant_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete subscription');
      }

      addToast({
        title: language === 'ar' ? 'تم حذف الاشتراك' : 'Subscription Deleted',
        color: 'success',
      });

      if (subscription.plan_id) {
        fetchSubscription(subscription.plan_id, subscription.tenant_id);
      }

    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, color: 'danger' });
    }
  };

  return {
    currentSubscription,
    submittingSubscription,
    setCurrentSubscription,
    fetchSubscription,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  };
};