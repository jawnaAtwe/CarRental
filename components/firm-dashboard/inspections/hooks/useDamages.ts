import { useState } from 'react';
import { addToast } from '@heroui/react';
import type { Damage, DamageForm } from '../types';
import * as damageService from '../services/damageService';

export const useDamages = (
  tenantId: number | undefined,
  language: string
) => {
  const [damages, setDamages] = useState<Damage[]>([]);
  const [loadingDamages, setLoadingDamages] = useState(false);

  // ==================== Fetch Damages ====================
  const loadDamages = async (inspectionId: number) => {
    if (!tenantId) return;

    setLoadingDamages(true);
    try {
      const data = await damageService.fetchInspectionDamages(
        inspectionId,
        tenantId,
        language
      );
      setDamages(data);
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Error',
        description: 'Failed to fetch damages',
        color: 'danger'
      });
    } finally {
      setLoadingDamages(false);
    }
  };

  // ==================== Save Damage ====================
  const saveDamage = async (
    damageData: DamageForm,
    inspectionId: number
  ) => {
    if (!tenantId) return;

    try {
      await damageService.saveDamage(
        { ...damageData, inspection_id: inspectionId, tenant_id: tenantId },
        language
      );

      await loadDamages(inspectionId);

      addToast({
        title: language === 'ar' ? 'تم' : 'Success',
        description: language === 'ar' ? 'تم حفظ الضرر بنجاح' : 'Damage saved successfully',
        color: 'success'
      });

      return { success: true };
    } catch (err: any) {
      console.error('Save damage error:', err);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: err.message || (language === 'ar' ? 'فشل في حفظ الضرر' : 'Failed to save damage'),
        color: 'danger'
      });
      return { success: false };
    }
  };

  // ==================== Update Damage ====================
  const updateDamage = async (
    damageId: number,
    payload: any,
    inspectionId: number
  ) => {
    try {
      const data = await damageService.updateDamage(damageId, payload, language);

      await loadDamages(inspectionId);

      addToast({
        title: language === 'ar' ? 'تم' : 'Success',
        description: data?.message || (language === 'ar' ? 'تم تعديل الضرر بنجاح' : 'Damage updated successfully'),
        color: 'success',
      });

      return { success: true };
    } catch (err: any) {
      console.error("updateDamage error:", err);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: err.message || (language === 'ar' ? 'فشل في تعديل الضرر' : 'Failed to update damage'),
        color: 'danger',
      });
      return { success: false };
    }
  };

  // ==================== Delete Damage ====================
  const removeDamage = async (damageId: number, inspectionId: number) => {
    try {
      await damageService.deleteDamage(damageId, language);

      await loadDamages(inspectionId);

      addToast({
        title: language === 'ar' ? 'تم' : 'Success',
        description: language === 'ar' ? 'تم حذف الضرر بنجاح' : 'Damage deleted successfully',
        color: 'success'
      });
    } catch (err: any) {
      console.error('Delete damage error:', err);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: err.message || (language === 'ar' ? 'فشل في حذف الضرر' : 'Failed to delete damage'),
        color: 'danger'
      });
    }
  };

  return {
    damages,
    loadingDamages,
    loadDamages,
    saveDamage,
    updateDamage,
    removeDamage,
  };
};