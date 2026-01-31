import { useState } from 'react';
import { useDisclosure, addToast } from '@heroui/react';
import { bookingService } from '../services/bookingService';
import { BookingDB, PaymentData } from '../types/bookingTypes';

export const useBookingPayment = (
  language: string,
  selectedTenantId: number | undefined,
  onSuccess: () => void
) => {
  const paymentModal = useDisclosure();
  const [paymentBooking, setPaymentBooking] = useState<BookingDB | null>(null);

  const [paymentData, setPaymentData] = useState<PaymentData>({
    booking_id: 0,
    amount: 0,
    customer_id: 0,
    payment_method: 'cash',
    is_deposit: false,
    partial_amount: 0,
    late_fee: 0,
    split_details: '',
  });

const calculateLateFee = (booking: BookingDB): number => {
  const lateFeePerDay = booking.late_fee_day ?? 0;
  const lateFeePerHour = booking.late_fee_hour ?? 0;

  if (!booking.end_date) return 0;

  const endDate = new Date(booking.end_date);
  const now = new Date();

  if (isNaN(endDate.getTime()) || now <= endDate) {
    return 0;
  }

  const diffMs = now.getTime() - endDate.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  // 🔹 أولوية للساعة
  if (lateFeePerHour > 0) {
    return diffHours * lateFeePerHour;
  }

  // 🔹 fallback: بالأيام
  const diffDays = Math.ceil(diffHours / 24);
  return diffDays * lateFeePerDay;
};



 const openPaymentModal = (booking: BookingDB) => {
  setPaymentBooking(booking);

  const lateFee = calculateLateFee(booking);

  setPaymentData({
    booking_id: booking.id,
    customer_id: booking.customer_id,
    amount: booking.total_amount,
    payment_method: 'cash',
    is_deposit: false,
    partial_amount: 0,
    late_fee: lateFee,
    split_details: '',
  });

  paymentModal.onOpen();
};


  const submitPayment = async () => {
    if (!paymentBooking || !selectedTenantId) return;

    try {
      await bookingService.submitPayment(
        {
          ...paymentData,
          tenant_id: selectedTenantId,
        },
        language
      );

      addToast({
        title: language === 'ar' ? 'تم الدفع' : 'Payment Successful',
        color: 'success',
      });

      paymentModal.onClose();
      onSuccess();
    } catch (err: any) {
      addToast({
        title: language === 'ar' ? 'فشل الدفع' : 'Payment Failed',
        description: err.message,
        color: 'danger',
      });
    }
  };

  return {
    paymentModal,
    paymentBooking,
    paymentData,
    setPaymentData,
    openPaymentModal,
    submitPayment,
    calculateLateFee,
  };
};