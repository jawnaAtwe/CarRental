'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import {
  addToast,
  Button,
  Table,
  Select,
  SelectItem,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { InformationCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../context/LanguageContext';
import moment from 'moment';

// ------------------- Types -------------------
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;           // المبلغ الكامل
  paid_amount?: number;     // المدفوع
  partial_amount?: number;  // المدفوع جزئيًا
  currency: string;
  status: PaymentStatus;
  created_at: string;
}
type BookingDB = {
  id: number;
  tenant_id: number;
  branch_id?: number | null;
  customer_id: number;
  customer_name: string;
  vehicle_id: number;
  vehicle_name?: string | null;
  late_fee_day?: number | null;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  branch_name?: string | null;
  branch_name_ar?: string | null;
  created_at?: string | null;
};

interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: "user" | "customer";
  roles: string[];
  permissions: string[];
  tenantId: number;
  roleId: number;
}

// ------------------- Constants -------------------
const API_BASE_URL = '/api/v1/admin';
const pageSize = 10;

// ------------------- Component -------------------
export default function PaymentsPage() {
  const { language } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const viewModal = useDisclosure();
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
  !isSuperAdmin ? user?.tenantId : undefined
  );
  const [tenants, setTenants] = useState<{id: number, name: string}[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const bookingModal = useDisclosure();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDB | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const PAYMENT_STATUSES: PaymentStatus[] = [
  'pending',
  'completed',
  'failed',
  'refunded',
];

  // ------------------- Fetch Payments -------------------
 const fetchPayments = async () => {
  if (!selectedTenantId) return;
  setLoading(true);
  try {
    const params = new URLSearchParams({
      tenant_id: selectedTenantId.toString(),
      page: String(page),
      pageSize: String(pageSize),
    });

    const response = await fetch(`${API_BASE_URL}/payments?${params}`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    setPayments(data.data || []);
    setTotalPages(Math.ceil((data.total ?? data.data?.length ?? 0) / pageSize));
    setTotalCount(data.total ?? data.data?.length ?? 0);
  } catch (error: any) {
    console.error(error);
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description: error?.message || 'Failed to fetch payments',
      color: 'danger'
    });
  } finally {
    setLoading(false);
  }
};

// ------------------- Fetch Tenants ------------------
  const fetchTenants = async () => {
  setTenantsLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch tenants');
    const data = await response.json();
    setTenants(data.data || []);
  } catch (error) {
    console.error(error);
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description: (error as any)?.message || 'Failed to fetch tenants',
      color: 'danger'
    });
  } finally {
    setTenantsLoading(false);
  }
};
//////
  useEffect(() => {
  if (selectedTenantId) fetchPayments();
  }, [page, selectedTenantId, language]);
  
  useEffect(() => {
    fetchPayments();
  }, [page]);

  useEffect(() => {
  if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
  if (sessionLoaded && isSuperAdmin) fetchTenants();
  }, [sessionLoaded, isSuperAdmin]);

  useEffect(() => {
  if (!isSuperAdmin && user) setSelectedTenantId(user.tenantId);
  }, [user, isSuperAdmin]);

  // ------------------- Functions -------------------
  const openPaymentDetails = (payment: Payment) => {
    setActivePayment(payment);
    viewModal.onOpen();
  };
