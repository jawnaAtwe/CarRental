'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import moment from 'moment';

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
  addToast,
  Alert,
  Form,
  Textarea,
  Tooltip,
} from '@heroui/react';

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  BuildingOffice2Icon,
  MapPinIcon
} from '@heroicons/react/24/solid';

import { GlobeAltIcon } from '@heroicons/react/24/solid';

import { useLanguage } from '../context/LanguageContext';
import { TableSkeleton } from '@/lib/Skeletons';

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

type BranchForm = {
  id?: number;
  name: string;
  name_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status?: BranchDB['status'];
  tenant_id?: number;
};

interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: 'user' | 'customer';
  roles: string[];
  permissions: string[];
  tenantId: number;
  roleId: number;
}

const pageSize = 6;
const API_BASE_URL = '/api/v1/admin';

export default function BranchesPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
       !isSuperAdmin ? user?.tenantId : undefined
     );
  const [branches, setBranches] = useState<BranchDB[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeBranch, setActiveBranch] = useState<BranchDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [tenants, setTenants] = useState<{id: number, name: string}[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [formData, setFormData] = useState<BranchForm>({
    name: '',
    name_ar: '',
    address: '',
    address_ar: '',
    latitude: '',
    longitude: '',
    status: 'active',
    tenant_id: selectedTenantId,
  });
  const [submitError, setSubmitError] = useState<string[] | string>([]);

  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);

  const showToast = (title: string, description: string, color: 'success' | 'danger' | 'warning') => {
    console.log(`[${color.toUpperCase()}] ${title}: ${description}`);
   
  };

 useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);
    useEffect(() => {
    if (sessionLoaded && isSuperAdmin) fetchTenants();
  }, [sessionLoaded, isSuperAdmin]);
    useEffect(() => {
  if (!isSuperAdmin && user) {
    setSelectedTenantId(user.tenantId);
  }
}, [user, isSuperAdmin]);
  useEffect(() => {
  if (!isSuperAdmin && user?.tenantId) {
    fetchBranches();
  }

  if (isSuperAdmin && selectedTenantId !== undefined) {
    fetchBranches();
  }
}, [language, page, search, sessionLoaded,statusFilter, selectedTenantId, user, isSuperAdmin]);


  // ------------------ Fetch Branches ------------------
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: selectedTenantId!.toString(),
        page: String(page),
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
 const fetchTenants = async () => {
    setTenantsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenants(data.data || []);
    } catch (error) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as any)?.message || 'Failed to fetch tenants',
        color: 'danger'
      });
    } finally {
      setTenantsLoading(false);
    }
  };
  // ------------------ Delete Branch ------------------
  const handleDeleteBranch = async (id: number) => {
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

  const handleBulkDelete = async () => {
    const selectedBranchIds = Array.from(selectedKeys).map(Number);
    if (selectedBranchIds.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/branches`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId, branch_ids: selectedBranchIds }),
      });

      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }

      if (!response.ok) throw new Error(msg);
      setSelectedKeys(new Set());
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

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    if (deleteTarget.type === 'single' && deleteTarget.id) await handleDeleteBranch(deleteTarget.id);
    if (deleteTarget.type === 'bulk') await handleBulkDelete();
    setDeleteTarget(null);
  };

  // ------------------ View Branch ------------------
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

      setActiveBranch(data);
      viewModal.onOpen();
    } catch (error: any) {
      console.error('Error fetching branch details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'خطأ في جلب بيانات الفرع' : 'Error fetching branch details'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Form Handling ------------------
  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      address: '',
      address_ar: '',
      latitude: '',
      longitude: '',
      status: 'active',
      tenant_id: selectedTenantId,
    });
    setSubmitError([]);
  };

  const openCreateBranch = () => {
    setIsEditing(false);
    resetForm();
    editModal.onOpen();
  };

  const openEditBranch = (branch: BranchDB) => {
    setIsEditing(true);
    setFormData({
      id: branch.id,
      name: branch.name,
      name_ar: branch.name_ar ?? '',
      address: branch.address ?? '',
      address_ar: branch.address_ar ?? '',
      latitude: branch.latitude ?? '',
      longitude: branch.longitude ?? '',
      status: branch.status,
      tenant_id: branch.tenant_id ?? selectedTenantId,
    });
    setSubmitError([]);
    editModal.onOpen();
  };

  const saveBranch = async () => {
    const payload: Record<string, any> = {
      tenant_id: formData.tenant_id ?? selectedTenantId,
      name: formData.name?.trim(),
      name_ar: formData.name_ar?.trim() || null,
      address: formData.address?.trim() || null,
      address_ar: formData.address_ar?.trim() || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
    };

    setLoadingForm(true);
    try {
      const endpoint = isEditing && formData.id ? `${API_BASE_URL}/branches/${formData.id}` : `${API_BASE_URL}/branches`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ الفرع بنجاح' : 'Branch saved successfully'),
        color: 'success',
      });
      editModal.onClose();
      resetForm();
      fetchBranches();
    } catch (error) {
      console.error('saveBranch error:', error);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoadingForm(false);
    }
  };

  // ------------------ Status Chip ------------------
 const statusChip = (status: BranchDB['status']) => {
    const statusText = 
      status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
      status === 'deleted' ? (language === 'ar' ? 'محذوف' : 'Deleted') : status;

    return (
      <Tooltip 
        showArrow 
        className="capitalize" 
        color={status === 'active' ? 'success' : status === 'deleted' ? 'warning' : 'default'} 
        content={statusText}
      >
        <Chip
          size="sm"
          color={status === 'active' ? 'success' : status === 'deleted' ? 'warning' : 'default'}
          variant="flat"
        >
        </Chip>
      </Tooltip>
    );
  };
  // ------------------ Render ------------------
 return (
 <div className="min-h-screen 
                bg-gradient-to-b 
                from-gray-100 via-gray-100 to-white  /* النهار */
                dark:from-[#0B0F1A] dark:via-[#0B0F1A] dark:to-[#1C2030]  /* الليل */
                px-4 py-8 md:px-8">

    <div className="mx-auto w-full space-y-8">

      {/* ======= Tenant Selector (Super Admin Only) ======= */}
      {isSuperAdmin && sessionLoaded && (
        <Select
          size="md"
          label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
          onChange={(e) => setSelectedTenantId(Number(e.target.value))}
          isLoading={tenantsLoading}
        >
          {tenants.map((t) => (
            <SelectItem key={t.id}>{t.name}</SelectItem>
          ))}
        </Select>
      )}
      {/* Header */}
      <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
        <div>
         <p className="text-sm uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300">
            {language === 'ar' ? 'إدارة الفروع' : 'BRANCH MANAGEMENT'}
          </p>
         <h1 className="mt-2 text-3xl font-semibold text-text dark:text-white">
            {language === 'ar' ? 'الفروع' : 'BRANCHES'}
          </h1>
        </div>
        <div className="flex gap-2">
          {selectedKeys.size > 0 && (
            <Button
              variant="flat"
              color="danger"
              startContent={<TrashIcon className="h-4 w-4" />}
              onPress={() => confirmDelete('bulk')}
            >
              {language === 'ar' ? `حذف (${selectedKeys.size})` : `Delete (${selectedKeys.size})`}
            </Button>
          )}
          <Button
            variant="solid"
            color="primary"
            startContent={<PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />}
            onPress={openCreateBranch}
           className="
              relative overflow-hidden
              text-white font-extrabold tracking-wide
              rounded-3xl
              px-6 py-3
              bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500
              shadow-xl
              transition-all duration-500
              transform hover:scale-110 hover:shadow-2xl
              before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full
              before:bg-white/30 before:rotate-12 before:transition-all before:duration-500
              hover:before:w-[200%]
            "
          >
            {language === 'ar' ? 'فرع جديد' : 'New Branch'}
          </Button>
        </div>
      </section>

      {/* Table */}
      <Table
        aria-label={language === 'ar' ? 'جدول الفروع' : 'Branches table'}
       classNames={{
    table: 'min-w-full text-base bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300',
  }} selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
        topContent={
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
            <div className="flex flex-wrap gap-3 items-center">
              <Input
                startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />}
                placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                variant="faded"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
              <Button size="sm" variant="flat" onPress={() => setPage((prev) => Math.max(prev - 1, 1))} isDisabled={page === 1}>
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              <Button size="sm" variant="flat" onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))} isDisabled={page === totalPages}>
                {language === 'ar' ? 'التالي' : 'Next'}
              </Button>
            </div>
            <span className="text-xs text-foreground/50">
              {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <Pagination
              style={{ direction: 'ltr' }}
              page={page}
              total={totalPages}
              onChange={setPage}
              showControls
              color="primary"
              size="sm"
              isDisabled={branches.length === 0}
            />
          </div>
        }
      >
        <TableHeader>
          <TableColumn>{language === 'ar' ? 'الفرع' : 'Branch'}</TableColumn>
          <TableColumn>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</TableColumn>
          <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
        </TableHeader>

        {loading ? (
          <TableBody loadingContent={<TableSkeleton rows={8} columns={8} />} isLoading={loading} emptyContent="">
            {[]}
          </TableBody>
        ) : (
          <TableBody emptyContent={language === 'ar' ? 'لا يوجد فروع' : 'No branches found'}>
            {branches.map((branch) => (
              <TableRow key={String(branch.id)}  className="group bg-white dark:bg-gray-700/60 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-xl">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-400 rounded-full p-3 shadow-md transition-transform group-hover:scale-110">
                      <GlobeAltIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-text">{branch.name}</span>
                      {branch.status && <span>{statusChip(branch.status)}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {branch.created_at ? moment(branch.created_at).locale(language).format('DD MMM YYYY, hh:mm A') : '-'}
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="flat" color="primary" size="sm" startContent={<PencilSquareIcon className="h-4 w-4" />} onPress={() => openEditBranch(branch)}>
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button variant="flat" color="danger" size="sm" startContent={<TrashIcon className="h-4 w-4" />} onPress={() => confirmDelete('single', branch.id)}>
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      {/* Modals */}
      {/** View Modal */}
      <Modal isOpen={viewModal.isOpen} onClose={viewModal.onClose}>
        <ModalContent className="bg-white dark:bg-gray-800 text-black dark:text-gray-200">
          <ModalHeader>{language === 'ar' ? 'تفاصيل الفرع' : 'Branch Details'}</ModalHeader>
          <ModalBody>
            {activeBranch && (
              <div className="space-y-3">
                <p><strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {activeBranch.name}</p>
                <p><strong>{language === 'ar' ? 'العنوان:' : 'Address:'}</strong> {activeBranch.address || '-'}</p>
                <p><strong>{language === 'ar' ? 'الحالة:' : 'Status:'}</strong> {statusChip(activeBranch.status)}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={viewModal.onClose}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/** Edit/Create Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose}>
        <ModalContent>
          <ModalHeader>{isEditing ? (language === 'ar' ? 'تعديل الفرع' : 'Edit Branch') : (language === 'ar' ? 'فرع جديد' : 'New Branch')}</ModalHeader>
          <Form className="w-full">
            <ModalBody className="space-y-2">
              {submitError &&
                ((Array.isArray(submitError) && submitError.length > 0) || (typeof submitError === 'string' && submitError.trim() !== '')) && (
                  <Alert
                    title={isEditing
                      ? (language === 'ar' ? 'فشل الحفظ' : 'Save Failed')
                      : (language === 'ar' ? 'فشل الإنشاء' : 'Create Failed')}
                    description={
                      <ul className="list-disc list-inside">
                        {Array.isArray(submitError)
                          ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
                          : <p>{submitError}</p>}
                      </ul>
                    }
                    variant="flat"
                    color="danger"
                    className="mb-4"
                  />
                )}

          <div className="grid gap-4 md:grid-cols-2">
  <Input
    className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
    label={language === 'ar' ? 'اسم الفرع' : 'Branch Name'}
    variant="faded"
    startContent={<BuildingOffice2Icon className="h-5 w-5 text-foreground/50" />}
    value={formData.name}
    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
    isRequired
    errorMessage={language === 'ar' ? 'حقل مطلوب' : 'Required field'}
  />
  <Input
    className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
    label={language === 'ar' ? 'اسم الفرع بالعربي' : 'Branch Name (Arabic)'}
    variant="faded"
    startContent={<GlobeAltIcon className="h-5 w-5 text-foreground/50" />}
    value={formData.name_ar || ''}
    onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
  />
  <Textarea
    className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
    label={language === 'ar' ? 'العنوان' : 'Address'}
    variant="faded"
    minRows={2}
    startContent={<MapPinIcon className="h-5 w-5 text-foreground/50" />}
    value={formData.address || ''}
    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
  />
  <Textarea
    className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
    label={language === 'ar' ? 'العنوان بالعربي' : 'Address (Arabic)'}
    variant="faded"
    minRows={2}
    value={formData.address_ar || ''}
    onChange={(e) => setFormData((prev) => ({ ...prev, address_ar: e.target.value }))}
  />
  <Input
    className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
    label="Latitude"
    type="number"
    value={formData.latitude ?? ''}
    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
  />
  <Input
    className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
    label="Longitude"
    type="number"
    value={formData.longitude ?? ''}
    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
  />
</div>

            </ModalBody>
          </Form>
          <ModalFooter className="flex justify-end gap-3">
            <Button variant="flat" onPress={editModal.onClose}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button variant="solid" color="primary" isLoading={loadingForm} onPress={saveBranch}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/** Delete Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}</ModalHeader>
          <ModalBody>
            {deleteTarget?.type === 'single' ? (
              <p>{language === 'ar' ? 'هل أنت متأكد من حذف هذا الفرع؟' : 'Are you sure you want to delete this branch?'}</p>
            ) : (
              <p>{language === 'ar' ? `هل أنت متأكد من حذف ${selectedKeys.size} فروع؟` : `Are you sure you want to delete ${selectedKeys.size} branches?`}</p>
            )}
          </ModalBody>
          <ModalFooter className="flex justify-end gap-3">
            <Button variant="flat" onPress={deleteModal.onClose}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button variant="solid" color="danger" onPress={executeDelete}>{language === 'ar' ? 'حذف' : 'Delete'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  </div>
);}
