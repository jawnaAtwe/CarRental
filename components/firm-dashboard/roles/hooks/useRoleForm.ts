import { useState } from 'react';
import { addToast } from '@heroui/react';
import { RoleForm, RoleDB } from './types';
import { roleService } from '../services/roleService';

export const useRoleForm = (language: string, selectedTenantId: number | undefined) => {
  const [formData, setFormData] = useState<RoleForm>({
    slug: '',
    name: '',
    name_ar: '',
    description: '',
    tenant_id: selectedTenantId,
    permissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

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

  const setEditMode = (role: RoleDB) => {
    setIsEditing(true);
    setFormData({
      id: role.id,
      slug: role.slug,
      name: role.name,
      name_ar: role.name_ar || '',
      description: role.description || '',
      tenant_id: role.tenant_id || selectedTenantId,
      permissions: role.permissions?.map((p) => p.permission_id ?? p.id!) || [],
    });
    setSubmitError([]);
  };

  const setCreateMode = () => {
    setIsEditing(false);
    resetForm();
  };

  const saveRole = async (onSuccess: () => void) => {
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

    setLoading(true);
    setSubmitError([]);

    try {
      const response = isEditing && formData.id
        ? await roleService.updateRole(formData.id, payload as RoleForm, language)
        : await roleService.createRole(payload as RoleForm, language);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(data?.error || data?.message || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        return;
      }

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || (language === 'ar' ? 'تم حفظ الدور بنجاح' : 'Role saved successfully'),
        color: 'success',
      });

      resetForm();
      onSuccess();
    } catch (error) {
      console.error('saveRole error:', error);
      setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  };

  const toggleAllPermissions = (allPermissionIds: number[]) => {
    if (formData.permissions.length === allPermissionIds.length) {
      setFormData((prev) => ({ ...prev, permissions: [] }));
    } else {
      setFormData((prev) => ({ ...prev, permissions: allPermissionIds }));
    }
  };

  return {
    formData,
    setFormData,
    loading,
    submitError,
    isEditing,
    resetForm,
    setEditMode,
    setCreateMode,
    saveRole,
    togglePermission,
    toggleAllPermissions,
  };
};