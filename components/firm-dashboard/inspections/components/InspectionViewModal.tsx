'use client';

import moment from 'moment';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import DamagesTable from './DamagesTable';
import type { InspectionDB, Damage } from '../types';

interface InspectionViewModalProps {
  language: string;
  isOpen: boolean;
  inspection: InspectionDB | null;
  damages: Damage[];
  loadingDamages: boolean;
  onClose: () => void;
  onAddDamage: () => void;
  onEditDamage: (damage: Damage) => void;
  onDeleteDamage: (damageId: number) => void;
}

export default function InspectionViewModal({
  language,
  isOpen,
  inspection,
  damages,
  loadingDamages,
  onClose,
  onAddDamage,
  onEditDamage,
  onDeleteDamage,
}: InspectionViewModalProps) {
  if (!inspection) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="lg" backdrop="blur">
      <ModalContent className="max-h-[80vh] overflow-y-auto w-[90vw] max-w-[900px]">
        <ModalHeader>{language === 'ar' ? 'تفاصيل الفحص' : 'Inspection Details'}</ModalHeader>

        <ModalBody className="space-y-2">
          <p>
            <strong>{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}:</strong> {inspection.booking_id}
          </p>
          <p>
            <strong>{language === 'ar' ? 'رقم المركبة' : 'Vehicle ID'}:</strong> {inspection.vehicle_id}
          </p>
          <p>
            <strong>{language === 'ar' ? 'اسم العميل' : 'Customer Name'}:</strong>{' '}
            {inspection.customer_name || '-'}
          </p>
          <p>
            <strong>{language === 'ar' ? 'نوع الفحص' : 'Inspection Type'}:</strong>{' '}
            {inspection.inspection_type}
          </p>
          <p>
            <strong>{language === 'ar' ? 'تاريخ الفحص' : 'Inspection Date'}:</strong>{' '}
            {moment(inspection.inspection_date).format('DD MMM YYYY, hh:mm A')}
          </p>
          <p>
            <strong>{language === 'ar' ? 'قام بالفحص' : 'Inspected By'}:</strong>{' '}
            {inspection.inspected_by ?? '-'}
          </p>
          <p>
            <strong>{language === 'ar' ? 'عداد الكيلومترات' : 'Odometer'}:</strong>{' '}
            {inspection.odometer ?? '-'}
          </p>
          <p>
            <strong>{language === 'ar' ? 'مستوى الوقود' : 'Fuel Level'}:</strong>{' '}
            {inspection.fuel_level != null ? `${inspection.fuel_level}%` : '-'}
          </p>
          <p>
            <strong>{language === 'ar' ? 'نتائج القائمة' : 'Checklist Results'}:</strong>
          </p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">
            {inspection.checklist_results
              ? JSON.stringify(inspection.checklist_results, null, 2)
              : '-'}
          </pre>
          <p>
            <strong>{language === 'ar' ? 'ملاحظات' : 'Notes'}:</strong> {inspection.notes || '-'}
          </p>
          <p>
            <strong>{language === 'ar' ? 'الحالة' : 'Status'}:</strong> {inspection.status}
          </p>

          {/* جدول الأضرار */}
          <DamagesTable
            language={language}
            damages={damages}
            loading={loadingDamages}
            onAddDamage={onAddDamage}
            onEditDamage={onEditDamage}
            onDeleteDamage={onDeleteDamage}
          />
        </ModalBody>

        <ModalFooter>
          <Button onPress={onClose}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}