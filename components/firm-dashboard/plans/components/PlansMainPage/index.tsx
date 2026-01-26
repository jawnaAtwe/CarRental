'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input, useDisclosure, Pagination } from '@heroui/react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../../../context/LanguageContext';
import { SessionUser, PlanForm, PlanDB } from '../types';

// Hooks
import { usePlans } from '../../hooks/usePlans';
import { useSubscriptions } from '../../hooks/useSubscriptions';

// Components
import { PlansTable } from './PlansTable';
import { PlanFormModal } from './PlanFormModal';
import { DeletePlanModal } from './DeletePlanModal';
import { AddSubscriptionModal } from './AddSubscriptionModal';
import { ViewSubscriptionModal } from './ViewSubscriptionModal';

export default function PlanMainPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const isSuperAdmin = user?.roleId === 9;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState<PlanForm>({
    name: '',
    description: '',
    price: 0,
    currency_code: 'USD',
    billing_cycle: 'monthly',
    max_cars: 0,
    max_users: 0,
    max_bookings: 0,
    status: 'active',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<PlanDB | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Hooks
  const { plans, loading, totalPages, fetchPlans, savePlan, deletePlan } = usePlans(language);
  const {
    currentSubscription,
    submittingSubscription,
    fetchSubscription,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  } = useSubscriptions(language);

  // Modals
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const subscriptionModal = useDisclosure();
  const viewSubscriptionModal = useDisclosure();

  // Effects
  useEffect(() => {
    fetchPlans(page, search);
  }, [page, search]);

  useEffect(() => {
    if (plans.length) setSelectedPlanId(plans[0].id);
  }, [plans]);

  // Handlers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency_code: 'USD',
      billing_cycle: 'monthly',
      max_cars: 0,
      max_users: 0,
      max_bookings: 0,
      status: 'active',
    });
    setSubmitError('');
  };

  const handleSavePlan = async () => {
    if (!isSuperAdmin) return;

    try {
      await savePlan(formData, isEditing);
      editModal.onClose();
      fetchPlans(page, search);
    } catch (e: any) {
      setSubmitError(e.message || 'Save failed');
    }
  };

  const handleDeletePlan = async () => {
    if (!isSuperAdmin || !deleteTarget) return;
    deleteModal.onClose();
    const success = await deletePlan(deleteTarget.id);
    if (success) {
      fetchPlans(page, search);
    }
  };

  const handleAddSubscription = async () => {
    if (!user || selectedPlanId === null) return;

    const plan = plans.find(p => p.id === Number(selectedPlanId));
    if (!plan) return;

    const success = await addSubscription(user.tenantId, selectedPlanId, startDate, plan);
    if (success) {
      subscriptionModal.onClose();
    }
  };

  const handleViewSubscription = async (planId: number) => {
    await fetchSubscription(planId, user?.tenantId);
    viewSubscriptionModal.onOpen();
  };

  const handleToggleAutoRenew = (sub: any) => {
    updateSubscription(sub, { auto_renew: !sub.auto_renew });
  };

  return (
    <div className="p-6">
      {/* Header + Search + New Button */}
      <div className="flex justify-between mb-4 items-center gap-4">
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'الخطط' : 'Plans'}</h1>

        <Input
          placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyUp={e => { if (e.key === 'Enter') setPage(1); }}
          className="max-w-xs"
        />

        {isSuperAdmin && (
          <Button
            startContent={<PlusIcon className="h-4 w-4" />}
            onPress={() => { setIsEditing(false); resetForm(); editModal.onOpen(); }}
          >
            {language === 'ar' ? 'خطة جديدة' : 'New Plan'}
          </Button>
        )}
      </div>

      {/* Table */}
      <PlansTable
        language={language}
        plans={plans}
        loading={loading}
        isSuperAdmin={isSuperAdmin}
        onEdit={(plan) => { setIsEditing(true); setFormData(plan); editModal.onOpen(); }}
        onDelete={(plan) => { setDeleteTarget(plan); deleteModal.onOpen(); }}
        onViewSubscription={handleViewSubscription}
        onAddSubscription={(planId) => {
          setSelectedPlanId(planId);
          subscriptionModal.onOpen();
        }}
      />

      {/* Pagination */}
      <div className="mt-4 flex justify-end">
        <Pagination page={page} total={totalPages} onChange={setPage} />
      </div>

      {/* Create / Edit Modal */}
      <PlanFormModal
        isOpen={editModal.isOpen}
        onOpenChange={editModal.onOpenChange}
        isEditing={isEditing}
        formData={formData}
        setFormData={setFormData}
        submitError={submitError}
        onSave={handleSavePlan}
      />

      {/* Delete Modal */}
      <DeletePlanModal
        isOpen={deleteModal.isOpen}
        onOpenChange={deleteModal.onOpenChange}
        onConfirm={handleDeletePlan}
      />

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        language={language}
        isOpen={subscriptionModal.isOpen}
        onOpenChange={subscriptionModal.onOpenChange}
        plans={plans}
        selectedPlanId={selectedPlanId}
        setSelectedPlanId={setSelectedPlanId}
        startDate={startDate}
        setStartDate={setStartDate}
        onAdd={handleAddSubscription}
        submitting={submittingSubscription}
      />

      {/* View Subscription Modal */}
      <ViewSubscriptionModal
        language={language}
        isOpen={viewSubscriptionModal.isOpen}
        onOpenChange={viewSubscriptionModal.onOpenChange}
        currentSubscription={currentSubscription}
        isSuperAdmin={isSuperAdmin}
        onToggleAutoRenew={handleToggleAutoRenew}
        onDelete={deleteSubscription}
      />
    </div>
  );
}