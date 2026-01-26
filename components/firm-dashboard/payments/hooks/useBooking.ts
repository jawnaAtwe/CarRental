// hooks/useBooking.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { BookingDB } from '../types/paymentTypes';
import { API_BASE_URL } from '../constants/paymentConstants';

export const useBooking = (language: string) => {
  const [bookingDetails, setBookingDetails] = useState<BookingDB | null>(null);
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Record<number, string>>({});

  const fetchBookingDetails = async (bookingId: number) => {
    setLoading(true);
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
      return data;
    } catch (error: any) {
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || 'Failed to load booking details',
        color: 'danger',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingCurrency = async (bookingId: number) => {
    if (currencies[bookingId]) return;

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error();

      const data: BookingDB = await res.json();

      setCurrencies((prev) => ({
        ...prev,
        [bookingId]: data.currency_code,
      }));
    } catch (e) {
      console.error('Failed to fetch booking currency');
    }
  };

  return {
    bookingDetails,
    loading,
    currencies,
    fetchBookingDetails,
    fetchBookingCurrency,
  };
};