'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, useDisclosure } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../context/LanguageContext';
import { useInvoices } from './hooks/useInvoices';
import { useInvoiceForm } from './hooks/useInvoiceForm';
import { InvoicesTable } from './components/invoices/InvoicesTable';
import { InvoiceForm } from './components/invoices/InvoiceForm';
import { InvoiceViewModal } from './components/invoices/InvoiceViewModal';
import { DeleteConfirmModal } from './components/invoices/DeleteConfirmModal';
import { InvoiceFilters } from './components/invoices/InvoiceFilters';
import { InvoiceDB,Booking } from './hooks/types/invoice.types';
import { useBookings } from './hooks/useBookings';
  
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

export default function InvoicesPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const selectedTenantId = user?.tenantId;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceDB | null>(null);

  const editModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteModal = useDisclosure();

  const { invoices, loading, totalPages, totalCount, fetchInvoices, deleteInvoice, bulkDelete } = useInvoices(
    language,
    selectedTenantId,
    search,
    statusFilter,
    page
  );
const { bookings, loading: bookingsLoading, fetchBookings } = useBookings(language, selectedTenantId);

useEffect(() => {
  fetchBookings(); 
}, [selectedTenantId, language]);

  const {
    formData,
    setFormData,
    loading: loadingForm,
    submitError,
    isEditing,
    setEditMode,
    setCreateMode,
    saveInvoice,
  } = useInvoiceForm(language, selectedTenantId);

  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  const openCreateInvoice = () => {
    setCreateMode();
    editModal.onOpen();
  };

  const openEditInvoice = (invoice: InvoiceDB) => {
    setEditMode(invoice);
    editModal.onOpen();
  };

  const openViewInvoice = (invoice: InvoiceDB) => {
    setActiveInvoice(invoice);
    viewModal.onOpen();
  };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    if (deleteTarget.type === 'single' && deleteTarget.id) await deleteInvoice(deleteTarget.id);
    if (deleteTarget.type === 'bulk') {
      const selectedInvoiceIds = Array.from(selectedKeys).map(Number);
      await bulkDelete(selectedInvoiceIds);
      setSelectedKeys(new Set());
    }
    setDeleteTarget(null);
  };

  const handleSave = () => {
    saveInvoice(() => {
      editModal.onClose();
      fetchInvoices();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-100 to-white dark:from-[#0B0F1A] dark:via-[#0B0F1A] dark:to-[#1C2030] px-4 py-8 md:px-8">
      <div className="mx-auto w-full space-y-8">
        {/* Header */}
        <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300">
              {language === 'ar' ? 'إدارة الفواتير' : 'INVOICE MANAGEMENT'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text dark:text-white">
              {language === 'ar' ? 'الفواتير' : 'INVOICES'}
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
              onPress={openCreateInvoice}
               className="relative overflow-hidden text-white font-extrabold tracking-wide rounded-3xl px-6 py-3 bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500 shadow-xl transition-all duration-500 transform hover:scale-110 hover:shadow-2xl before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full before:bg-white/30 before:rotate-12 before:transition-all before:duration-500 hover:before:w-[200%]"
         >
              {language === 'ar' ? 'فاتورة جديدة' : 'New Invoice'}
            </Button>
          </div>
        </section>

        {/* Filters */}
        <div className="flex gap-3">
          <InvoiceFilters language={language} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        </div>

        {/* Table */}
        <InvoicesTable
          language={language}
          invoices={invoices}
          loading={loading}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalCount={totalCount}
          selectedKeys={selectedKeys}
          setSelectedKeys={setSelectedKeys}
          onView={openViewInvoice}
          onEdit={openEditInvoice}
          onDelete={(id) => confirmDelete('single', id)}
        />

        {/* Modals */}
        <InvoiceForm
          language={language}
          isOpen={editModal.isOpen}
          isEditing={isEditing}
          loading={loadingForm}
          formData={formData}
          bookings={bookings}
          submitError={submitError}
          onClose={editModal.onClose}
          onSave={handleSave}
          onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
        />

        <InvoiceViewModal
          language={language}
          isOpen={viewModal.isOpen}
          invoice={activeInvoice}
          onClose={viewModal.onClose}
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