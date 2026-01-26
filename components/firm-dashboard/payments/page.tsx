'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useDisclosure } from '@heroui/react';
import { useLanguage } from '../../context/LanguageContext';
import { SessionUser, Payment } from './types/paymentTypes';
import { SUPER_ADMIN_ROLE_ID } from './constants/paymentConstants';
import { usePayments } from './hooks/usePayments';
import { useTenants } from './hooks/useTenants';
import { useBooking } from './hooks/useBooking';
import { TenantSelector } from './components/TenantSelector';
import { PaymentsTable } from './components/PaymentsTable';
import { Pagination } from './components/Pagination';
import { PaymentDetailsModal } from './components/PaymentDetailsModal';
import { BookingDetailsModal } from './components/BookingDetailsModal';

export default function PaymentsPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    undefined
  );
  const [activePayment, setActivePayment] = useState<Payment | null>(null);

  const isSuperAdmin = user?.roleId === SUPER_ADMIN_ROLE_ID;

  // Custom Hooks
  const {
    payments,
    loading: paymentsLoading,
    page,
    setPage,
    totalPages,
    updatingStatus,
    fetchPayments,
    updatePaymentStatus,
  } = usePayments(language);

  const {
    tenants,
    loading: tenantsLoading,
    fetchTenants,
  } = useTenants(language);

  const {
    bookingDetails,
    loading: bookingLoading,
    currencies,
    fetchBookingDetails,
    fetchBookingCurrency,
  } = useBooking(language);

  // Modals
  const paymentModal = useDisclosure();
  const bookingModal = useDisclosure();

  // Effects
  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!isSuperAdmin && user) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    if (sessionLoaded && isSuperAdmin) {
      fetchTenants();
    }
  }, [sessionLoaded, isSuperAdmin]);

  useEffect(() => {
    if (selectedTenantId) {
      fetchPayments(selectedTenantId);
    }
  }, [page, selectedTenantId, language]);

  useEffect(() => {
    payments.forEach((p) => {
      fetchBookingCurrency(p.booking_id);
    });
  }, [payments]);

  // Handlers
  const handleViewPayment = (payment: Payment) => {
    setActivePayment(payment);
    paymentModal.onOpen();
  };

  const handleViewBooking = async (bookingId: number) => {
    bookingModal.onOpen();
    try {
      await fetchBookingDetails(bookingId);
    } catch (error) {
      bookingModal.onClose();
    }
  };

  const handleUpdateStatus = (paymentId: number, status: any) => {
    updatePaymentStatus(paymentId, status, () => {
      if (selectedTenantId) {
        fetchPayments(selectedTenantId);
      }
    });
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        {language === 'ar' ? 'المدفوعات' : 'Payments'}
      </h1>

      {isSuperAdmin && sessionLoaded && (
        <div className="mb-4">
          <TenantSelector
            language={language}
            selectedTenantId={selectedTenantId}
            tenants={tenants}
            loading={tenantsLoading}
            onChange={setSelectedTenantId}
          />
        </div>
      )}

      <PaymentsTable
        language={language}
        payments={payments}
        currencies={currencies}
        updatingStatus={updatingStatus}
        onViewPayment={handleViewPayment}
        onViewBooking={handleViewBooking}
        onUpdateStatus={handleUpdateStatus}
      />

      <Pagination
        language={language}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <PaymentDetailsModal
        language={language}
        isOpen={paymentModal.isOpen}
        payment={activePayment}
        currency={activePayment ? currencies[activePayment.booking_id] || '' : ''}
        onClose={paymentModal.onClose}
      />

      <BookingDetailsModal
        language={language}
        isOpen={bookingModal.isOpen}
        booking={bookingDetails}
        loading={bookingLoading}
        onClose={bookingModal.onClose}
      />
    </div>
  );
}