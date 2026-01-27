import { useState } from 'react';
import { addToast } from '@heroui/react';
import { Booking } from './types/invoice.types';

const API_BASE_URL = '/api/v1/admin';

export const useBookings = (language: string, selectedTenantId?: number) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async (bookingId?: number, customerId?: number) => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: selectedTenantId.toString(),
        ...(bookingId && { booking_id: bookingId.toString() }),
        ...(customerId && { customer_id: customerId.toString() }),
      });

      const response = await fetch(`${API_BASE_URL}/bookings?${params.toString()}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      setBookings(data.data || []);
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ في جلب الحجوزات' : 'Error fetching bookings',
        description: error?.message || (language === 'ar' ? 'خطأ' : 'Error'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return { bookings, loading, fetchBookings };
};
