'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, useDisclosure, Selection } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../context/LanguageContext';
import { useRoles } from './hooks/useRoles';
import { useRoleForm } from './hooks/useRoleForm';
import { usePermissions } from './hooks/usePermissions';
import { useTenants } from './hooks/useTenants';
import { RolesTable } from './components/RolesTable';
import { RoleForm } from './components/RoleForm';
import { RoleViewModal } from './components/RoleViewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { TenantSelector } from './components/TenantSelector';
import { SessionUser, RoleDB } from './hooks/types';
import { SUPER_ADMIN_ROLE_ID } from './constants';

export default function RolesPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === SUPER_ADMIN_ROLE_ID;
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);
  const [activeRole, setActiveRole] = useState<RoleDB | null>(null);

  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const { tenants, loading: tenantsLoading } = useTenants(language, sessionLoaded && isSuperAdmin);
  const { roles, loading, totalPages, totalCount, fetchRoles, deleteRole, bulkDeleteRoles, fetchRoleDetails } =
    useRoles(language, selectedTenantId, page, search);
  const { permissions, loading: permissionsLoading } = usePermissions(
    language,
    selectedTenantId,
    sessionLoaded && !!selectedTenantId
  );
  const {
    formData,
    setFormData,
    loading: loadingForm,
    submitError,
    isEditing,
    setEditMode,
    setCreateMode,
    saveRole,
    togglePermission,
    toggleAllPermissions,
  } = useRoleForm(language, selectedTenantId);

  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!isSuperAdmin && user) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user, isSuperAdmin]);

  const openCreateRole = () => {
    setCreateMode();
    editModal.onOpen();
  };

  const openEditRole = (role: RoleDB) => {
    setEditMode(role);
    editModal.onOpen();
  };

  const handleViewRole = async (role: RoleDB) => {
    const details = await fetchRoleDetails(role.id, selectedTenantId!);
    if (details) {
      setActiveRole(details);
      viewModal.onOpen();
    }
  };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget || !selectedTenantId) return;
    deleteModal.onClose();

    if (deleteTarget.type === 'single' && deleteTarget.id) {
      await deleteRole(deleteTarget.id, selectedTenantId);
    }
    if (deleteTarget.type === 'bulk') {
      const selectedIds = getSelectedIds();
      await bulkDeleteRoles(selectedIds, selectedTenantId);
      setSelectedKeys(new Set([]));
    }
    setDeleteTarget(null);
  };

  const handleSave = () => {
    saveRole(() => {
      editModal.onClose();
      fetchRoles();
    });
  };

  const getSelectedIds = (): number[] => {
    if (selectedKeys === 'all') {
      return roles.map((r) => r.id);
    }
    return Array.from(selectedKeys).map((key) => Number(key));
  };

  const selectedCount = selectedKeys === 'all' ? roles.length : selectedKeys.size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 px-4 py-8 md:px-8 transition-colors duration-300">
      <div className="mx-auto w-full space-y-8">
        {/* Tenant Selector */}
        {isSuperAdmin && sessionLoaded && (
          <TenantSelector
            language={language}
            selectedTenantId={selectedTenantId}
            tenants={tenants}
            loading={tenantsLoading}
            onChange={setSelectedTenantId}
          />
        )}

        {/* Header */}
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
              className="relative overflow-hidden text-white font-extrabold tracking-wide rounded-3xl px-6 py-3 bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500 shadow-xl transition-all duration-500 transform hover:scale-110 hover:shadow-2xl before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full before:bg-white/30 before:rotate-12 before:transition-all before:duration-500 hover:before:w-[200%]"
            >
              {language === 'ar' ? 'دور جديد' : 'New Role'}
            </Button>
          </div>
        </section>

        {/* Table */}
        <RolesTable
          language={language}
          roles={roles}
          loading={loading}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalCount={totalCount}
          selectedKeys={selectedKeys}
          setSelectedKeys={setSelectedKeys}
          onView={handleViewRole}
          onEdit={openEditRole}
          onDelete={(id) => confirmDelete('single', id)}
        />

        {/* Modals */}
        <RoleViewModal language={language} isOpen={viewModal.isOpen} role={activeRole} onClose={viewModal.onClose} />

        <RoleForm
          language={language}
          isOpen={editModal.isOpen}
          isEditing={isEditing}
          loading={loadingForm}
          formData={formData}
          permissions={permissions}
          permissionsLoading={permissionsLoading}
          submitError={submitError}
          onClose={editModal.onClose}
          onSave={handleSave}
          onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          onTogglePermission={togglePermission}
          onToggleAllPermissions={() => toggleAllPermissions(permissions.map((p) => p.id))}
        />

        <DeleteConfirmModal
          language={language}
          isOpen={deleteModal.isOpen}
          deleteType={deleteTarget?.type || null}
          selectedCount={selectedCount}
          onClose={deleteModal.onClose}
          onConfirm={executeDelete}
        />
      </div>
    </div>
  );
}