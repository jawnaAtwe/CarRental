'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
  Alert,
  addToast,
  Form,
  Select,
  SelectItem,
  Pagination,
} from '@heroui/react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../context/LanguageContext';

// ================= Types =================
type PlanDB = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency_code: 'USD' | 'EUR' | 'ILS';
  billing_cycle: 'monthly' | 'yearly';
  max_cars: number;
  max_users: number;
  max_bookings: number;
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
};

interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: "user" | "customer";
  roles: string[];
  permissions: string[];
  tenantId: number;
  roleId: number;
}

type PlanForm = Omit<PlanDB, 'id' | 'created_at'> & { id?: number };
export type SubscriptionStatus = 'active' | 'expired' | 'deleted';

export interface Subscription {
  id?: number;
  tenant_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status?: SubscriptionStatus;
  auto_renew?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ================= Constants =================
const pageSize = 6;
const API_BASE_URL = '/api/v1/admin';

// ================= Component =================
export default function PlanMainPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const isSuperAdmin = user?.roleId === 9;

  const [plans, setPlans] = useState<PlanDB[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
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

  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<PlanDB | null>(null);

  // ===== Subscription Modal =====
  const subscriptionModal = useDisclosure();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingSubscription, setSubmittingSubscription] = useState(false);
  const viewSubscriptionModal = useDisclosure();
  const [currentSubscription, setCurrentSubscription] = useState<Subscription[]>([]);

  // ================= Effects =================
  useEffect(() => {
    fetchPlans();
  }, [page, search]);

  useEffect(() => {
    if (plans.length) setSelectedPlanId(plans[0].id);
  }, [plans]);

  // ================= Helpers =================
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

  // ================= API =================
  const fetchSubscription = async (planId: number) => {
  if (!planId) return;

  try {
    const params: Record<string, string> = {
      plan_id: planId.toString(),
      page: "1",
      pageSize: "20",
    };

    if (user?.tenantId) {
      params.tenant_id = user.tenantId.toString();
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
  const fetchPlans = async () => {
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
// ===== Cancel Subscription Function =====
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
      fetchSubscription(subscription.plan_id);
    }

  } catch (err: any) {
    addToast({ title: 'Error', description: err.message, color: 'danger' });
  }
  };

  // ===== Add Subscription =====
  const addSubscription = async () => {
  if (!user || selectedPlanId === null) return;

  const plan = plans.find(p => p.id === Number(selectedPlanId));
  if (!plan) return;

  setSubmittingSubscription(true);
  try {
    const start = new Date(startDate);
    const end = new Date(start);
    if (plan.billing_cycle === 'monthly') end.setMonth(end.getMonth() + 1);
    else end.setFullYear(end.getFullYear() + 1);

    const payload = {
      tenant_id: Number(user.tenantId),
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

    subscriptionModal.onClose();
  } catch (err: any) {
    addToast({ title: 'Error', description: err.message, color: 'danger' });
  } finally {
    setSubmittingSubscription(false);
  }
  };

// ===== Update Subscription Function =====
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

    fetchSubscription(subscription.plan_id);
  } catch (err: any) {
    addToast({ title: 'Error', description: err.message, color: 'danger' });
  }
  };

