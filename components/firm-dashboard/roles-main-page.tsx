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
  ShieldCheckIcon, 
  MagnifyingGlassIcon, 
  InformationCircleIcon,
  TagIcon,
  UserGroupIcon,
  KeyIcon
} from '@heroicons/react/24/solid';

import { useLanguage } from '../context/LanguageContext';
import { lang } from '../Lang/lang';
import { TableSkeleton } from "@/lib/Skeletons";
import moment from 'moment';
import { User } from "@heroui/react";

type Permission = {
  permission_id: number;
  id?: number;
  name: string;
  name_ar?: string;
  code?: string;
  description?: string;
  description_ar?: string;
};

type AvailablePermission = {
  id: number;
  name: string;
  name_ar?: string;
  code: string;
  description?: string;
  description_ar?: string;
};

type RoleDB = {
  id: number;
  tenant_id: number;
  slug: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  created_at?: string | null;
  permissions?: Permission[];
};

type RoleForm = {
  id?: number;
  slug: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  tenant_id?: number;
  permissions: number[];
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
const pageSize = 6;
const API_BASE_URL = '/api/v1/admin';

export default function RolesPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [roles, setRoles] = useState<RoleDB[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<AvailablePermission[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeRole, setActiveRole] = useState<RoleDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [tenants, setTenants] = useState<{id: number, name: string}[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [formData, setFormData] = useState<RoleForm>({
    slug: '',
    name: '',
    name_ar: '',
    description: '',
    tenant_id:  selectedTenantId,
    permissions: [],
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
    fetchRoles();
    fetchAvailablePermissions();
  }

  if (isSuperAdmin && selectedTenantId !== undefined) {
    fetchRoles();
    fetchAvailablePermissions();
  }
}, [language, page, search, sessionLoaded, selectedTenantId, user, isSuperAdmin]);

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
    setLoading(true);
    try {
       if (!selectedTenantId) {
        console.error("Tenant ID is missing");
        return; 
      }
      const params = new URLSearchParams({
        tenant_id: selectedTenantId.toString(),
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      const response = await fetch(`${API_BASE_URL}/roles?${params}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      
      setRoles(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.count ?? 0);
    } catch (error: any) {
      console.error(error);
      showToast(
        language === 'ar' ? 'خطأ في جلب الأدوار' : 'Error fetching roles',
        error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    setLoadingPermissions(true);
    try {
        if (!selectedTenantId) {
        console.error("Tenant ID is missing");
        return; 
      }
      const response = await fetch(
        `${API_BASE_URL}/permissions/list?tenant_id=${selectedTenantId}`,
        {
          headers: {
            'accept-language': language,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      setAvailablePermissions(data.data || data || []);
    } catch (error: any) {
      console.error(error);
      showToast(
        language === 'ar' ? 'خطأ في جلب الصلاحيات' : 'Error fetching permissions',
        error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
        'danger'
      );
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 
          'accept-language': language, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ tenant_id: selectedTenantId }),
      });

      if (!response.ok) throw new Error('Failed to delete role');
      
      await fetchRoles();
      showToast(
        language === 'ar' ? 'تم الحذف' : 'Deleted',
        language === 'ar' ? 'تم حذف الدور بنجاح' : 'Role deleted successfully',
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'خطأ في حذف الدور' : 'Error deleting role',
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
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'DELETE',
        headers: { 
          'accept-language': language, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          tenant_id: selectedTenantId, 
          role_ids: selectedIds 
        }),
      });

      if (!response.ok) throw new Error('Failed to delete roles');
      
      setSelectedKeys(new Set([]));
      await fetchRoles();
      showToast(
        language === 'ar' ? 'تم الحذف' : 'Deleted',
        language === 'ar' ? 'تم حذف الأدوار بنجاح' : 'Roles deleted successfully',
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'خطأ في حذف الأدوار' : 'Error deleting roles',
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
      await handleDeleteRole(deleteTarget.id);
    }
    if (deleteTarget.type === 'bulk') {
      await handleBulkDelete();
    }
    setDeleteTarget(null);
  };

  const fetchRoleDetails = async (roleId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/roles/${roleId}?tenant_id=${selectedTenantId}`, 
        {
          headers: { 'accept-language': language },
        }
      );

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setActiveRole(data);
      viewModal.onOpen();
    } catch (error) {
      console.error('Error fetching role details:', error);
      showToast(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'خطأ في جلب بيانات الدور' : 'Error fetching role details',
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      name_ar: '',
      description: '',
      tenant_id: selectedTenantId,
      permissions: [],
    });
    setSubmitError([]);
  };

  const openCreateRole = () => {
    setIsEditing(false);
    resetForm();
    editModal.onOpen();
  };

  const openEditRole = (role: RoleDB) => {
    setIsEditing(true);
    setFormData({
      id: role.id,
      slug: role.slug,
      name: role.name,
      name_ar: role.name_ar || '',
      description: role.description || '',
      tenant_id: role.tenant_id || selectedTenantId,
      permissions: role.permissions?.map(p => p.permission_id ?? p.id!) || [],
    });
    editModal.onOpen();
    setSubmitError([]);
  };

  const saveRole = async () => {
    // التحقق من البيانات المطلوبة
    if (!formData.name.trim()) {
      setSubmitError(language === 'ar' ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    if (!formData.slug.trim()) {
      setSubmitError(language === 'ar' ? 'المعرف (slug) مطلوب' : 'Slug is required');
      return;
    }

    const payload: Record<string, any> = {
      tenant_id: formData.tenant_id ?? selectedTenantId,
      slug: formData.slug.trim(),
      name: formData.name.trim(),
      name_ar: formData.name_ar?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      permissions: formData.permissions,
    };

    setLoadingForm(true);
    setSubmitError([]);

    try {
      const endpoint = isEditing && formData.id 
        ? `${API_BASE_URL}/roles/${formData.id}` 
        : `${API_BASE_URL}/roles`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 
          'accept-language': language, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(data?.error || data?.message || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      showToast(
        language === 'ar' ? 'تم الحفظ' : 'Saved',
        data?.message || (language === 'ar' ? 'تم حفظ الدور بنجاح' : 'Role saved successfully'),
        'success'
      );

      editModal.onClose();
      resetForm();
      fetchRoles();
    } catch (error) {
      console.error('saveRole error:', error);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoadingForm(false);
    }
  };

  // Helper functions for multi-select
  const getSelectedIds = (): number[] => {
    if (selectedKeys === "all") {
      return roles.map(r => r.id);
    }
    return Array.from(selectedKeys).map(key => Number(key));
  };

  const selectedCount = selectedKeys === "all" ? roles.length : selectedKeys.size;

  const togglePermission = (permissionId: number) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  };

  const toggleAllPermissions = () => {
    if (formData.permissions.length === availablePermissions.length) {
      setFormData((prev) => ({ ...prev, permissions: [] }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        permissions: availablePermissions.map(p => p.id) 
      }));
    }
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
          <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
          <p className="text-sm uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300 transition-colors duration-300">
  {language === 'ar' ? 'إدارة الأدوار' : 'ROLES MANAGEMENT'}
            </p>
       <h1 className="mt-2 text-3xl font-semibold text-black dark:text-white transition-colors duration-300">
   {language === 'ar' ? 'الأدوار' : 'Roles'}
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
              onPress={openCreateRole}
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
              {language === 'ar' ? 'دور جديد' : 'New Role'}
            </Button>
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={deleteModal.isOpen} onOpenChange={deleteModal.onOpenChange} backdrop="blur">
          <ModalContent className="bg-content1/95">
            {(onClose) => (
              <>
                <ModalHeader className="text-xl font-semibold text-danger">
                  {deleteTarget?.type === 'bulk' 
                    ? (language === 'ar' ? 'حذف جماعي' : 'Bulk Delete')
                    : (language === 'ar' ? 'حذف الدور' : 'Delete Role')
                  }
                </ModalHeader>
                <ModalBody>
                  <p className="text-foreground/80 text-md leading-relaxed">
                    {deleteTarget?.type === 'bulk'
                      ? (language === 'ar' 
                          ? `هل أنت متأكد من حذف ${selectedCount} دور؟`
                          : `Are you sure you want to delete ${selectedCount} roles?`)
                      : (language === 'ar'
                          ? 'هل أنت متأكد أنك تريد حذف هذا الدور؟'
                          : 'Are you sure you want to delete this role?')
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

        {/* Main Table */}
        <Table
          aria-label={language === 'ar' ? 'جدول الأدوار' : 'Roles table'}
            classNames={{ table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300' }}
        
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          topContent={
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
            <div className="flex flex-wrap gap-3 items-center">
                <Input
                  startContent={<MagnifyingGlassIcon  className="h-5 w-5 text-foreground/50" />}
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
             <span className="text-sm text-foreground/60">{language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}</span>
         
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
                  : `Page ${page} of ${totalPages}`
                }
              </span>
              <Pagination 
                style={{ direction: 'ltr' }} 
                page={page} 
                total={totalPages} 
                onChange={setPage} 
                showControls 
                color="primary" 
                size="sm" 
                isDisabled={roles.length === 0} 
              />
            </div>
          }
        >
          <TableHeader>
            <TableColumn>{language === 'ar' ? 'الدور' : 'Role'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'الوصف' : 'Description'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</TableColumn>
            <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
          </TableHeader>
          {loading ? (
            <TableBody loadingContent={<TableSkeleton rows={8} columns={5} />} isLoading={loading} emptyContent="">
              {[]}
            </TableBody>
          ) : (
            <TableBody emptyContent={language === 'ar' ? 'لا توجد أدوار' : 'No roles found'}>
              {roles.map((role) => (
                <TableRow key={role.id}  className="group 
                     bg-white/90 dark:bg-gray-800/80 
                     rounded-xl shadow-md 
                     transition-all duration-300 
                     hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl">
                  <TableCell>
                    <User
                      avatarProps={{ icon: <UserGroupIcon className="h-5 w-5" />, size: 'md' }}
                      name={
                        <span>
                          {language === 'ar' 
                            ? (role.name_ar || role.name) 
                            : role.name
                          }
                        </span>
                      }
                      description={
                        <div className="text-xs text-foreground/70 flex items-center gap-1">
                          <TagIcon className="h-3 w-3" />
                          <span>{role.slug}</span>
                        </div>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground/70">
                      {role.description || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color="primary" variant="flat" startContent={<KeyIcon className="h-4 w-4" />}>
                      {role.permissions?.length || 0} {language === 'ar' ? 'صلاحية' : 'permissions'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {moment(role.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
                  </TableCell>
                  <TableCell className="flex items-center justify-end gap-2">
                    <Button 
                      isIconOnly 
                      radius="full" 
                      variant="flat" 
                      color="default" 
                      onPress={() => fetchRoleDetails(role.id)}
                    >
                      <InformationCircleIcon className="h-5 w-5" />
                    </Button>
                  <Button variant="flat" color="primary" size="sm" startContent={<PencilSquareIcon className="h-4 w-4" />}
                      onPress={() => openEditRole(role)}
                    >
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                   <Button variant="flat" color="danger" size="sm" startContent={<TrashIcon className="h-4 w-4" />} 
                      onPress={() => confirmDelete('single', role.id)}
                    > {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* View Modal */}
      <Modal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange} size="lg" backdrop="blur">
     <ModalContent className="bg-white dark:bg-gray-800/95 transition-colors duration-300">
          {() =>
            activeRole && (
              <>
                <ModalHeader className="flex items-center gap-3">
                  <Avatar icon={<UserGroupIcon className="h-6 w-6" />} size="md" />
                  <div>
                    <p className="text-lg font-semibold">
                      {language === 'ar' 
                        ? activeRole.name_ar || activeRole.name 
                        : activeRole.name
                      }
                    </p>
                   <p className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      <TagIcon className="h-3 w-3" />
                      {activeRole.slug}
                    </p>
                  </div>
                </ModalHeader>
                <ModalBody className="space-y-4">
                  <Divider />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'الوصف' : 'Description'}
                    </p>
                    <p className="text-sm">
                      {activeRole.description || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                    </p>
                    <p className="text-sm">
                      {moment(activeRole.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
                      {language === 'ar' ? 'الصلاحيات' : 'Permissions'} ({activeRole.permissions?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeRole.permissions && activeRole.permissions.length > 0 ? (
                        activeRole.permissions.map((perm) => (
                          <Chip key={perm.permission_id} size="sm" color="secondary" variant="flat">
                            {language === 'ar' ? (perm.name_ar || perm.name) : perm.name}
                          </Chip>
                        ))
                      ) : (
                        <span className="text-sm text-foreground/50">
                          {language === 'ar' ? 'لا توجد صلاحيات' : 'No permissions'}
                        </span>
                      )}
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

      {/* Edit/Create Modal */}
      <Modal isOpen={editModal.isOpen} onOpenChange={editModal.onOpenChange} size="xl" scrollBehavior="inside" backdrop="blur">
        <ModalContent className="bg-content1/95">
          {(onClose) => (
            <>
              <ModalHeader className="text-xl font-semibold">
                {isEditing
                  ? (language === 'ar' ? 'تعديل الدور' : 'Edit Role')
                  : (language === 'ar' ? 'إنشاء دور جديد' : 'Create New Role')}
              </ModalHeader>
              <ModalBody className="space-y-4">
                {submitError &&    ((Array.isArray(submitError) && submitError.length > 0) ||
                      (typeof submitError === 'string' && submitError.trim() !== '')) && (
                  <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
                    {Array.isArray(submitError) ? submitError.join(', ') : submitError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label={language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      isRequired
                    />
                    <Input
                      label={language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}
                      value={formData.name_ar || ''}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    />
                  </div>
                  <Input
                    label={language === 'ar' ? 'المعرف (Slug)' : 'Slug'}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    isRequired
                  />
                  <Textarea
                    label={language === 'ar' ? 'الوصف' : 'Description'}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />

                  <Divider className="my-2" />

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {language === 'ar' ? 'الصلاحيات' : 'Permissions'} ({formData.permissions.length}/{availablePermissions.length})
                    </p>
                    <Button size="sm" variant="flat" onPress={toggleAllPermissions}>
                      {formData.permissions.length === availablePermissions.length
                        ? (language === 'ar' ? 'إلغاء الكل' : 'Deselect All')
                        : (language === 'ar' ? 'تحديد الكل' : 'Select All')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-content2 rounded-lg">
                    {loadingPermissions ? (
                      <span className="text-sm text-foreground/60">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
                    ) : availablePermissions.length === 0 ? (
                      <span className="text-sm text-foreground/60">{language === 'ar' ? 'لا توجد صلاحيات متاحة' : 'No permissions available'}</span>
                    ) : (
                      availablePermissions.map((perm) => (
                        <Chip
                          key={perm.id}
                          size="sm"
                          variant="flat"
                          color={formData.permissions.includes(perm.id) ? 'primary' : 'default'}
                          className="cursor-pointer"
                          onClick={() => togglePermission(perm.id)}
                        >
                          {language === 'ar' ? perm.name_ar || perm.name : perm.name}
                        </Chip>
                      ))
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="justify-end gap-2">
                <Button variant="light" onPress={onClose} isDisabled={loadingForm}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button color="primary" onPress={saveRole} isLoading={loadingForm}>
                  {language === 'ar' ? (isEditing ? 'تحديث' : 'حفظ') : (isEditing ? 'Update' : 'Save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}