const openBookingDetails = async (bookingId: number) => {
  bookingModal.onOpen();
  setBookingLoading(true);
  setBookingDetails(null);

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error('Failed to fetch booking details');

    const data = await res.json();
    setBookingDetails(data);
  } catch (error: any) {
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description: error?.message || 'Failed to load booking details',
      color: 'danger',
    });
    bookingModal.onClose();
  } finally {
    setBookingLoading(false);
  }
};
const updatePaymentStatus = async (
  paymentId: number,  
  status: PaymentStatus
) => {
  setUpdatingStatus(paymentId);

  try {
    const res = await fetch(
      `${API_BASE_URL}/payments/${paymentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': language,
        },
        body: JSON.stringify({ status }),  
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.error || 'Failed to update payment status');
    }

    addToast({
      title: language === 'ar' ? 'تم التحديث' : 'Updated',
      description:
        language === 'ar'
          ? 'تم تحديث حالة الدفع بنجاح'
          : 'Payment status updated successfully',
      color: 'success',
    });

    fetchPayments(); 
  } catch (error: any) {
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description: error?.message || 'Failed to update status',
      color: 'danger',
    });
  } finally {
    setUpdatingStatus(null);
  }
};

  const renderAmount = (payment: Payment) => {
    const full = `${payment.amount} ${payment.currency}`;
    const paid = payment.paid_amount ? `(${language === 'ar' ? 'مدفوع' : 'Paid'}: ${payment.paid_amount} ${payment.currency})` : '';
    const partial = payment.partial_amount ? `(${language === 'ar' ? 'جزئي' : 'Partial'}: ${payment.partial_amount} ${payment.currency})` : '';
    return (
      <span>
        {full} {paid} {partial}
      </span>
    );
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{language === 'ar' ? 'المدفوعات' : 'Payments'}</h1>
{isSuperAdmin && sessionLoaded && (
  <Select
    size="md"
    label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
    placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
    selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
    onChange={(e) => setSelectedTenantId(Number(e.target.value))}
    isLoading={tenantsLoading}
  >
    {tenants.map((t) => (
      <SelectItem key={t.id}>{t.name}</SelectItem>
    ))}
  </Select>
)}

      <Table
        aria-label="Payments Table"
        classNames={{ table: 'min-w-full text-base' }}
      >
        
        <TableHeader>
          <TableColumn>{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}</TableColumn>
          <TableColumn>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableColumn>
          <TableColumn>{language === 'ar' ? 'الحالة' : 'Status'}</TableColumn>
          <TableColumn>{language === 'ar' ? 'وقت الدفع' : 'Payment Time'}</TableColumn>
          <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
        </TableHeader>

        <TableBody emptyContent={language === 'ar' ? 'لا توجد مدفوعات' : 'No payments found'}>
          {payments.map(payment => (
            <TableRow key={payment.id}>
              <TableCell>{payment.booking_id}</TableCell>
              <TableCell>{renderAmount(payment)}</TableCell>
            <TableCell>
<Select
  size="sm"
  selectedKeys={[payment.status]}
  isDisabled={updatingStatus === payment.id}
  onChange={(e) =>
    updatePaymentStatus(
      payment.id,
      e.target.value as PaymentStatus
    )
  }
  className="min-w-[150px]"
>
  {PAYMENT_STATUSES.map((status) => (
    <SelectItem key={status}>
      {status}
    </SelectItem>
  ))}
  
</Select>

</TableCell>


              <TableCell>{moment(payment.created_at).format('DD MMM YYYY, hh:mm A')}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button isIconOnly variant="flat" color="default" onPress={() => openPaymentDetails(payment)}>
                  <InformationCircleIcon className="h-5 w-5" />
                </Button>
                <Button
  isIconOnly
  variant="flat"
  color="primary"
  onPress={() => openBookingDetails(payment.booking_id)}
>
  <InformationCircleIcon className="h-5 w-5" />
</Button>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <Button size="sm" variant="flat" onPress={() => setPage(p => Math.max(p - 1, 1))} isDisabled={page === 1}>
          {language === 'ar' ? 'السابق' : 'Previous'}
        </Button>
        <span className="text-sm">{language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
        <Button size="sm" variant="flat" onPress={() => setPage(p => Math.min(p + 1, totalPages))} isDisabled={page === totalPages}>
          {language === 'ar' ? 'التالي' : 'Next'}
        </Button>
      </div>

      {/* Payment Details Modal */}
      <Modal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange} size="md">
        <ModalContent>
          {activePayment && (
            <>
              <ModalHeader>{language === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}</ModalHeader>
              <ModalBody className="space-y-2 text-sm">
                <p><strong>{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}:</strong> {activePayment.booking_id}</p>
                <p><strong>{language === 'ar' ? 'المبلغ' : 'Amount'}:</strong> {renderAmount(activePayment)}</p>
                <p><strong>{language === 'ar' ? 'الحالة' : 'Status'}:</strong> {activePayment.status}</p>
                <p><strong>{language === 'ar' ? 'وقت الدفع' : 'Payment Time'}:</strong> {moment(activePayment.created_at).format('DD MMM YYYY, hh:mm A')}</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={viewModal.onClose}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
  isOpen={bookingModal.isOpen}
  onOpenChange={bookingModal.onOpenChange}
  size="lg"
>
  <ModalContent>
    <>
      <ModalHeader>
        {language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
      </ModalHeader>

      <ModalBody className="space-y-2 text-sm">
        {bookingLoading && (
          <p className="text-center text-gray-500">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        )}

        {bookingDetails && (
          <>
            <p>
              <strong>{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}:</strong>{' '}
              {bookingDetails.id}
            </p>

            <p>
              <strong>{language === 'ar' ? 'اسم الزبون' : 'Customer'}:</strong>{' '}
              {bookingDetails.customer_name}
            </p>

            <p>
              <strong>{language === 'ar' ? 'السيارة' : 'Vehicle'}:</strong>{' '}
              {bookingDetails.vehicle_name || '-'}
            </p>

            <p>
              <strong>{language === 'ar' ? 'الفرع' : 'Branch'}:</strong>{' '}
              {language === 'ar'
                ? bookingDetails.branch_name_ar || bookingDetails.branch_name || '-'
                : bookingDetails.branch_name || '-'}
            </p>

            <p>
              <strong>{language === 'ar' ? 'بداية الحجز' : 'Start Date'}:</strong>{' '}
              {moment(bookingDetails.start_date).format('DD MMM YYYY')}
            </p>

            <p>
              <strong>{language === 'ar' ? 'نهاية الحجز' : 'End Date'}:</strong>{' '}
              {moment(bookingDetails.end_date).format('DD MMM YYYY')}
            </p>

            <p>
              <strong>{language === 'ar' ? 'غرامة التأخير / يوم' : 'Late Fee / Day'}:</strong>{' '}
              {bookingDetails.late_fee_day ?? '-'}
            </p>

            <p>
              <strong>{language === 'ar' ? 'قيمة الحجز' : 'Total Amount'}:</strong>{' '}
              {bookingDetails.total_amount}
            </p>

            <p>
              <strong>{language === 'ar' ? 'الحالة' : 'Status'}:</strong>{' '}
              {bookingDetails.status}
            </p>

            {bookingDetails.created_at && (
              <p>
                <strong>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}:</strong>{' '}
                {moment(bookingDetails.created_at).format('DD MMM YYYY, hh:mm A')}
              </p>
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="light" onPress={bookingModal.onClose}>
          {language === 'ar' ? 'إغلاق' : 'Close'}
        </Button>
      </ModalFooter>
    </>
  </ModalContent>
</Modal>

    </div>
  );
}
