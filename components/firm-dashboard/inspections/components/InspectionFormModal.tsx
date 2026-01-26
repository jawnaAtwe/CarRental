'use client';

import moment from 'moment';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';
import type { InspectionForm, Booking, Vehicle } from '../types';

interface InspectionFormModalProps {
  language: string;
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  loadingData: boolean;
  formData: InspectionForm;
  bookings: Booking[];
  vehicles: Vehicle[];
  submitError: string[] | string;
  onClose: () => void;
  onChange: (data: Partial<InspectionForm>) => void;
  onSubmit: () => void;
}

export default function InspectionFormModal({
  language,
  isOpen,
  isEditing,
  loading,
  loadingData,
  formData,
  bookings,
  vehicles,
  submitError,
  onClose,
  onChange,
  onSubmit,
}: InspectionFormModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="xl">
      <ModalContent>
        <ModalHeader>
          {isEditing
            ? language === 'ar' ? 'تعديل الفحص' : 'Edit Inspection'
            : language === 'ar' ? 'فحص جديد' : 'New Inspection'}
        </ModalHeader>

        {loadingData ? (
          <div className="flex justify-center items-center p-6">
            <p>{language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
          </div>
        ) : (
          <Form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <ModalBody className="space-y-3">
              <div className="w-full max-w-7xl mx-auto px-6 py-4 space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Booking Select */}
                  <Select
                    label={language === 'ar' ? 'الحجز' : 'Booking'}
                    selectedKeys={[formData.booking_id?.toString() || '']}
                    onSelectionChange={(keys) => {
                      const id = Number(Array.from(keys)[0]);
                      onChange({ booking_id: id });
                    }}
                  >
                    {bookings.map((b) => (
                      <SelectItem key={b.id.toString()}>
                        {b.name || `Booking #${b.id}`}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Vehicle Select */}
                  <Select
                    label={language === 'ar' ? 'المركبة' : 'Vehicle'}
                    selectedKeys={[formData.vehicle_id?.toString() || '']}
                    onSelectionChange={(keys) => {
                      const id = Number(Array.from(keys)[0]);
                      onChange({ vehicle_id: id });
                    }}
                  >
                    {vehicles.map((v) => (
                      <SelectItem key={v.id.toString()}>
                        {v.name || `Vehicle #${v.id}`}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Fuel Level */}
                  <Input
                    type="number"
                    label={language === 'ar' ? 'مستوى الوقود (%)' : 'Fuel Level (%)'}
                    value={formData.fuel_level?.toString() || ''}
                    onChange={(e) => onChange({ fuel_level: Number(e.target.value) })}
                    min={0}
                    max={100}
                  />

                  {/* Inspection Type */}
                  <Select
                    label={language === 'ar' ? 'نوع الفحص' : 'Inspection Type'}
                    selectedKeys={[formData.inspection_type]}
                    onChange={(e) =>
                      onChange({
                        inspection_type: e.target.value as 'pre_rental' | 'post_rental',
                      })
                    }
                  >
                    <SelectItem key="pre_rental">
                      {language === 'ar' ? 'قبل الإيجار' : 'Pre Rental'}
                    </SelectItem>
                    <SelectItem key="post_rental">
                      {language === 'ar' ? 'بعد الإيجار' : 'Post Rental'}
                    </SelectItem>
                  </Select>

                  {/* Inspection Date */}
                  <Input
                    type="date"
                    label={language === 'ar' ? 'تاريخ الفحص' : 'Inspection Date'}
                    value={
                      formData.inspection_date
                        ? moment(formData.inspection_date).format('YYYY-MM-DD')
                        : ''
                    }
                    onChange={(e) => onChange({ inspection_date: e.target.value })}
                  />

                  {/* Odometer */}
                  <Input
                    type="number"
                    label={language === 'ar' ? 'عداد الكيلومترات' : 'Odometer'}
                    value={formData.odometer?.toString() || ''}
                    onChange={(e) => onChange({ odometer: Number(e.target.value) })}
                  />

                  {/* Checklist Results */}
                  <Input
                    type="text"
                    label={language === 'ar' ? 'نتائج القائمة' : 'Checklist Results (JSON)'}
                    value={
                      formData.checklist_results
                        ? JSON.stringify(formData.checklist_results)
                        : ''
                    }
                    onChange={(e) => {
                      try {
                        onChange({ checklist_results: JSON.parse(e.target.value) });
                      } catch {}
                    }}
                  />

                  {/* Notes */}
                  <Input
                    type="text"
                    label={language === 'ar' ? 'ملاحظات' : 'Notes'}
                    value={formData.notes || ''}
                    onChange={(e) => onChange({ notes: e.target.value })}
                  />

                  {/* Status */}
                  <Select
                    label={language === 'ar' ? 'الحالة' : 'Status'}
                    selectedKeys={[formData.status]}
                    onChange={(e) =>
                      onChange({ status: e.target.value as 'pending' | 'completed' })
                    }
                  >
                    <SelectItem key="pending">
                      {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                    </SelectItem>
                    <SelectItem key="completed">
                      {language === 'ar' ? 'مكتمل' : 'Completed'}
                    </SelectItem>
                  </Select>
                </div>

                {/* Error Alert */}
                {submitError &&
                  ((Array.isArray(submitError) && submitError.length > 0) ||
                    (typeof submitError === 'string' && submitError.trim() !== '')) && (
                    <Alert
                      title={
                        isEditing
                          ? language === 'ar' ? 'فشل الحفظ' : 'Save Failed'
                          : language === 'ar' ? 'فشل الإنشاء' : 'Create Failed'
                      }
                      description={
                        <ul className="list-disc list-inside">
                          {Array.isArray(submitError)
                            ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
                            : <p>{submitError}</p>}
                        </ul>
                      }
                      variant="flat"
                      color="danger"
                      className="mb-4"
                    />
                  )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button color="primary" type="submit" isLoading={loading}>
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </ModalFooter>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
}