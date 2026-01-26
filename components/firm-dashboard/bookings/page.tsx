'use client';

import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// Hooks
import { useBookingData } from './hooks/useBookingData';
import { useBookingForm } from './hooks/useBookingForm';
import { useBookingPayment } from './hooks/useBookingPayment';
import { useBookingDelete } from './hooks/useBookingDelete';
import { useBookingView } from './hooks/useBookingView';

// Components
import { BookingHeader } from './components/BookingHeader';
import { BookingSelectors } from './components/BookingSelectors';
import { BookingTable } from './components/BookingTable';
import { BookingFormModal } from './components/BookingFormModal';
import { BookingViewModal } from './components/BookingViewModal';
import { BookingPaymentModal } from './components/BookingPaymentModal';
import { BookingDeleteModal } from './components/BookingDeleteModal';

export default function BookingsPage() {
  const { language } = useLanguage();

  // Main data hook
  const {
    user,
    sessionLoaded,
    isSuperAdmin,
    selectedTenantId,
    setSelectedTenantId,
    selectedBranchId,
    setSelectedBranchId,
    bookings,
    branches,
    customers,
    vehicles,
    tenants,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    loading,
    tenantsLoading,
    branchesLoading,
    branchesError,
    fetchBookings,
    fetchBranches,
  } = useBookingData(language);

  // Selection state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Form hook
  const {
    editModal,
    isEditing,
    formData,
    setFormData,
    loadingForm,
    submitError,
    openCreateBooking,
    openEditBooking,
    saveBooking,
    resetBookingForm,
  } = useBookingForm(language, selectedTenantId, selectedBranchId, vehicles, fetchBookings);

  // View hook
  const { viewModal, activeBooking, fetchBookingDetails } = useBookingView(
    language,
    selectedTenantId
  );

  // Payment hook
  const {
    paymentModal,
    paymentBooking,
    paymentData,
    setPaymentData,
    openPaymentModal,
    submitPayment,
  } = useBookingPayment(language, selectedTenantId, fetchBookings);

  // Delete hook
  const { deleteModal, deleteTarget, confirmDelete, executeDelete } = useBookingDelete(
    language,
    selectedTenantId,
    selectedKeys,
    setSelectedKeys,
    fetchBookings
  );

  // Handlers
  const handleTenantChange = async (tenantId: number) => {
    setSelectedTenantId(tenantId);
    setSelectedBranchId(null);
    await fetchBranches(tenantId);
    await fetchBookings();
  };

  const handleBranchChange = async (branchId: number) => {
    setSelectedBranchId(branchId);
    await fetchBookings();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-8 md:px-8">
      <div className="mx-auto w-full space-y-8">
        {/* Selectors */}
        <BookingSelectors
          language={language}
          isSuperAdmin={isSuperAdmin}
          sessionLoaded={sessionLoaded}
          selectedTenantId={selectedTenantId}
          selectedBranchId={selectedBranchId}
          tenants={tenants}
          branches={branches}
          tenantsLoading={tenantsLoading}
          branchesLoading={branchesLoading}
          onTenantChange={handleTenantChange}
          onBranchChange={handleBranchChange}
        />

        {/* Header */}
        <BookingHeader
          language={language}
          selectedKeysSize={selectedKeys.size}
          onBulkDelete={() => confirmDelete('bulk')}
          onCreateNew={() => openCreateBooking(branches)}
        />

        {/* Table */}
        <BookingTable
          language={language}
          bookings={bookings}
          loading={loading}
          search={search}
          setSearch={setSearch}
          setPage={setPage}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          selectedKeys={selectedKeys}
          setSelectedKeys={setSelectedKeys}
          onViewDetails={fetchBookingDetails}
          onEdit={openEditBooking}
          onDelete={(id) => confirmDelete('single', id)}
          onPayment={openPaymentModal}
        />

        {/* Modals */}
        <BookingFormModal
          language={language}
          isOpen={editModal.isOpen}
          onOpenChange={editModal.onOpenChange}
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          customers={customers}
          vehicles={vehicles}
          branches={branches}
          submitError={submitError}
          loadingForm={loadingForm}
          onSave={saveBooking}
          onClose={() => {
            editModal.onClose();
            resetBookingForm();
          }}
        />

        <BookingViewModal
          language={language}
          isOpen={viewModal.isOpen}
          onOpenChange={viewModal.onOpenChange}
          activeBooking={activeBooking}
          onClose={viewModal.onClose}
        />

        <BookingPaymentModal
          language={language}
          isOpen={paymentModal.isOpen}
          onOpenChange={paymentModal.onOpenChange}
          paymentBooking={paymentBooking}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          onSubmit={submitPayment}
          onClose={paymentModal.onClose}
        />

        <BookingDeleteModal
          language={language}
          isOpen={deleteModal.isOpen}
          onOpenChange={deleteModal.onOpenChange}
          deleteTarget={deleteTarget}
          selectedKeysSize={selectedKeys.size}
          submitError={[]}
          onConfirm={executeDelete}
          onClose={deleteModal.onClose}
        />
      </div>
    </div>
  );
}