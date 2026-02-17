'use client';
import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";

import {
  Avatar,
  Button,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  Tooltip,
  addToast,
  Textarea,
  Selection
} from '@heroui/react';
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

import { useLanguage } from '../context/LanguageContext';
import { TableSkeleton } from "@/lib/Skeletons";
import moment from 'moment';
import { User } from "@heroui/react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TenantStatus = 'active' | 'deleted';

type TenantDB = {
  id: number;
  name: string;
  legal_name?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  invoice_footer?: string | null;
  subdomain?: string | null;
  subscription_plan?: string | null;
  plan_expires_at?: string | null;
  max_branches?: number;
  max_cars?: number;
  max_users?: number;
  status?: TenantStatus;
  created_at?: string | null;
  updated_at?: string | null;
  currency_code?: string;
  currency?: string;
};

type TenantForm = {
  id?: number;
  name: string;
  legal_name: string;
  email: string;
  phone: string;
  website: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  invoice_footer: string;
  subdomain: string;
  subscription_plan: string;
  plan_expires_at: string;
  max_branches: number;
  max_cars: number;
  max_users: number;
  status: TenantStatus;
  currency_code: string;
  currency: string;
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

// ─── Constants ──────────────────────────────────────────────────────────────────

const pageSize = 6;
const API_BASE_URL = '/api/v1/admin';

const subscriptionPlans = ['basic', 'standard', 'premium', 'enterprise'];

const defaultForm: TenantForm = {
  name: '',
  legal_name: '',
  email: '',
  phone: '',
  website: '',
  logo_url: '',
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  invoice_footer: '',
  subdomain: '',
  subscription_plan: 'basic',
  plan_expires_at: '',
  max_branches: 1,
  max_cars: 50,
  max_users: 5,
  status: 'active',
  currency_code: 'ILS',
  currency: 'Shekel',
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  // ── State ──
  const [tenants, setTenants] = useState<TenantDB[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTenant, setActiveTenant] = useState<TenantDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [formData, setFormData] = useState<TenantForm>(defaultForm);
  const [submitError, setSubmitError] = useState<string[] | string>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);

  // ── Modals ──
  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  // ── Helpers ──
  const showToast = (title: string, description: string, color: 'success' | 'danger' | 'warning') => {
    console.log(`[${color.toUpperCase()}] ${title}: ${description}`);
    addToast({ title, description, color });
  };

  const getSelectedIds = (): number[] => {
    if (selectedKeys === "all") return tenants.map(t => t.id);
    return Array.from(selectedKeys).map(key => Number(key));
  };

  const selectedCount = selectedKeys === "all" ? tenants.length : (selectedKeys as Set<string>).size;

  // ── Data Fetching ──
  const fetchTenants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy: 'created_at',
        sortOrder: 'desc',
        ...(search && { search }),
      });

      const response = await fetch(`${API_BASE_URL}/tenants?${params}`, {
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();

      setTenants(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.count ?? 0);
    } catch (error: any) {
      console.error(error);
      showToast(
        language === 'ar' ? 'خطأ في جلب الشركات' : 'Error fetching tenants',
        error?.message || '',
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, page, search]);

  // ── CRUD ──
  const handleDeleteTenant = async (tenantId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete tenant');
      await fetchTenants();
      showToast(
        language === 'ar' ? 'تم الحذف' : 'Deleted',
        language === 'ar' ? 'تم حذف الشركة بنجاح' : 'Tenant deleted successfully',
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'خطأ في حذف الشركة' : 'Error deleting tenant',
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_ids: selectedIds }),
      });

      if (!response.ok) throw new Error('Failed to delete tenants');
      setSelectedKeys(new Set([]));
      await fetchTenants();
      showToast(
        language === 'ar' ? 'تم الحذف' : 'Deleted',
        language === 'ar' ? 'تم حذف الشركات بنجاح' : 'Tenants deleted successfully',
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'خطأ في الحذف الجماعي' : 'Error deleting tenants',
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    if (deleteTarget.type === 'single' && deleteTarget.id) {
      await handleDeleteTenant(deleteTarget.id);
    } else if (deleteTarget.type === 'bulk') {
      await handleBulkDelete();
    }
    setDeleteTarget(null);
  };

  const fetchTenantDetails = async (tenantId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
        headers: { 'accept-language': language },
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setActiveTenant(data);
      viewModal.onOpen();
    } catch (error) {
      console.error(error);
      showToast(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'خطأ في جلب بيانات الشركة' : 'Error fetching tenant details',
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setSubmitError([]);
  };

  const openCreateTenant = () => {
    setIsEditing(false);
    resetForm();
    editModal.onOpen();
  };

  const openEditTenant = (tenant: TenantDB) => {
    setIsEditing(true);
    setFormData({
      id: tenant.id,
      name: tenant.name || '',
      legal_name: tenant.legal_name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      website: tenant.website || '',
      logo_url: tenant.logo_url || '',
      primary_color: tenant.primary_color || '#3B82F6',
      secondary_color: tenant.secondary_color || '#10B981',
      invoice_footer: tenant.invoice_footer || '',
      subdomain: tenant.subdomain || '',
      subscription_plan: tenant.subscription_plan || 'basic',
      plan_expires_at: tenant.plan_expires_at
        ? moment(tenant.plan_expires_at).format('YYYY-MM-DD')
        : '',
      max_branches: tenant.max_branches ?? 1,
      max_cars: tenant.max_cars ?? 50,
      max_users: tenant.max_users ?? 5,
      status: tenant.status ?? 'active',
      currency_code: tenant.currency_code || 'ILS',
      currency: tenant.currency || 'Shekel',
    });
    setSubmitError([]);
    editModal.onOpen();
  };

  const saveTenant = async () => {
    if (!formData.name.trim()) {
      setSubmitError(language === 'ar' ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setSubmitError(language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }

    const payload: Record<string, any> = {
      name: formData.name.trim(),
      legal_name: formData.legal_name?.trim() || undefined,
      email: formData.email.trim(),
      phone: formData.phone?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      logo_url: formData.logo_url?.trim() || undefined,
      primary_color: formData.primary_color || undefined,
      secondary_color: formData.secondary_color || undefined,
      invoice_footer: formData.invoice_footer?.trim() || undefined,
      subdomain: formData.subdomain?.trim() || undefined,
      subscription_plan: formData.subscription_plan || undefined,
      plan_expires_at: formData.plan_expires_at || undefined,
      max_branches: Number(formData.max_branches),
      max_cars: Number(formData.max_cars),
      max_users: Number(formData.max_users),
      status: formData.status,
      currency_code: formData.currency_code?.trim() || 'ILS',
      currency: formData.currency?.trim() || 'Shekel',
    };

    setLoadingForm(true);
    setSubmitError([]);

    try {
      const endpoint = isEditing && formData.id
        ? `${API_BASE_URL}/tenants/${formData.id}`
        : `${API_BASE_URL}/tenants`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(data?.error || data?.message || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      showToast(
        language === 'ar' ? 'تم الحفظ' : 'Saved',
        data?.message || (language === 'ar' ? 'تم حفظ الشركة بنجاح' : 'Tenant saved successfully'),
        'success'
      );

      editModal.onClose();
      resetForm();
      fetchTenants();
    } catch (error) {
      console.error('saveTenant error:', error);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoadingForm(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen
                    bg-gradient-to-b
                    from-gray-100 via-gray-100 to-white
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-950
                    px-4 py-8 md:px-8
                    transition-colors duration-300">
      <div className="mx-auto w-full space-y-8">

        {/* ── Header ── */}
        <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300 transition-colors duration-300">
              {language === 'ar' ? 'إدارة الشركات' : 'TENANTS MANAGEMENT'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-black dark:text-white transition-colors duration-300">
              {language === 'ar' ? 'الشركات' : 'Tenants'}
            </h1>
          </div>
          <div className="flex gap-2">
            {selectedCount > 0 && (
              <Button
                variant="flat"
                color="danger"
                startContent={<TrashIcon className="h-4 w-4" />}
                onPress={() => confirmDelete('bulk')}
              >
                {language === 'ar' ? `حذف (${selectedCount})` : `Delete (${selectedCount})`}
              </Button>
            )}
            <Button
              color="primary"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={openCreateTenant}
              className="
                relative overflow-hidden
                text-white font-extrabold tracking-wide
                rounded-3xl px-6 py-3
                bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500
                shadow-xl transition-all duration-500
                transform hover:scale-110 hover:shadow-2xl
                before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full
                before:bg-white/30 before:rotate-12 before:transition-all before:duration-500
                hover:before:w-[200%]
              "
            >
              {language === 'ar' ? 'شركة جديدة' : 'New Tenant'}
            </Button>
          </div>
        </section>

        {/* ── Delete Confirmation Modal ── */}
        <Modal isOpen={deleteModal.isOpen} onOpenChange={deleteModal.onOpenChange} backdrop="blur">
          <ModalContent className="bg-content1/95">
            {(onClose) => (
              <>
                <ModalHeader className="text-xl font-semibold text-danger">
                  {deleteTarget?.type === 'bulk'
                    ? (language === 'ar' ? 'حذف جماعي' : 'Bulk Delete')
                    : (language === 'ar' ? 'حذف الشركة' : 'Delete Tenant')}
                </ModalHeader>
                <ModalBody>
                  <p className="text-foreground/80 text-md leading-relaxed">
                    {deleteTarget?.type === 'bulk'
                      ? (language === 'ar'
                        ? `هل أنت متأكد من حذف ${selectedCount} شركة؟`
                        : `Are you sure you want to delete ${selectedCount} tenants?`)
                      : (language === 'ar'
                        ? 'هل أنت متأكد أنك تريد حذف هذه الشركة؟'
                        : 'Are you sure you want to delete this tenant?')}
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button color="danger" onPress={executeDelete}>
                    {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* ── Main Table ── */}
        <Table
          aria-label={language === 'ar' ? 'جدول الشركات' : 'Tenants table'}
          classNames={{ table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300' }}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          topContent={
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />}
                  placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                  variant="faded"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="min-w-[240px] transition-all duration-200 focus:shadow-md focus:border-primary"
                />
              </div>
              <span className="text-sm text-foreground/60">
                {language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}
              </span>
            </div>
          }
          bottomContent={
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border-t border-border">
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
                  isDisabled={page === 1}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  isDisabled={page === totalPages}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
              <span className="text-xs text-foreground/50">
                {language === 'ar'
                  ? `صفحة ${page} من ${totalPages}`
                  : `Page ${page} of ${totalPages}`}
              </span>
              <Pagination
                style={{ direction: 'ltr' }}
                page={page}
                total={totalPages}
                onChange={setPage}
                showControls
                color="primary"
                size="sm"
                isDisabled={tenants.length === 0}
              />
            </div>
          }
        >
          <TableHeader>
            <TableColumn>{language === 'ar' ? 'الشركة' : 'Tenant'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'معلومات التواصل' : 'Contact'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'الباقة' : 'Plan'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'الحدود' : 'Limits'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'الحالة' : 'Status'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</TableColumn>
            <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
          </TableHeader>

          {loading ? (
            <TableBody
              loadingContent={<TableSkeleton rows={8} columns={7} />}
              isLoading={loading}
              emptyContent=""
            >
              {[]}
            </TableBody>
          ) : (
            <TableBody emptyContent={language === 'ar' ? 'لا توجد شركات' : 'No tenants found'}>
              {tenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className="group
                    bg-white/90 dark:bg-gray-800/80
                    rounded-xl shadow-md
                    transition-all duration-300
                    hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl"
                >
                  {/* Tenant Name */}
                  <TableCell>
                    <User
                      avatarProps={{
                        src: tenant.logo_url || undefined,
                        icon: !tenant.logo_url ? <BuildingOfficeIcon className="h-5 w-5" /> : undefined,
                        size: 'md',
                        style: tenant.primary_color
                          ? { backgroundColor: tenant.primary_color + '33' }
                          : undefined,
                      }}
                      name={
                        <span className="font-medium">{tenant.name}</span>
                      }
                      description={
                        <div className="text-xs text-foreground/70 flex items-center gap-1">
                          <GlobeAltIcon className="h-3 w-3" />
                          <span>{tenant.subdomain || '-'}</span>
                        </div>
                      }
                    />
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-foreground/70">
                      <div className="flex items-center gap-1">
                        <EnvelopeIcon className="h-3 w-3" />
                        <span>{tenant.email}</span>
                      </div>
                      {tenant.phone && (
                        <div className="flex items-center gap-1">
                          <PhoneIcon className="h-3 w-3" />
                          <span>{tenant.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Plan */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Chip size="sm" color="secondary" variant="flat">
                        {tenant.subscription_plan || '-'}
                      </Chip>
                      {tenant.plan_expires_at && (
                        <span className="text-xs text-foreground/50">
                          {moment(tenant.plan_expires_at).format('DD MMM YYYY')}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Limits */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-foreground/70">
                      <span>{language === 'ar' ? 'فروع:' : 'Branches:'} {tenant.max_branches}</span>
                      <span>{language === 'ar' ? 'سيارات:' : 'Cars:'} {tenant.max_cars}</span>
                      <span>{language === 'ar' ? 'مستخدمين:' : 'Users:'} {tenant.max_users}</span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      size="sm"
                      color={tenant.status === 'active' ? 'success' : 'danger'}
                      variant="flat"
                      startContent={
                        tenant.status === 'active'
                          ? <CheckBadgeIcon className="h-3 w-3" />
                          : <XCircleIcon className="h-3 w-3" />
                      }
                    >
                      {tenant.status === 'active'
                        ? (language === 'ar' ? 'نشط' : 'Active')
                        : (language === 'ar' ? 'محذوف' : 'Deleted')}
                    </Chip>
                  </TableCell>

                  {/* Created At */}
                  <TableCell>
                    {moment(tenant.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="flex items-center justify-end gap-2">
                    <Button
                      isIconOnly
                      radius="full"
                      variant="flat"
                      color="default"
                      onPress={() => fetchTenantDetails(tenant.id)}
                    >
                      <InformationCircleIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="flat"
                      color="primary"
                      size="sm"
                      startContent={<PencilSquareIcon className="h-4 w-4" />}
                      onPress={() => openEditTenant(tenant)}
                    >
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button
                      variant="flat"
                      color="danger"
                      size="sm"
                      startContent={<TrashIcon className="h-4 w-4" />}
                      onPress={() => confirmDelete('single', tenant.id)}
                    >
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>

        {/* ── View Modal ── */}
        <Modal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange} size="xl" backdrop="blur">
          <ModalContent className="bg-white dark:bg-gray-800/95 transition-colors duration-300">
            {() =>
              activeTenant && (
                <>
                  <ModalHeader className="flex items-center gap-3">
                    <Avatar
                      src={activeTenant.logo_url || undefined}
                      icon={!activeTenant.logo_url ? <BuildingOfficeIcon className="h-6 w-6" /> : undefined}
                      size="md"
                    />
                    <div>
                      <p className="text-lg font-semibold">{activeTenant.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{activeTenant.legal_name || '-'}</p>
                    </div>
                  </ModalHeader>

                  <ModalBody className="space-y-4">
                    <Divider />

                    {/* Contact Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </p>
                        <p className="text-sm">{activeTenant.email}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'الهاتف' : 'Phone'}
                        </p>
                        <p className="text-sm">{activeTenant.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}
                        </p>
                        <p className="text-sm">{activeTenant.website || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'النطاق الفرعي' : 'Subdomain'}
                        </p>
                        <p className="text-sm">{activeTenant.subdomain || '-'}</p>
                      </div>
                    </div>

                    <Divider />

                    {/* Plan & Limits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'باقة الاشتراك' : 'Subscription Plan'}
                        </p>
                        <Chip size="sm" color="secondary" variant="flat" className="mt-1">
                          {activeTenant.subscription_plan || '-'}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'انتهاء الباقة' : 'Plan Expires'}
                        </p>
                        <p className="text-sm">
                          {activeTenant.plan_expires_at
                            ? moment(activeTenant.plan_expires_at).locale(language).format('DD MMM YYYY')
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'الحدود القصوى' : 'Limits'}
                        </p>
                        <div className="flex gap-2 flex-wrap mt-1">
                          <Chip size="sm" variant="flat" color="default">
                            {language === 'ar' ? 'فروع:' : 'Branches:'} {activeTenant.max_branches}
                          </Chip>
                          <Chip size="sm" variant="flat" color="default">
                            {language === 'ar' ? 'سيارات:' : 'Cars:'} {activeTenant.max_cars}
                          </Chip>
                          <Chip size="sm" variant="flat" color="default">
                            {language === 'ar' ? 'مستخدمين:' : 'Users:'} {activeTenant.max_users}
                          </Chip>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'الحالة' : 'Status'}
                        </p>
                        <Chip
                          size="sm"
                          color={activeTenant.status === 'active' ? 'success' : 'danger'}
                          variant="flat"
                          className="mt-1"
                        >
                          {activeTenant.status === 'active'
                            ? (language === 'ar' ? 'نشط' : 'Active')
                            : (language === 'ar' ? 'محذوف' : 'Deleted')}
                        </Chip>
                      </div>
                    </div>

                    <Divider />

                    {/* Currency & Colors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'العملة' : 'Currency'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <CurrencyDollarIcon className="h-4 w-4 text-foreground/60" />
                          <span className="text-sm">{activeTenant.currency} ({activeTenant.currency_code})</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'الألوان' : 'Brand Colors'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {activeTenant.primary_color && (
                            <Tooltip content={activeTenant.primary_color}>
                              <div
                                className="h-5 w-5 rounded-full border border-foreground/20"
                                style={{ backgroundColor: activeTenant.primary_color }}
                              />
                            </Tooltip>
                          )}
                          {activeTenant.secondary_color && (
                            <Tooltip content={activeTenant.secondary_color}>
                              <div
                                className="h-5 w-5 rounded-full border border-foreground/20"
                                style={{ backgroundColor: activeTenant.secondary_color }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>

                    {activeTenant.invoice_footer && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'تذييل الفاتورة' : 'Invoice Footer'}
                        </p>
                        <p className="text-sm mt-1">{activeTenant.invoice_footer}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                        </p>
                        <p className="text-sm">
                          {moment(activeTenant.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-foreground/60">
                          {language === 'ar' ? 'آخر تحديث' : 'Updated At'}
                        </p>
                        <p className="text-sm">
                          {activeTenant.updated_at
                            ? moment(activeTenant.updated_at).locale(language).format('DD MMM YYYY, hh:mm A')
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </ModalBody>

                  <ModalFooter>
                    <Button variant="light" onPress={viewModal.onClose}>
                      {language === 'ar' ? 'إغلاق' : 'Close'}
                    </Button>
                  </ModalFooter>
                </>
              )
            }
          </ModalContent>
        </Modal>

        {/* ── Edit / Create Modal ── */}
        <Modal
          isOpen={editModal.isOpen}
          onOpenChange={editModal.onOpenChange}
          size="2xl"
          scrollBehavior="inside"
          backdrop="blur"
        >
          <ModalContent className="bg-content1/95">
            {(onClose) => (
              <>
                <ModalHeader className="text-xl font-semibold">
                  {isEditing
                    ? (language === 'ar' ? 'تعديل الشركة' : 'Edit Tenant')
                    : (language === 'ar' ? 'إنشاء شركة جديدة' : 'Create New Tenant')}
                </ModalHeader>

                <ModalBody className="space-y-4">
                  {submitError &&
                    ((Array.isArray(submitError) && submitError.length > 0) ||
                      (typeof submitError === 'string' && submitError.trim() !== '')) && (
                      <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
                        {Array.isArray(submitError) ? submitError.join(', ') : submitError}
                      </div>
                    )}

                  {/* ── Basic Info ── */}
                  <p className="text-xs uppercase tracking-wide text-foreground/60 font-medium">
                    {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label={language === 'ar' ? 'الاسم التجاري' : 'Business Name'}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      isRequired
                    />
                    <Input
                      label={language === 'ar' ? 'الاسم القانوني' : 'Legal Name'}
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    />
                    <Input
                      label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      isRequired
                    />
                    <Input
                      label={language === 'ar' ? 'الهاتف' : 'Phone'}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Input
                      label={language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                    <Input
                      label={language === 'ar' ? 'النطاق الفرعي' : 'Subdomain'}
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    />
                  </div>

                  <Input
                    label={language === 'ar' ? 'رابط الشعار' : 'Logo URL'}
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  />

                  <Divider className="my-2" />

                  {/* ── Branding ── */}
                  <p className="text-xs uppercase tracking-wide text-foreground/60 font-medium">
                    {language === 'ar' ? 'الهوية البصرية' : 'Branding'}
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-foreground/70">
                        {language === 'ar' ? 'اللون الأساسي' : 'Primary Color'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="h-9 w-16 cursor-pointer rounded border border-content3 bg-transparent"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          size="sm"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-foreground/70">
                        {language === 'ar' ? 'اللون الثانوي' : 'Secondary Color'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="h-9 w-16 cursor-pointer rounded border border-content3 bg-transparent"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          size="sm"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Textarea
                    label={language === 'ar' ? 'تذييل الفاتورة' : 'Invoice Footer'}
                    value={formData.invoice_footer}
                    onChange={(e) => setFormData({ ...formData, invoice_footer: e.target.value })}
                  />

                  <Divider className="my-2" />

                  {/* ── Subscription ── */}
                  <p className="text-xs uppercase tracking-wide text-foreground/60 font-medium">
                    {language === 'ar' ? 'الاشتراك' : 'Subscription'}
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Select
                      label={language === 'ar' ? 'باقة الاشتراك' : 'Subscription Plan'}
                      selectedKeys={formData.subscription_plan ? [formData.subscription_plan] : []}
                      onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                    >
                      {subscriptionPlans.map((plan) => (
                        <SelectItem key={plan}>{plan}</SelectItem>
                      ))}
                    </Select>
                    <Input
                      label={language === 'ar' ? 'انتهاء الباقة' : 'Plan Expires At'}
                      type="date"
                      value={formData.plan_expires_at}
                      onChange={(e) => setFormData({ ...formData, plan_expires_at: e.target.value })}
                    />
                  </div>

                  <Divider className="my-2" />

                  {/* ── Limits ── */}
                  <p className="text-xs uppercase tracking-wide text-foreground/60 font-medium">
                    {language === 'ar' ? 'الحدود القصوى' : 'Limits'}
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      label={language === 'ar' ? 'الحد الأقصى للفروع' : 'Max Branches'}
                      type="number"
                      min={1}
                      value={String(formData.max_branches)}
                      onChange={(e) => setFormData({ ...formData, max_branches: Number(e.target.value) })}
                    />
                    <Input
                      label={language === 'ar' ? 'الحد الأقصى للسيارات' : 'Max Cars'}
                      type="number"
                      min={1}
                      value={String(formData.max_cars)}
                      onChange={(e) => setFormData({ ...formData, max_cars: Number(e.target.value) })}
                    />
                    <Input
                      label={language === 'ar' ? 'الحد الأقصى للمستخدمين' : 'Max Users'}
                      type="number"
                      min={1}
                      value={String(formData.max_users)}
                      onChange={(e) => setFormData({ ...formData, max_users: Number(e.target.value) })}
                    />
                  </div>

                  <Divider className="my-2" />

                  {/* ── Currency & Status ── */}
                  <p className="text-xs uppercase tracking-wide text-foreground/60 font-medium">
                    {language === 'ar' ? 'العملة والحالة' : 'Currency & Status'}
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      label={language === 'ar' ? 'رمز العملة' : 'Currency Code'}
                      value={formData.currency_code}
                      maxLength={3}
                      onChange={(e) => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                    />
                    <Input
                      label={language === 'ar' ? 'اسم العملة' : 'Currency Name'}
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    />
                    <Select
                      label={language === 'ar' ? 'الحالة' : 'Status'}
                      selectedKeys={[formData.status]}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TenantStatus })}
                    >
                      <SelectItem key="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                      <SelectItem key="deleted">{language === 'ar' ? 'محذوف' : 'Deleted'}</SelectItem>
                    </Select>
                  </div>
                </ModalBody>

                <ModalFooter className="justify-end gap-2">
                  <Button variant="light" onPress={onClose} isDisabled={loadingForm}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button color="primary" onPress={saveTenant} isLoading={loadingForm}>
                    {language === 'ar'
                      ? (isEditing ? 'تحديث' : 'حفظ')
                      : (isEditing ? 'Update' : 'Save')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

      </div>
    </div>
  );
}