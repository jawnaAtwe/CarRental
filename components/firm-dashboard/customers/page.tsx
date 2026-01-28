'use client';

import { useState } from 'react';
import { Button, useDisclosure } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomers } from './hooks/useCustomers';
import { useCustomerForm } from './hooks/useCustomerForm';
import { CustomersTable } from './components/CustomersTable';
import { CustomerForm } from './components/CustomerForm';
import { CustomerViewModal } from './components/CustomerViewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CustomerDB, CustomerStatus } from './hooks/types';

export default function CustomersPage() {
  const { language } = useLanguage();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerDB | null>(null);

  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const { customers, loading, totalPages, totalCount, fetchCustomers, deleteCustomer, bulkDeleteCustomers, fetchCustomerDetails } =
    useCustomers(language, page, search, statusFilter);

  const { formData, setFormData, loading: loadingForm, submitError, isEditing, setEditMode, setCreateMode, saveCustomer, updateForm } =
    useCustomerForm(language);

  const openCreateUser = () => {
    setCreateMode();
    editModal.onOpen();
  };

  const openEditCustomer = (customer: CustomerDB) => {
    setEditMode(customer);
    editModal.onOpen();
  };

  const handleViewCustomer = async (customer: CustomerDB) => {
    const details = await fetchCustomerDetails(customer.id);
    if (details) {
      setActiveCustomer(details);
      viewModal.onOpen();
    }
  };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    if (deleteTarget.type === 'single' && deleteTarget.id) await deleteCustomer(deleteTarget.id);
    if (deleteTarget.type === 'bulk') {
      const selectedCustomerIds = Array.from(selectedKeys).map(Number);
      await bulkDeleteCustomers(selectedCustomerIds);
      setSelectedKeys(new Set());
    }
    setDeleteTarget(null);
  };

  const handleSave = () => {
    saveCustomer(() => {
      editModal.onClose();
      fetchCustomers();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-content2-light dark:from-content2-dark via-content2-light/95 dark:via-content2-dark/95 to-background-light dark:to-background-dark px-4 py-8 md:px-8 transition-colors duration-300">
      <div className="mx-auto w-full space-y-8">
        {/* Header */}
        <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-black dark:text-white transition-colors duration-300">
              {language === 'ar' ? 'إدارة المستخدمين' : 'CUSTOMERS MANAGEMENT'}
            </p>
            <h1 className="text-black dark:text-white transition-colors duration-300">
              {language === 'ar' ? 'المستخدمون' : 'Customers'}
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
              onPress={openCreateUser}
              className="relative overflow-hidden text-white font-extrabold tracking-wide rounded-3xl px-6 py-3 bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500 shadow-xl transition-all duration-500 transform hover:scale-110 hover:shadow-2xl before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full before:bg-white/30 before:rotate-12 before:transition-all before:duration-500 hover:before:w-[200%]"
            >
              <span className="relative animate-gradient-text bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                {language === 'ar' ? 'مستخدم جديد' : 'New User'}
              </span>
            </Button>
          </div>
        </section>

        {/* Table */}
        <CustomersTable
          language={language}
          customers={customers}
          loading={loading}
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
          onView={handleViewCustomer}
          onEdit={openEditCustomer}
          onDelete={(id) => confirmDelete('single', id)}
        />

        {/* Modals */}
        <CustomerViewModal language={language} isOpen={viewModal.isOpen} customer={activeCustomer} onClose={viewModal.onClose} />

        <CustomerForm
          language={language}
          isOpen={editModal.isOpen}
          isEditing={isEditing}
          loading={loadingForm}
          formData={formData}
          submitError={submitError}
          onClose={editModal.onClose}
          onSave={handleSave}
          updateForm={updateForm}
          setFormData={setFormData}
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