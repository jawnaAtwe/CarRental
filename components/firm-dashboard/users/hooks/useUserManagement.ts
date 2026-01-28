// ================= useUserManagement Hook =================

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { addToast, useDisclosure } from '@heroui/react';
import { UserDB, UserForm, SessionUser, Role, Tenant, DeleteTarget } from '../types/user.types';
import { UserApiService } from '../services/user.api.service';
import { PAGE_SIZE } from '../constants/user.constants';

export const useUserManagement = (language: string) => {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  // ================= Session & Permissions =================
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;

  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );

  // ================= Data States =================
  const [users, setUsers] = useState<UserDB[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  // ================= Filters & Pagination =================
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_approval' | 'pending_verification' | 'disabled'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ================= UI States =================
  const [activeUser, setActiveUser] = useState<UserDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // ================= Form Data =================
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

  // ================= Modals =================
  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  // ================= Effects =================
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

  // ================= Fetch Functions =================
  const fetchTenants = async () => {
    setTenantsLoading(true);
    try {
      const data = await UserApiService.fetchTenants(language);
      setTenants(data);
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

      const data = await UserApiService.fetchRoles(language, selectedTenantId);
      setRoles(data);
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
    if (!selectedTenantId) return;
    
    setLoading(true);
    try {
      const { users: fetchedUsers, totalPages: pages, totalCount: count } = 
        await UserApiService.fetchUsers(language, selectedTenantId, page, PAGE_SIZE, search, statusFilter);
      
      setUsers(fetchedUsers);
      setTotalPages(pages);
      setTotalCount(count);
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

  const fetchUserDetails = async (userId: number) => {
    if (!selectedTenantId) return;
    
    setLoading(true);
    try {
      const data = await UserApiService.fetchUserDetails(language, userId, selectedTenantId);
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

  // ================= Delete Functions =================
  const handleDeleteUser = async (id: number) => {
    if (!selectedTenantId) return;
    
    setLoading(true);
    try {
      const msg = await UserApiService.deleteUser(language, id, selectedTenantId);
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
    if (!selectedTenantId) return;
    
    const selectedUserIds = Array.from(selectedKeys).map(key => Number(key));
    if (selectedUserIds.length === 0) return;

    setLoading(true);
    try {
      const msg = await UserApiService.bulkDeleteUsers(language, selectedTenantId, selectedUserIds);
      setSelectedKeys(new Set());
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

  // ================= Form Functions =================
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

  const saveUser = async () => {
    if (!formData.role_id) {
      setSubmitError(language === 'ar' ? 'يجب اختيار الدور الوظيفي' : 'Role is required');
      return;
    }

    if (!selectedTenantId) return;

    setLoadingForm(true);

    try {
      const data = await UserApiService.saveUser(language, formData, isEditing, selectedTenantId);

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ المستخدم بنجاح' : 'User saved successfully'),
        color: 'success',
      });

      editModal.onClose();
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('saveUser error:', error);
      setSubmitError(error.message);
    } finally {
      setLoadingForm(false);
    }
  };

  return {
    // Session & Auth
    sessionLoaded,
    isSuperAdmin,
    user,
    
    // Tenant
    selectedTenantId,
    setSelectedTenantId,
    tenants,
    tenantsLoading,
    
    // Users
    users,
    loading,
    
    // Roles
    roles,
    rolesError,
    rolesLoading,
    fetchRoles,
    
    // Filters & Pagination
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    
    // Selection
    selectedKeys,
    setSelectedKeys,
    
    // Active User
    activeUser,
    
    // Modals
    viewModal,
    editModal,
    deleteModal,
    
    // Delete
    deleteTarget,
    confirmDelete,
    executeDelete,
    
    // Form
    isEditing,
    formData,
    setFormData,
    submitError,
    loadingForm,
    openCreateUser,
    openEditUser,
    saveUser,
    resetForm,
    
    // Actions
    fetchUserDetails,
  };
};