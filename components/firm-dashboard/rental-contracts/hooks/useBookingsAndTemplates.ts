import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { BookingDB, ContractTemplateDB } from './types';
import { rentalContractService } from '../services/rentalContractService';

export const useBookingsAndTemplates = (language: string, tenantId: number | undefined, shouldFetch: boolean) => {
  const [bookings, setBookings] = useState<BookingDB[]>([]);
  const [templates, setTemplates] = useState<ContractTemplateDB[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const fetchBookings = async () => {
    if (!tenantId) return;

    setLoadingBookings(true);
    try {
      const result = await rentalContractService.fetchBookings(tenantId, language);
      setBookings(result.data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'فشل جلب الحجوزات' : 'Failed to fetch bookings'),
        color: 'danger',
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchTemplates = async () => {
    if (!tenantId) return;

    setLoadingTemplates(true);
    try {
      const result = await rentalContractService.fetchTemplates(tenantId, language);
      setTemplates(result.data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      if (error.message !== 'Not Found') {
        addToast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: error?.message || (language === 'ar' ? 'فشل جلب القوالب' : 'Failed to fetch templates'),
          color: 'danger',
        });
      }
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (shouldFetch && tenantId) {
      fetchBookings();
      fetchTemplates();
    }
  }, [shouldFetch, tenantId, language]);

  return {
    bookings,
    templates,
    loadingBookings,
    loadingTemplates,
    fetchBookings,
    fetchTemplates,
  };
};