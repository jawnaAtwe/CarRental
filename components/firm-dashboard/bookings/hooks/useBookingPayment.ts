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
    const endDate = booking.end_date ? new Date(booking.end_date) : null;
    const today = new Date();

    if (!endDate || isNaN(endDate.getTime())) {
      return 0;
    }

    const daysLate = Math.max(
      0,
      Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    return lateFeePerDay * daysLate;
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