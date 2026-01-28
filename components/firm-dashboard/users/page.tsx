// ================= Users Page - Main Component =================

'use client';

import { Alert, Button } from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../context/LanguageContext';
import { useUserManagement } from './hooks/useUserManagement';

// Components
import { PageHeader } from './components/PageHeader';
import { UsersTable } from './components/UsersTable';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { UserDetailsModal } from './components/UserDetailsModal';
import { UserFormModal } from './components/UserFormModal';

export default function UsersPage() {
  const { language } = useLanguage();
  
  const {
    // Session & Auth
    sessionLoaded,
    isSuperAdmin,
    
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
  } = useUserManagement(language);

  return (
    <div className="min-h-screen 
                bg-gradient-to-b 
                from-gray-100 via-gray-100 to-white
                dark:from-gray-900 dark:via-gray-800 dark:to-gray-950
                px-4 py-8 md:px-8
                transition-colors duration-300">

      <div className="mx-auto w-full space-y-8">

        {/* ================= Page Header ================= */}
        <PageHeader
          language={language}
          isSuperAdmin={isSuperAdmin}
          sessionLoaded={sessionLoaded}
          selectedTenantId={selectedTenantId}
          setSelectedTenantId={setSelectedTenantId}
          tenants={tenants}
          tenantsLoading={tenantsLoading}
          selectedKeysCount={selectedKeys.size}
          onBulkDelete={() => confirmDelete('bulk')}
          onCreateUser={openCreateUser}
        />

        {/* ================= Roles Error Alert ================= */}
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

        {/* ================= Users Table ================= */}
        <UsersTable
          users={users}
          roles={roles}
          loading={loading}
          language={language}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalCount={totalCount}
          selectedKeys={selectedKeys}
          setSelectedKeys={setSelectedKeys}
          onViewUser={fetchUserDetails}
          onEditUser={openEditUser}
          onDeleteUser={(id) => confirmDelete('single', id)}
        />

        {/* ================= Delete Confirmation Modal ================= */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onOpenChange={deleteModal.onOpenChange}
          onConfirm={executeDelete}
          deleteTarget={deleteTarget}
          selectedCount={selectedKeys.size}
          language={language}
        />

        {/* ================= User Details Modal ================= */}
        <UserDetailsModal
          isOpen={viewModal.isOpen}
          onOpenChange={viewModal.onOpenChange}
          user={activeUser}
          roles={roles}
          language={language}
        />

        {/* ================= User Form Modal (Create/Edit) ================= */}
        <UserFormModal
          isOpen={editModal.isOpen}
          onOpenChange={editModal.onOpenChange}
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          onSubmit={saveUser}
          onCancel={resetForm}
          roles={roles}
          rolesError={rolesError}
          rolesLoading={rolesLoading}
          submitError={submitError}
          loadingForm={loadingForm}
          language={language}
          onReloadRoles={fetchRoles}
        />
      </div>
    </div>
  );
}