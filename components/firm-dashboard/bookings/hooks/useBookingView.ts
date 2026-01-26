import { useState } from 'react';
import { useDisclosure, addToast } from '@heroui/react';
import { bookingService } from '../services/bookingService';
import { BookingDB } from '../types/bookingTypes';

export const useBookingView = (
  language: string,
  selectedTenantId: number | undefined
) => {
  const viewModal = useDisclosure();
  const [activeBooking, setActiveBooking] = useState<BookingDB | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBookingDetails = async (bookingId: number) => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const data = await bookingService.fetchBookingDetails(
        bookingId,
        selectedTenantId,
        language
      );

      setActiveBooking(data);
      viewModal.onOpen();
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          error?.message ||
          (language === 'ar'
            ? 'خطأ في جلب بيانات الحجز'
            : 'Error fetching booking details'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    viewModal,
    activeBooking,
    loading,
    fetchBookingDetails,
  };
};