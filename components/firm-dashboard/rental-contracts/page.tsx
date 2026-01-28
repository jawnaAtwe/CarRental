'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, useDisclosure } from '@heroui/react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../context/LanguageContext';
import { useRentalContracts } from './hooks/useRentalContracts';
import { useRentalContractForm } from './hooks/useRentalContractForm';
import { useTenants } from './hooks/useTenants';
import { useBookingsAndTemplates } from './hooks/useBookingsAndTemplates'; 
import { RentalContractsTable } from './components/RentalContractsTable';
import { RentalContractForm } from './components/RentalContractForm';
import { RentalContractViewModal } from './components/RentalContractViewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { TenantSelector } from './components/TenantSelector';
import { SessionUser, RentalContractDB, ContractStatus } from './hooks/types';
import { SUPER_ADMIN_ROLE_ID } from './constants';

export default function RentalContractsPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === SUPER_ADMIN_ROLE_ID;
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [activeContract, setActiveContract] = useState<RentalContractDB | null>(null);

  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const cancelModal = useDisclosure();

  const { tenants, loading: tenantsLoading } = useTenants(language, sessionLoaded && isSuperAdmin);
  const { contracts, loading, fetchContracts, cancelContract, fetchContractDetails } = useRentalContracts(
    language,
    selectedTenantId,
    statusFilter
  );
  
  const { bookings, templates, loadingBookings, loadingTemplates } = useBookingsAndTemplates(
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
    saveContract,
    fetchBookingData, // ✅ جديد
  } = useRentalContractForm(language, selectedTenantId);

  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!isSuperAdmin && user) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user, isSuperAdmin]);

  const openCreateContract = () => {
    setCreateMode();
    editModal.onOpen();
  };

  const openEditContract = (contract: RentalContractDB) => {
    setEditMode(contract);
    editModal.onOpen();
  };

  const handleViewContract = async (contract: RentalContractDB) => {
    if (selectedTenantId) {
      const details = await fetchContractDetails(contract.id, selectedTenantId);
      if (details) {
        setActiveContract(details);
        viewModal.onOpen();
      }
    }
  };

  const confirmCancel = (id: number) => {
    setCancelTarget(id);
    cancelModal.onOpen();
  };

  const executeCancel = async () => {
    if (!cancelTarget || !selectedTenantId) return;
    cancelModal.onClose();
    await cancelContract(cancelTarget, selectedTenantId);
    setCancelTarget(null);
  };

  const handleSave = () => {
    saveContract(() => {
      editModal.onClose();
      fetchContracts();
    });
  };

  const handleBookingChange = (bookingId: number) => {
    fetchBookingData(bookingId);
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
              {language === 'ar' ? 'إدارة عقود الإيجار' : 'RENTAL CONTRACTS MANAGEMENT'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text dark:text-white">
              {language === 'ar' ? 'عقود الإيجار' : 'RENTAL CONTRACTS'}
            </h1>
          </div>
          <Button
            variant="solid"
            color="primary"
            startContent={<PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />}
            onPress={openCreateContract}
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
          "  >
            {language === 'ar' ? 'عقد جديد' : 'New Contract'}
          </Button>
        </section>

        {/* Table */}
        <RentalContractsTable
          language={language}
          contracts={contracts}
          loading={loading}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onView={handleViewContract}
          onEdit={openEditContract}
          onCancel={confirmCancel}
        />

        {/* Modals */}
        <RentalContractViewModal
          language={language}
          isOpen={viewModal.isOpen}
          contract={activeContract}
          onClose={viewModal.onClose}
        />

        <RentalContractForm
          language={language}
          isOpen={editModal.isOpen}
          isEditing={isEditing}
          loading={loadingForm}
          formData={formData}
          bookings={bookings} 
          templates={templates}
          loadingBookings={loadingBookings} 
          loadingTemplates={loadingTemplates} 
          submitError={submitError}
          onClose={editModal.onClose}
          onSave={handleSave}
          onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          onBookingChange={handleBookingChange} 
        />

        <DeleteConfirmModal
          language={language}
          isOpen={cancelModal.isOpen}
          onClose={cancelModal.onClose}
          onConfirm={executeCancel}
        />
      </div>
    </div>
  );
}