  // ===== Save Plan =====
  const savePlan = async () => {
    if (!isSuperAdmin) return;

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
      editModal.onClose();
      fetchPlans();
    } catch (e: any) {
      setSubmitError(e.message || 'Save failed');
    }
  };

  // ===== Delete Plan =====
  const executeDelete = async () => {
    if (!isSuperAdmin || !deleteTarget) return;
    deleteModal.onClose();
    try {
      const res = await fetch(`${API_BASE_URL}/plans/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'accept-language': language },
      });
      if (!res.ok) throw new Error('Delete failed');
      addToast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted', color: 'success' });
      fetchPlans();
    } catch (e: any) {
      addToast({ title: 'Error', description: e.message, color: 'danger' });
    }
  };

  // ================= Render =================
  return (
    <div className="p-6">
      {/* ===== Header + Search + New Button ===== */}
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

      {/* ===== Table ===== */}
      <Table selectionMode="none">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Price</TableColumn>
          <TableColumn>Billing</TableColumn>
          <TableColumn>Limits</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn className="text-end">Actions</TableColumn>
        </TableHeader>

        <TableBody isLoading={loading} emptyContent="No plans">
          {plans.map(plan => (
            <TableRow key={plan.id}>
              <TableCell>{plan.name}</TableCell>
              <TableCell>{plan.price} {plan.currency_code}</TableCell>
              <TableCell>{plan.billing_cycle}</TableCell>
              <TableCell>🚗 {plan.max_cars} | 👤 {plan.max_users} | 📅 {plan.max_bookings}</TableCell>
              <TableCell>{plan.status}</TableCell>
              <TableCell className="flex justify-end gap-2">
                {isSuperAdmin && (
                  <>
                    <Button
                      isIconOnly
                      variant="flat"
                      onPress={() => { setIsEditing(true); setFormData(plan); editModal.onOpen(); }}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      isIconOnly
                      variant="flat"
                      color="danger"
                      onPress={() => { setDeleteTarget(plan); deleteModal.onOpen(); }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                    
                  </>
                )}
             <div className="flex gap-2">
  {/* View Subscription – للجميع */}
  <Button
    size="sm"
    variant="flat"
    onPress={async () => {
      await fetchSubscription(plan.id);
      viewSubscriptionModal.onOpen();
    }}
  >
    {language === 'ar' ? 'عرض الاشتراك' : 'View Subscription'}
  </Button>

  {/* Add Subscription – فقط لغير السوبر */}
  {!isSuperAdmin && (
    <Button
      size="sm"
      startContent={<PlusIcon className="h-4 w-4" />}
      onPress={() => {
        setSelectedPlanId(plan.id);
        subscriptionModal.onOpen();
      }}
    >
      {language === 'ar' ? 'إضافة اشتراك' : 'Add Subscription'}
    </Button>
  )}


</div>

              </TableCell>
            </TableRow>
          ))}
          
        </TableBody>
        
      </Table>

      {/* ===== Pagination ===== */}
      <div className="mt-4 flex justify-end">
        <Pagination page={page} total={totalPages} onChange={setPage} />
      </div>

      {/* ===== Create / Edit Modal ===== */}
      <Modal isOpen={editModal.isOpen} onOpenChange={editModal.onOpenChange} size="lg">
        <ModalContent>
          <Form onSubmit={(e) => { e.preventDefault(); savePlan(); }}>
            <ModalHeader>{isEditing ? 'Edit Plan' : 'New Plan'}</ModalHeader>
            <ModalBody className="max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submitError && (
                  <div className="md:col-span-2">
                    <Alert color="danger" title="Error" description={submitError} />
                  </div>
                )}
                <Input label="Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} isRequired />
                <Input label="Description" value={formData.description || ''} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                <Input type="number" label="Price" value={formData.price.toString()} onChange={e => setFormData(p => ({ ...p, price: Number(e.target.value) }))} />
              <Select
  label="Currency"
  selectedKeys={new Set([formData.currency_code])} 
  onSelectionChange={keys => {
    const key = Array.from(keys)[0] as 'USD' | 'EUR' | 'ILS';
    setFormData(p => ({ ...p, currency_code: key }));
  }}
>
  <SelectItem key="USD">USD</SelectItem>
  <SelectItem key="EUR">EUR</SelectItem>
  <SelectItem key="ILS">ILS</SelectItem>
</Select>

                <Input type="number" label="Max Cars" value={formData.max_cars.toString()} onChange={e => setFormData(p => ({ ...p, max_cars: Number(e.target.value) }))} />
                <Input type="number" label="Max Users" value={formData.max_users.toString()} onChange={e => setFormData(p => ({ ...p, max_users: Number(e.target.value) }))} />
                <Input type="number" label="Max Bookings" value={formData.max_bookings.toString()} onChange={e => setFormData(p => ({ ...p, max_bookings: Number(e.target.value) }))} />
              <Select
  label="Billing Cycle"
  selectedKeys={new Set([formData.billing_cycle])} // string مسموح
  onSelectionChange={(keys) => {
    const key = Array.from(keys)[0] as 'monthly' | 'yearly';
    setFormData(p => ({ ...p, billing_cycle: key }));
  }}
>
  <SelectItem key="monthly">Monthly</SelectItem>
  <SelectItem key="yearly">Yearly</SelectItem>
</Select>

              <Select
  label="Status"
  selectedKeys={new Set([formData.status])} // string
  onSelectionChange={(keys) => {
    const key = Array.from(keys)[0] as 'active' | 'inactive' | 'deleted';
    setFormData(p => ({ ...p, status: key }));
  }}
>
  <SelectItem key="active">Active</SelectItem>
  <SelectItem key="inactive">Inactive</SelectItem>
  <SelectItem key="deleted">Deleted</SelectItem>
</Select>

              </div>
            </ModalBody>
            <ModalFooter>
              <Button type="submit">Save</Button>
              <Button variant="light" onPress={editModal.onClose}>Cancel</Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>

      {/* ===== Delete Modal ===== */}
      <Modal isOpen={deleteModal.isOpen} onOpenChange={deleteModal.onOpenChange}>
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>Are you sure?</ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={executeDelete}>Delete</Button>
            <Button variant="light" onPress={deleteModal.onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ===== Subscription Modal ===== */}
      <Modal isOpen={subscriptionModal.isOpen} onOpenChange={subscriptionModal.onOpenChange} size="md">
        <ModalContent>
          <ModalHeader>{language === 'ar' ? 'إضافة اشتراك' : 'Add Subscription'}</ModalHeader>
          <ModalBody>
            <Input
              type="date"
              label={language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <Select
              label={language === 'ar' ? 'اختر خطة' : 'Select Plan'}
              selectedKeys={selectedPlanId !== null ? new Set([String(selectedPlanId)]) : new Set()}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0];
                setSelectedPlanId(key ? Number(key) : null);
              }}
            >
              {plans.map(plan => (
                <SelectItem key={String(plan.id)} textValue={String(plan.id)}>
                  {plan.name} - {plan.price} {plan.currency_code} ({plan.billing_cycle})
                </SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button onPress={addSubscription} isLoading={submittingSubscription}>
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
            <Button variant="light" onPress={subscriptionModal.onClose}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* ===== View Subscription Modal ===== */}
<Modal
  isOpen={viewSubscriptionModal.isOpen}
  onOpenChange={viewSubscriptionModal.onOpenChange}
  size="md"
>
  <ModalContent>
    <ModalHeader>
      {language === 'ar' ? 'تفاصيل الاشتراك' : 'Subscription Details'}
    </ModalHeader>
 {currentSubscription.length > 0 && !isSuperAdmin && (
 <div className="flex justify-center mt-2">
  <Button
    color="danger"
    size="sm"
    onPress={() => deleteSubscription(currentSubscription[0])}
  >
    <TrashIcon className="h-5 w-5" />
  </Button>
</div>

)}
    <ModalBody>
      {currentSubscription.length > 0 ? (
        <div className="space-y-3 text-sm">
          {currentSubscription.map((sub, index) => (
            <div
              key={index}
              className="p-2 border rounded bg-gray-50 dark:bg-gray-800"
            >
              <p>
                <strong>{language === 'ar' ? 'الخطة:' : 'Plan ID:'}</strong>{' '}
                {sub.plan_id} 
              </p>
               <p>
                <strong>{language === 'ar' ? 'اسم الشركة :' : 'Tenant name:'}</strong>{' '}
                {sub.tenant_id}
              </p>
              <p>
                <strong>{language === 'ar' ? 'تاريخ البداية:' : 'Start Date:'}</strong>{' '}
                {sub.start_date}
              </p>
              <p>
                <strong>{language === 'ar' ? 'تاريخ النهاية:' : 'End Date:'}</strong>{' '}
                {sub.end_date}
              </p>
              <p>
                <strong>{language === 'ar' ? 'الحالة:' : 'Status:'}</strong>{' '}
                {sub.status}
              </p>
              <p>
                <strong>{language === 'ar' ? 'تجديد تلقائي:' : 'Auto Renew:'}</strong>{' '}
                {sub.auto_renew ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}
              </p>
     
<Button
  size="sm"
  variant="flat"
  color={sub.auto_renew ? 'success' : 'warning'}
  onPress={() => updateSubscription(sub, { auto_renew: !sub.auto_renew })}
>
  {sub.auto_renew
    ? (language === 'ar' ? 'إيقاف التجديد التلقائي' : 'Disable Auto Renew')
    : (language === 'ar' ? 'تفعيل التجديد التلقائي' : 'Enable Auto Renew')}
</Button>

      {/* Delete Subscription – فقط للسوبر أدمن */}
      {isSuperAdmin && (
        <Button
          size="sm"
          color="danger"
          variant="flat"
          onPress={() => deleteSubscription(sub)}
        >
          {language === 'ar' ? 'حذف الاشتراك' : 'Delete Subscription'}
        </Button>
      )}
            </div>
          ))}
        </div>
      ) : (
        <Alert
          color="warning"
          title={language === 'ar' ? 'لا يوجد اشتراك لهذه الخطة' : 'No subscription for this plan'}
        />
      )}
    </ModalBody>

    <ModalFooter>
      <Button variant="light" onPress={viewSubscriptionModal.onClose}>
        {language === 'ar' ? 'إغلاق' : 'Close'}
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>


    </div>
  );
}
