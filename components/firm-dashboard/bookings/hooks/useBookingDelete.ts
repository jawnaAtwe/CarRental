import { useState } from 'react';
import { useDisclosure, addToast } from '@heroui/react';
import { bookingService } from '../services/bookingService';

export const useBookingDelete = (
  language: string,
  selectedTenantId: number | undefined,
  selectedKeys: Set<string>,
  setSelectedKeys: (keys: Set<string>) => void,
  onSuccess: () => void
) => {
  const deleteModal = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'bulk';
    id?: number;
  } | null>(null);

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget || !selectedTenantId) return;
    
    deleteModal.onClose();

    if (deleteTarget.type === 'single' && deleteTarget.id) {
      await handleDeleteBooking(deleteTarget.id);
    }

    if (deleteTarget.type === 'bulk') {
      await handleBulkDeleteBookings();
    }

    setDeleteTarget(null);
  };

  const handleDeleteBooking = async (id: number) => {
    setLoading(true);
    try {
      await bookingService.deleteBooking(id, selectedTenantId!, language);

      onSuccess();
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: '',
        color: 'success',
      });
    } catch (err: any) {
      console.error(err);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: err?.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteBookings = async () => {
    const selectedIds = Array.from(selectedKeys).map((k) => Number(k));
    if (!selectedIds.length) return;

    setLoading(true);
    try {
      await bookingService.bulkDeleteBookings(selectedIds, selectedTenantId!, language);

      setSelectedKeys(new Set());
      onSuccess();
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: '',
        color: 'success',
      });
    } catch (err: any) {
      console.error(err);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: err?.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteModal,
    loading,
    deleteTarget,
    confirmDelete,
    executeDelete,
  };
};