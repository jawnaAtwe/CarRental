'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, useDisclosure } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../context/LanguageContext';
import { useBranches } from './hooks/useBranches';
import { useTenants } from './hooks/useTenants';
import { useBranchForm } from './hooks/useBranchForm';
import { BranchesTable } from './components/branches/BranchesTable';
import { BranchForm } from './components/branches/BranchForm';
import { DeleteConfirmModal } from './components/branches/DeleteConfirmModal';
import { TenantSelector } from './components/branches/TenantSelector';

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

export default function BranchesPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [search, setSearch] = useState('');
  const [statusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);

  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const { tenants, loading: tenantsLoading } = useTenants(language, sessionLoaded && isSuperAdmin);
  const { branches, loading, totalPages, totalCount, fetchBranches, deleteBranch, bulkDelete } = useBranches(
    language,
    selectedTenantId,
    search,
    statusFilter,
    page
  );
  const {
    formData,
    setFormData,
    loading: loadingForm,
    submitError,
    isEditing,
    setEditMode,
    setCreateMode,
    saveBranch,
  } = useBranchForm(language, selectedTenantId);

  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!isSuperAdmin && user) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user, isSuperAdmin]);

  const openCreateBranch = () => {
    setCreateMode();
    editModal.onOpen();
  };

  const openEditBranch = (branch: any) => {
    setEditMode(branch);
    editModal.onOpen();
  };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    if (deleteTarget.type === 'single' && deleteTarget.id) await deleteBranch(deleteTarget.id);
    if (deleteTarget.type === 'bulk') {
      const selectedBranchIds = Array.from(selectedKeys).map(Number);
      await bulkDelete(selectedBranchIds);
      setSelectedKeys(new Set());
    }
    setDeleteTarget(null);
  };

  const handleSave = () => {
    saveBranch(() => {
      editModal.onClose();
      fetchBranches();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-100 to-white dark:from-[#0B0F1A] dark:via-[#0B0F1A] dark:to-[#1C2030] px-4 py-8 md:px-8">
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
              className="relative overflow-hidden text-white font-extrabold tracking-wide rounded-3xl px-6 py-3 bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500 shadow-xl transition-all duration-500 transform hover:scale-110 hover:shadow-2xl before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full before:bg-white/30 before:rotate-12 before:transition-all before:duration-500 hover:before:w-[200%]"
            >
              {language === 'ar' ? 'فرع جديد' : 'New Branch'}
            </Button>
          </div>
        </section>

        {/* Table */}
        <BranchesTable
          language={language}
          branches={branches}
          loading={loading}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalCount={totalCount}
          selectedKeys={selectedKeys}
          setSelectedKeys={setSelectedKeys}
          onEdit={openEditBranch}
          onDelete={(id) => confirmDelete('single', id)}
        />

        {/* Modals */}
        <BranchForm
          language={language}
          isOpen={editModal.isOpen}
          isEditing={isEditing}
          loading={loadingForm}
          formData={formData}
          submitError={submitError}
          onClose={editModal.onClose}
          onSave={handleSave}
          onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
        />

        <DeleteConfirmModal
          language={language}
          isOpen={deleteModal.isOpen}
          deleteType={deleteTarget?.type || null}
          selectedCount={selectedKeys.size}
          onClose={deleteModal.onClose}
          onConfirm={executeDelete}
        />
      </div>
    </div>
  );
}