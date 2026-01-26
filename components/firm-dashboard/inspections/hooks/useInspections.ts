import { useState } from 'react';
import { addToast } from '@heroui/react';
import type { InspectionDB, InspectionForm, Booking, Vehicle } from '../types';
import * as inspectionService from '../services/inspectionService';

export const useInspections = (
  tenantId: number | undefined,
  language: string
) => {
  const [inspections, setInspections] = useState<InspectionDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // ==================== Fetch Inspections ====================
  const loadInspections = async (
    page: number,
    search: string,
    statusFilter: string
  ) => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const data = await inspectionService.fetchInspections(
        tenantId,
        page,
        search,
        statusFilter,
        language
      );

      setInspections(data.data || []);
      setTotalPages(data.totalPages ?? 1);
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || 'Failed to fetch inspections',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== Save Inspection ====================
  const saveInspection = async (formData: InspectionForm, isEditing: boolean) => {
    try {
      const data = await inspectionService.saveInspection(formData, isEditing, language);
      
      addToast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: data?.message || '',
        color: 'success'
      });

      return { success: true };
    } catch (error: any) {
      console.error(error);
      return { success: false, error: error?.message || 'Failed to save inspection' };
    }
  };

  // ==================== Delete Inspection ====================
  const deleteInspection = async (id: number) => {
    setLoading(true);
    try {
      const msg = await inspectionService.deleteInspection(id, language);
      
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: msg,
        color: 'success'
      });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || '',
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== Bulk Delete ====================
  const bulkDelete = async (ids: number[]) => {
    if (ids.length === 0) return;

    setLoading(true);
    try {
      const msg = await inspectionService.bulkDeleteInspections(ids, language);
      
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: msg,
        color: 'success'
      });
    } catch (error: any) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || '',
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== Load Form Data ====================
  const loadFormData = async () => {
    if (!tenantId) return;

    try {
      const [bookingsData, vehiclesData] = await Promise.all([
        inspectionService.fetchBookings(tenantId),
        inspectionService.fetchVehicles(tenantId),
      ]);

      setBookings(bookingsData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Error',
        description: 'Failed to load data',
        color: 'danger'
      });
    }
  };

  return {
    inspections,
    loading,
    totalPages,
    bookings,
    vehicles,
    loadInspections,
    saveInspection,
    deleteInspection,
    bulkDelete,
    loadFormData,
  };
};