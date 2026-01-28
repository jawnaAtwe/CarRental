import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { RoleDB } from './types';
import { roleService } from '../services/roleService';
import { PAGE_SIZE } from '../constants';

export const useRoles = (
  language: string,
  selectedTenantId: number | undefined,
  page: number,
  search: string
) => {
  const [roles, setRoles] = useState<RoleDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRoles = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: selectedTenantId.toString(),
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(search && { search }),
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      const data = await roleService.fetchRoles(params, language);
      setRoles(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.count ?? 0);
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ في جلب الأدوار' : 'Error fetching roles',
        description: error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (roleId: number, tenantId: number) => {
    setLoading(true);
    try {
      const response = await roleService.deleteRole(roleId, tenantId, language);
      if (!response.ok) throw new Error('Failed to delete role');

      await fetchRoles();
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الدور بنجاح' : 'Role deleted successfully',
        color: 'success',
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'خطأ في حذف الدور' : 'Error deleting role',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteRoles = async (roleIds: number[], tenantId: number) => {
    if (roleIds.length === 0) return;

    setLoading(true);
    try {
      const response = await roleService.bulkDeleteRoles(roleIds, tenantId, language);
      if (!response.ok) throw new Error('Failed to delete roles');

      await fetchRoles();
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الأدوار بنجاح' : 'Roles deleted successfully',
        color: 'success',
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'خطأ في حذف الأدوار' : 'Error deleting roles',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleDetails = async (roleId: number, tenantId: number) => {
    setLoading(true);
    try {
      const data = await roleService.fetchRoleById(roleId, tenantId, language);
      return data;
    } catch (error) {
      console.error('Error fetching role details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'خطأ في جلب بيانات الدور' : 'Error fetching role details',
        color: 'danger',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [language, page, search, selectedTenantId]);

  return {
    roles,
    loading,
    totalPages,
    totalCount,
    fetchRoles,
    deleteRole,
    bulkDeleteRoles,
    fetchRoleDetails,
  };
};