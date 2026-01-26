import { useState, useEffect } from 'react';
import { useDisclosure, addToast } from '@heroui/react';
import { bookingService } from '../services/bookingService';
import { BookingDB, BookingForm, Vehicle } from '../types/bookingTypes';

export const useBookingForm = (
  language: string,
  selectedTenantId: number | undefined,
  selectedBranchId: number | null,
  vehicles: Vehicle[],
  onSuccess: () => void
) => {
  const editModal = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [activeBooking, setActiveBooking] = useState<BookingDB | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | string>([]);

  const [formData, setFormData] = useState<BookingForm>({
    tenant_id: selectedTenantId,
    branch_id: undefined,
    customer_id: undefined,
    vehicle_id: undefined,
    late_fee_day: 0,
    vehicle_name: '',
    start_date: '',
    end_date: '',
    total_amount: 0,
    status: 'pending',
  });

  // Update formData when selectedTenantId changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tenant_id: selectedTenantId,
    }));
  }, [selectedTenantId]);

  const resetBookingForm = () => {
    setFormData({
      id: undefined,
      customer_id: undefined,
      vehicle_id: undefined,
      branch_id: undefined,
      tenant_id: selectedTenantId,
      late_fee_day: 0,
      vehicle_name: '',
      start_date: '',
      end_date: '',
      total_amount: 0,
      status: 'pending',
    });
    setSubmitError([]);
  };

  const openCreateBooking = (branches: any[]) => {
    if (branches.length === 0) {
      addToast({
        title: language === 'ar' ? 'تحذير' : 'Warning',
        description:
          language === 'ar'
            ? 'لا يمكن إضافة مركبة. يرجى التأكد من تحميل الفروع أولاً'
            : 'Cannot add vehicle. Please ensure branches are loaded first',
        color: 'warning',
      });
      return;
    }

    setIsEditing(false);
    resetBookingForm();
    setActiveBooking(null);
    editModal.onOpen();
  };

  const openEditBooking = (booking: BookingDB) => {
    setIsEditing(true);
    const vehicle = vehicles.find((v) => v.id === booking.vehicle_id);

    setFormData({
      id: booking.id,
      customer_id: booking.customer_id ?? undefined,
      vehicle_id: booking.vehicle_id ?? undefined,
      vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : '',
      branch_id: booking.branch_id ?? undefined,
      tenant_id: booking.tenant_id ?? selectedTenantId,
      late_fee_day: booking.late_fee_day ?? 0,
      start_date: booking.start_date ? booking.start_date.split('T')[0] : '',
      end_date: booking.end_date ? booking.end_date.split('T')[0] : '',
      total_amount: booking.total_amount ?? 0,
      status: booking.status ?? 'pending',
    });

    setActiveBooking(booking);
    editModal.onOpen();
    setSubmitError([]);
  };

  const saveBooking = async () => {
    setLoadingForm(true);
    setSubmitError([]);
    
    try {
      // Validate required fields
      if (!formData.customer_id) {
        throw new Error(language === 'ar' ? 'يرجى اختيار العميل' : 'Please select customer');
      }
      if (!formData.vehicle_id) {
        throw new Error(language === 'ar' ? 'يرجى اختيار المركبة' : 'Please select vehicle');
      }
      if (!formData.start_date) {
        throw new Error(language === 'ar' ? 'يرجى إدخال تاريخ البداية' : 'Please enter start date');
      }
      if (!formData.end_date) {
        throw new Error(language === 'ar' ? 'يرجى إدخال تاريخ النهاية' : 'Please enter end date');
      }
      
      const payload = {
        ...formData,
        tenant_id: selectedTenantId,
        branch_id: formData.branch_id ?? selectedBranchId,
        customer_id: formData.customer_id,
        vehicle_id: formData.vehicle_id,
      };

      const data = await bookingService.saveBooking(payload, isEditing, language);

      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description:
          data?.message ||
          (language === 'ar' ? 'تم حفظ الحجز بنجاح' : 'Booking saved successfully'),
        color: 'success',
      });

      editModal.onClose();
      resetBookingForm();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || (language === 'ar' ? 'فشل الحفظ' : 'Save failed');
      setSubmitError(errorMessage);
      
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: errorMessage,
        color: 'danger',
      });
    } finally {
      setLoadingForm(false);
    }
  };

  return {
    editModal,
    isEditing,
    activeBooking,
    formData,
    setFormData,
    loadingForm,
    submitError,
    openCreateBooking,
    openEditBooking,
    saveBooking,
    resetBookingForm,
  };
};