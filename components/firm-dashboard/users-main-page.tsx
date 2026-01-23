'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
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
  Tooltip,
  User
} from '@heroui/react';

import { 
  PencilSquareIcon, 
  PlusIcon, 
  TrashIcon, 
  ShieldExclamationIcon, 
  ShieldCheckIcon, 
  NoSymbolIcon, 
  MagnifyingGlassIcon, 
  CheckBadgeIcon, 
  InformationCircleIcon,
  UserIcon, 
  GlobeAltIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon, 
  LockClosedIcon, 
  BriefcaseIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

import { useLanguage } from '../context/LanguageContext';
import { TableSkeleton } from "@/lib/Skeletons";

// ------------------- Types -------------------

type UserDB = {
  id: number;
  tenant_id: number;
  role_id: number;
  full_name: string;
  full_name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  password_hash?: string | null;
  status: 'pending_verification' | 'active' | 'disabled' | 'deleted' | 'pending_approval';
  created_at?: string | null;
};

type UserForm = {
  id?: number;
  name: string;
  name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  status: UserDB['status'];
  role_id?: string | number | null;
  password?: string;
  tenant_id?: number;
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

// ------------------- Constants -------------------

const pageSize = 6;
const API_BASE_URL = '/api/v1/admin';

// ------------------- Component -------------------

export default function UsersPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  // ------------------- States -------------------

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;

  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );

  const [users, setUsers] = useState<UserDB[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_verification' | 'disabled'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [activeUser, setActiveUser] = useState<UserDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [tenants, setTenants] = useState<{id: number, name: string}[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  const [formData, setFormData] = useState<UserForm>({
    name: '',
    name_ar: '',
    email: '',
    phone: '',
    status: 'active',
    role_id: '',
    tenant_id: selectedTenantId,
  });

  const [submitError, setSubmitError] = useState<string[] | string>([]);

  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);

  // ------------------- Effects -------------------

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
  // جلب البيانات فقط إذا:
  // 1. المستخدم مش SuperAdmin → tenant موجود في السيشن
  // 2. SuperAdmin → tenant محدد
  if (!isSuperAdmin && user?.tenantId) {
    fetchRoles();
    fetchUsers();
  }

  if (isSuperAdmin && selectedTenantId !== undefined) {
    fetchRoles();
    fetchUsers();
  }
}, [language, page, search, statusFilter, sessionLoaded, selectedTenantId, user, isSuperAdmin]);
  useEffect(() => {
    if (isEditing && activeUser && roles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        role_id: String(activeUser.role_id),
      }));
    }
  }, [roles, isEditing, activeUser]);

  // ------------------- Functions -------------------

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

  const fetchRoles = async () => {
    setRolesLoading(true);
    setRolesError(null);

    try {
      if (!selectedTenantId) {
        console.error("Tenant ID is missing");
        return; 
      }

      const params = new URLSearchParams({ tenant_id: selectedTenantId.toString() });

      const response = await fetch(`${API_BASE_URL}/roles?${params}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.data)) {
        setRoles(data.data);
      } else if (Array.isArray(data)) {
        setRoles(data);
      } else {
        throw new Error('Invalid roles data format');
      }
      setRolesError(null);

    } catch (error: any) {
      console.error('Error fetching roles:', error);
      const errorMsg =
        language === 'ar'
          ? `فشل تحميل الأدوار: ${error?.message || 'خطأ في الخادم'}`
          : `Failed to load roles: ${error?.message || 'Server error'}`;

      setRolesError(errorMsg);
      setRoles([]);

      addToast({
        title: language === 'ar' ? 'تحذير' : 'Warning',
        description: errorMsg,
        color: 'warning',
      });

    } finally {
      setRolesLoading(false);
    }
  };

  const fetchUsers = async () => {
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

      const response = await fetch(`${API_BASE_URL}/users?${params}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setUsers(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.count ?? (data.data ? data.data.length : 0));
    } catch (error: any) {
      console.error(error);
      addToast({ 
        title: language === 'ar' ? 'خطأ في جلب المستخدمين' : 'Error fetching users', 
        description: error?.message || (language === 'ar' ? 'خطأ' : 'Error'), 
        color: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

 const handleDeleteUser = async (id: number) => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
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

    await fetchUsers();

    addToast({ 
      title: language === 'ar' ? 'تم الحذف' : 'Deleted', 
      description: msg, 
      color: 'success' 
    });
  } catch (error: any) {
    console.error(error);
    addToast({ 
      title: language === 'ar' ? 'خطأ' : 'Error', 
      description: error?.message || (language === 'ar' ? 'خطأ في حذف المستخدم' : 'Error deleting user'), 
      color: 'danger' 
    });
  } finally { 
    setLoading(false); 
  }
};


 const handleBulkDelete = async () => {
  const selectedUserIds = Array.from(selectedKeys).map(key => Number(key));
  if (selectedUserIds.length === 0) return;

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: selectedTenantId, user_ids: selectedUserIds }),
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
    await fetchUsers();

    addToast({ 
      title: language === 'ar' ? 'تم الحذف' : 'Deleted', 
      description: msg, // الرسالة من الباك مباشرة
      color: 'success' 
    });
  } catch (error: any) {
    console.error(error);
    addToast({ 
      title: language === 'ar' ? 'خطأ' : 'Error', 
      description: error?.message || (language === 'ar' ? 'خطأ في حذف المستخدمين' : 'Error deleting users'), 
      color: 'danger' 
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
    if (deleteTarget.type === 'single' && deleteTarget.id) await handleDeleteUser(deleteTarget.id);
    if (deleteTarget.type === 'bulk') await handleBulkDelete();
    setDeleteTarget(null);
  };

  const fetchUserDetails = async (userId: number) => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}?tenant_id=${selectedTenantId}`, {
      headers: { 'accept-language': language },
    });

    let msg = '';
    let data: any = null;
    try {
      data = await response.json();
      msg = data?.message || '';
    } catch {
      msg = await response.text();
    }

    if (!response.ok) throw new Error(msg || response.statusText);

    setActiveUser(data);
    viewModal.onOpen();
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    addToast({ 
      title: language === 'ar' ? 'خطأ' : 'Error', 
      description: error?.message || (language === 'ar' ? 'خطأ في جلب بيانات المستخدم' : 'Error fetching user details'), 
      color: 'danger' 
    });
  } finally {
    setLoading(false);
  }
};


  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      email: '',
      phone: '',
      status: 'active',
      role_id: '',
      tenant_id: selectedTenantId,
    });
    setSubmitError([]);
  };

  const openCreateUser = () => {
    if (roles.length === 0) {
      addToast({
        title: language === 'ar' ? 'تحذير' : 'Warning',
        description: language === 'ar' 
          ? 'لا يمكن إضافة مستخدم. يرجى التأكد من تحميل الأدوار أولاً' 
          : 'Cannot add user. Please ensure roles are loaded first',
        color: 'warning'
      });
      return;
    }
    setIsEditing(false);
    resetForm();
    editModal.onOpen();
  };

  const openEditUser = (user: UserDB) => {
    setIsEditing(true);
    setFormData({
      id: user.id,
      name: user.full_name,
      name_ar: user.full_name_ar || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status,
      role_id: user.role_id ? String(user.role_id) : '',
      tenant_id: user.tenant_id || selectedTenantId,
    });
    setActiveUser(user);
    editModal.onOpen();
    setSubmitError([]);
  };
const toggleUserStatus = async (userId: number, currentStatus: UserDB['status']) => {
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active';

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, tenant_id: selectedTenantId }),
    });

    let msg = '';
    try {
      const data = await response.json();
      msg = data?.message || '';
    } catch {
      msg = await response.text().catch(() => '');
    }

    if (!response.ok) throw new Error(msg || 'Failed to update user status');

    await fetchUsers();
    addToast({ 
      title: language === 'ar' ? 'تم التحديث' : 'Updated', 
      description: language === 'ar' ? 'تم تحديث حالة المستخدم بنجاح' : 'User status updated successfully', 
      color: 'success' 
    });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    addToast({ 
      title: language === 'ar' ? 'خطأ' : 'Error', 
      description: error?.message || (language === 'ar' ? 'خطأ في تحديث الحالة' : 'Error updating status'), 
      color: 'danger' 
    });
  } finally {
    setLoading(false);
  }
};

  const saveUser = async () => {
    if (!formData.role_id) {
      setSubmitError(language === 'ar' ? 'يجب اختيار الدور الوظيفي' : 'Role is required');
      return;
    }

    const payload: Record<string, any> = {
      full_name: formData.name?.trim(),
      full_name_ar: formData.name_ar?.trim() || null,
      email: formData.email?.trim() || null,
      phone: formData.phone?.trim() || null,
      role_id: Number(formData.role_id),
      tenant_id: formData.tenant_id ?? selectedTenantId,
      ...(formData.password ? { password: formData.password } : {}),
    };

    if (isEditing) {
      payload.status = formData.status;
    }
    
    setLoadingForm(true);

    try {
      const endpoint = isEditing && formData.id ? `${API_BASE_URL}/users/${formData.id}` : `${API_BASE_URL}/users`;
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
        description: data?.message || (language === 'ar' ? 'تم حفظ المستخدم بنجاح' : 'User saved successfully'),
        color: 'success',
      });

      editModal.onClose();
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('saveUser error:', error);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoadingForm(false);
    }
  };

 
  const statusChip = (status: UserDB['status']) => {
    const statusText = 
      status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
      status === 'disabled' ? (language === 'ar' ? 'معطل' : 'Disabled') :
      status === 'pending_verification' ? (language === 'ar' ? 'في انتظار التحقق' : 'Pending Verification') :
      status === 'pending_approval' ? (language === 'ar' ? 'في انتظار الموافقة' : 'Pending Approval') :
      status === 'deleted' ? (language === 'ar' ? 'محذوف' : 'Deleted') : status;

    return (
      <Tooltip 
        showArrow 
        className="capitalize" 
        color={status === 'active' ? 'success' : status === 'pending_verification' ? 'warning' : 'default'} 
        content={statusText}
      >
        <Chip
          size="sm"
          color={status === 'active' ? 'success' : status === 'pending_verification' ? 'warning' : 'default'}
          variant="flat"
        >
          {status === 'active' ?
            <ShieldCheckIcon className="h-4 w-4" />
            : status === 'disabled' ?
              <NoSymbolIcon className="h-4 w-4" />
              : <ShieldExclamationIcon className="h-4 w-4" />
          }
        </Chip>
      </Tooltip>
    );
  };

  const roleChip = (roleId?: number | null) => {
    if (!roleId) {
      return <Chip size="sm" variant="flat" color="default">-</Chip>;
    }

    if (roles.length === 0) {
      return (
        <Chip size="sm" variant="flat" color="warning">
          ID: {roleId}
        </Chip>
      );
    }

    const role = roles.find((r) => Number(r.id) === Number(roleId));

    if (!role) {
      return (
        <Chip size="sm" variant="flat" color="warning">
          ID: {roleId}
        </Chip>
      );
    }

    return (
      <Chip size="sm" color="primary" variant="solid">
        {language === 'ar' ? (role.name_ar || role.name) : role.name}
      </Chip>
    );
  };

  return (
    <div className="min-h-screen 
                bg-gradient-to-b 
                from-gray-100 via-gray-100 to-white          /* النهار */
                dark:from-gray-900 dark:via-gray-800 dark:to-gray-950  /* الليل */
                px-4 py-8 md:px-8
                transition-colors duration-300">

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
 {/* ======= Header & Action Buttons ======= */}
      <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em]">
            {language === 'ar' ? 'إدارة المستخدمين' : 'USER MANAGEMENT'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text">
            {language === 'ar' ? 'المستخدمون' : 'Users'}
          </h1>
        </div>

        <div className="flex gap-2">
          {/* Bulk Delete Button */}
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

          {/* Create New User Button */}
          <Button
            variant="solid"
            color="primary"
            startContent={
              <PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />
            }
            onPress={openCreateUser}
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
            <span className="relative animate-gradient-text bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
              {language === 'ar' ? 'مستخدم جديد' : 'New User'}
            </span>
          </Button>
        </div>
      </section>

        {rolesError && (
          <Alert
            title={language === 'ar' ? 'تحذير: فشل تحميل الأدوار' : 'Warning: Failed to load roles'}
            description={
              <div className="space-y-2">
                <p>{rolesError}</p>
                <Button 
                  size="sm" 
                  color="primary" 
                  variant="flat"
                  onPress={fetchRoles}
                  isLoading={rolesLoading}
                >
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </div>
            }
            variant="flat"
            color="warning"
            startContent={<ExclamationTriangleIcon className="h-5 w-5" />}
          />
        )}

        <Modal isOpen={deleteModal.isOpen} onOpenChange={deleteModal.onOpenChange} backdrop="blur">
          <ModalContent className="bg-white dark:bg-gray-800/95 transition-colors duration-300">
            {(onClose) => (
              <>
                <ModalHeader className="text-xl font-semibold text-danger">
                  {deleteTarget?.type === 'bulk' 
                    ? (language === 'ar' ? 'حذف متعدد' : 'Bulk Delete')
                    : (language === 'ar' ? 'حذف المستخدم' : 'Delete User')
                  }
                </ModalHeader>
                <ModalBody>
                  <p className="text-foreground/80 text-md leading-relaxed">
                    {deleteTarget?.type === 'bulk'
                      ? (language === 'ar' 
                          ? `هل أنت متأكد من حذف ${selectedKeys.size} مستخدم؟`
                          : `Are you sure you want to delete ${selectedKeys.size} users?`)
                      : (language === 'ar' 
                          ? 'هل أنت متأكد أنك تريد حذف هذا المستخدم؟'
                          : 'Are you sure you want to delete this user?')
                    }
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
<Table
  aria-label={language === 'ar' ? 'جدول المستخدمين' : 'Users table'}
  classNames={{
    table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300',
  }}
  selectionMode="multiple"
  selectedKeys={selectedKeys}
  onSelectionChange={(keys) => {
    if (keys === "all") {
      setSelectedKeys(new Set(users.map(u => String(u.id))));
    } else {
      setSelectedKeys(keys as Set<string>);
    }
  }}

  /* ======= Top Content: Search & Filter ======= */
  topContent={
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
      
      {/* Search Input & Status Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
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

        {/* Status Filter */}
        <Select
          startContent={<CheckBadgeIcon className="h-5 w-5 text-foreground/50" />}
          variant="faded"
          placeholder={language === 'ar' ? 'الحالة' : 'Status'}
          className="min-w-[160px] transition-all duration-200 focus:shadow-md focus:border-primary"
          selectedKeys={[statusFilter]}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setPage(1);
          }}
        >
          <SelectItem key="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
          <SelectItem key="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
          <SelectItem key="pending_verification">{language === 'ar' ? 'في انتظار التحقق' : 'Pending Verification'}</SelectItem>
          <SelectItem key="disabled">{language === 'ar' ? 'معطل' : 'Disabled'}</SelectItem>
        </Select>
      </div>

      {/* Total Count */}
      <span className="text-sm text-foreground/60">
        {language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}
      </span>
    </div>
  }

  /* ======= Bottom Content: Pagination & Navigation ======= */
  bottomContent={
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border-t border-border">
      
      {/* Previous / Next Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="flat"
          className="transition-transform duration-200 hover:scale-105"
          onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
          isDisabled={page === 1}
        >
          {language === 'ar' ? 'السابق' : 'Previous'}
        </Button>
        <Button
          size="sm"
          variant="flat"
          className="transition-transform duration-200 hover:scale-105"
          onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          isDisabled={page === totalPages}
        >
          {language === 'ar' ? 'التالي' : 'Next'}
        </Button>
      </div>

      {/* Page Info */}
      <span className="text-xs text-foreground/50">
        {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
      </span>

      {/* Pagination Component */}
      <Pagination
        style={{ direction: 'ltr' }}
        page={page}
        total={totalPages}
        onChange={setPage}
        showControls
        color="primary"
        size="sm"
        isDisabled={users.length === 0}
      />
    </div>
  }
>
  <TableHeader>
    <TableColumn>{language === 'ar' ? 'المستخدم' : 'User'}</TableColumn>
    <TableColumn>{language === 'ar' ? 'الدور' : 'Role'}</TableColumn>
    <TableColumn>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</TableColumn>
    <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
  </TableHeader>

  {loading ? (
    <TableBody loadingContent={<TableSkeleton rows={8} columns={8} />} isLoading={loading} emptyContent={""}>{[]}</TableBody>
  ) : (
    <TableBody emptyContent={language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}>
      {users.map((user) => (
        <TableRow 
          key={String(user.id)} 
         className="
  group
  bg-white/90 dark:bg-gray-800/90
  rounded-xl
  shadow-md dark:shadow-gray-700/50
  transition-all duration-300
  hover:scale-[1.02]
  hover:bg-white dark:hover:bg-gray-700
  hover:shadow-xl dark:hover:shadow-gray-600/40
"

        >
          <TableCell>
            <div className="flex items-center gap-2">
              <User
                aria-label={language === 'ar' ? `عرض المستخدم ${user.full_name}` : `View user ${user.full_name}`}
                avatarProps={{ src: '', size: 'md' }}
                name={
                  <div className="flex items-center gap-1">
                    {statusChip(user.status)} {/* true يعني مع تأثير hover */}
                    <span>{language === 'ar' ? (user.full_name_ar || user.full_name) : user.full_name}</span>
                  </div>
                }
                description={
                  <div className="text-xs text-foreground/50">
                    <p>{user.phone || user.email}</p>
                  </div>
                }
              />
            </div>
          </TableCell>

          <TableCell>{roleChip(user.role_id)}</TableCell>

          <TableCell>
            <div className="flex items-center gap-3">
              {moment(user.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
            </div>
          </TableCell>
          
          <TableCell className="flex items-center justify-end gap-2">
            <Button 
              isIconOnly radius="full" variant="flat" color="default" 
              className="transition-transform duration-200 hover:scale-110 hover:bg-background/30"
              onPress={() => fetchUserDetails(user.id)}
            >
              <InformationCircleIcon className="h-5 w-5" />
            </Button>
           <Button variant="flat" color="primary" size="sm" startContent={<PencilSquareIcon className="h-4 w-4" />}
              onPress={() => openEditUser(user)}
            >
                {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
           <Button variant="flat" color="danger" size="sm" startContent={<TrashIcon className="h-4 w-4" />} 
              onPress={() => confirmDelete('single', user.id)}
            >  {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )}
</Table>
      </div>

      <Modal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange} size="lg" backdrop="blur">
        <ModalContent className="bg-content1/95">
          {() =>
            activeUser && (
              <>
                <ModalHeader className="flex items-center gap-3">
                  <Avatar size="md" name={activeUser.full_name} src={''} />
                  <div>
                    <p className="text-lg font-semibold">
                      {language === 'ar' ? activeUser.full_name_ar || activeUser.full_name : activeUser.full_name}
                    </p>
                  </div>
                </ModalHeader>
                <ModalBody className="space-y-4">
                  <Divider />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                    </p>
                    <p className="text-sm">{activeUser.email || '-'}</p>
                    <p className="text-sm">{activeUser.phone || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">
                        {language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                      </p>
                      <p className="text-sm">{roleChip(activeUser.role_id)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">
                        {language === 'ar' ? 'الحالة' : 'Status'}
                      </p>
                      <p className="text-sm">{statusChip(activeUser.status)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">
                        {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                      </p>
                      <p className="text-sm">{activeUser.created_at ? moment(activeUser.created_at).locale(language).format('DD MMM YYYY, hh:mm A') : '-'}</p>
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

      <Modal
        isDismissable={false}
        isOpen={editModal.isOpen}
        onOpenChange={editModal.onOpenChange}
        size="xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent className="bg-content1/95">
          {(onClose) => (
            <>
            <ModalHeader
  className="
    relative overflow-hidden
    px-6 py-5
    rounded-t-2xl
    bg-gradient-to-br from-primary/15 via-primary/5 to-background
    backdrop-blur-md
    flex items-center gap-3
    text-xl font-semibold
    animate-in fade-in slide-in-from-top-3
  "
>
  <span
    className="
      absolute -top-10 -right-10
      h-24 w-24
      rounded-full
      bg-primary/20
      blur-3xl
      pointer-events-none
    "
  />

  {/* Icon */}
  <div
    className="
      flex h-10 w-10 items-center justify-center
      rounded-full
      bg-primary/15
      text-primary
      shadow-sm
      animate-in zoom-in-50
    "
  >
    {isEditing ? "✏️" : "➕"}
  </div>

  {/* Title */}
  <div className="flex flex-col leading-tight">
    <span>
      {isEditing
        ? language === "ar"
          ? "تعديل المستخدم"
          : "Edit User"
        : language === "ar"
          ? "إنشاء مستخدم جديد"
          : "Create New User"}
    </span>

    <span className="text-xs font-normal text-foreground/60">
      {language === "ar"
        ? "إدارة بيانات المستخدم"
        : "Manage user information"}
    </span>
  </div>
</ModalHeader>
              <Form
                onSubmit={(e: any) => {
                  e.preventDefault();
                  saveUser();
                }}
                className="w-full"
              >
                <ModalBody className="space-y-2">
                  {submitError &&
                    ((Array.isArray(submitError) && submitError.length > 0) ||
                      (typeof submitError === 'string' && submitError.trim() !== '')) && (
                      <Alert
                        title={isEditing 
                          ? (language === 'ar' ? 'فشل الحفظ' : 'Save Failed')
                          : (language === 'ar' ? 'فشل الإنشاء' : 'Create Failed')
                        }
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

                  {rolesError && (
                    <Alert
                      title={language === 'ar' ? 'تحذير' : 'Warning'}
                      description={
                        <div className="space-y-2">
                          <p>{language === 'ar' 
                            ? 'لم يتم تحميل الأدوار. قد لا تتمكن من حفظ المستخدم.' 
                            : 'Roles failed to load. You may not be able to save the user.'}
                          </p>
                          <Button 
                            size="sm" 
                            color="primary" 
                            variant="flat"
                            onPress={fetchRoles}
                            isLoading={rolesLoading}
                          >
                            {language === 'ar' ? 'إعادة تحميل الأدوار' : 'Reload Roles'}
                          </Button>
                        </div>
                      }
                      variant="flat"
                      color="warning"
                      className="mb-4"
                    />
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      variant="faded"
                      startContent={<UserIcon className="h-5 w-5 text-foreground/50" />}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      isRequired
                      errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                    />
                    <Input
                      label={language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}
                      variant="faded"
                      startContent={<GlobeAltIcon className="h-5 w-5 text-foreground/50" />}
                      value={formData.name_ar || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name_ar: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      variant="faded"
                      label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      startContent={<EnvelopeIcon className="h-5 w-5 text-foreground/50" />}
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      isRequired
                      errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                    />
                    <Input
                      label={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      variant="faded"
                      startContent={<DevicePhoneMobileIcon className="h-5 w-5 text-foreground/50" />}
                      value={formData.phone || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Select
                      size="md"
                      label={language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                      startContent={<BriefcaseIcon className="h-5 w-5 text-foreground/60" />}
                      selectedKeys={formData.role_id ? [String(formData.role_id)] : []}
                      onChange={(e) =>
                        setFormData((prev: any) => ({ ...prev, role_id: e.target.value }))
                      }
                      variant="faded"
                      isRequired
                      isDisabled={roles.length === 0}
                      errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                      description={roles.length === 0 ? (language === 'ar' ? 'لا توجد أدوار متاحة' : 'No roles available') : ''}
                    >
                      {roles.map((role) => (
                        <SelectItem key={String(role.id ?? role.role_id)}>
                          {language === 'ar' ? (role.name_ar || role.name || role.role_name) : (role.name || role.role_name)}
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      type="password"
                      label={language === 'ar' ? 'كلمة المرور' : 'Password'}
                      variant="faded"
                      startContent={<LockClosedIcon className="h-5 w-5 text-foreground/50" />}
                      isRequired={!isEditing}
                      value={(formData as any).password || ''}
                      onChange={(e) =>
                        setFormData((prev: any) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder={isEditing 
                        ? (language === 'ar' ? 'اختياري - اتركه فارغاً لعدم التغيير' : 'Optional - leave blank to keep unchanged')
                        : ''
                      }
                      errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                    />
                  </div>

                  {isEditing && (
                    <div className="grid gap-4 md:grid-cols-1">
                      <Select
                        label={language === 'ar' ? 'الحالة' : 'Status'}
                        startContent={<ShieldCheckIcon className="h-5 w-5 text-foreground/60" />}
                        selectedKeys={[formData.status ? String(formData.status) : '']}
                        onChange={(e) =>
                          setFormData((prev: any) => ({ ...prev, status: e.target.value }))
                        }
                        variant="faded"
                        isRequired
                        errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                      >
                        <SelectItem key={'active'}>
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </SelectItem>
                        <SelectItem key={'pending_verification'}>
                          {language === 'ar' ? 'في انتظار التحقق' : 'Pending Verification'}
                        </SelectItem>
                        <SelectItem key={'pending_approval'}>
                          {language === 'ar' ? 'في انتظار الموافقة' : 'Pending Approval'}
                        </SelectItem>
                        <SelectItem key={'disabled'}>
                          {language === 'ar' ? 'معطل' : 'Disabled'}
                        </SelectItem>
                        <SelectItem key={'deleted'}>
                          {language === 'ar' ? 'محذوف' : 'Deleted'}
                        </SelectItem>
                      </Select>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter>
                  <Button
                    variant="light"
                    onPress={() => {
                      onClose();
                      resetForm();
                    }}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button 
                    color="primary" 
                    type="submit" 
                    isLoading={loadingForm}
                    isDisabled={roles.length === 0 && !isEditing}
                  >
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                </ModalFooter>
              </Form>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}