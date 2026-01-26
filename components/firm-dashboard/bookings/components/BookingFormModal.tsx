'use client';

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
import { BookingForm, Branch, Customer, Vehicle } from '../types/bookingTypes';
import { BOOKING_STATUS_OPTIONS } from '../constants/bookingConstants';

interface BookingFormModalProps {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  isEditing: boolean;
  formData: BookingForm;
  setFormData: (data: BookingForm | ((prev: BookingForm) => BookingForm)) => void;
  customers: Customer[];
  vehicles: Vehicle[];
  branches: Branch[];
  submitError: string[] | string;
  loadingForm: boolean;
  onSave: () => void;
  onClose: () => void;
}

export const BookingFormModal = ({
  language,
  isOpen,
  onOpenChange,
  isEditing,
  formData,
  setFormData,
  customers,
  vehicles,
  branches,
  submitError,
  loadingForm,
  onSave,
  onClose,
}: BookingFormModalProps) => {
  return (
    <Modal
      isDismissable={false}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="xl"
      scrollBehavior="inside"
      backdrop="blur"
    >
     <ModalContent className="rounded-2xl overflow-hidden bg-content1/95 shadow-xl">

        {() => (
          <Form
            onSubmit={(e: any) => {
              e.preventDefault();
              onSave();
            }}
            className="w-full"
          >
            <ModalHeader className="flex items-center gap-3 text-xl font-semibold">
              {isEditing
                ? language === 'ar'
                  ? 'تعديل الحجز'
                  : 'Edit Booking'
                : language === 'ar'
                ? 'إنشاء حجز جديد'
                : 'Create New Booking'}
            </ModalHeader>

            <ModalBody className="space-y-4">
             {submitError &&
                  ((Array.isArray(submitError) && submitError.length > 0) ||
                    (typeof submitError === 'string' && submitError.trim() !== '')) && (
                    <Alert
                  title={
                    isEditing
                      ? language === 'ar'
                        ? 'فشل الحفظ'
                        : 'Save Failed'
                      : language === 'ar'
                      ? 'فشل الإنشاء'
                      : 'Create Failed'
                  }
                  description={
                    typeof submitError === 'string' ? (
                      <p>{submitError}</p>
                    ) : (
                      <ul className="list-disc list-inside">
                        {submitError.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    )
                  }
                  variant="flat"
                  color="danger"
                  className="mb-4"
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Select
                  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200"
                  label={language === 'ar' ? 'العميل' : 'Customer'}
                  selectedKeys={
                    formData.customer_id ? [formData.customer_id.toString()] : []
                  }
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, customer_id: Number(e.target.value) }))
                  }
                  isRequired
                >
                  {customers.map((c) => (
                    <SelectItem key={c.id.toString()}>{c.full_name}</SelectItem>
                  ))}
                </Select>

                <Select
                  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200"
                  label={language === 'ar' ? 'المركبة' : 'Vehicle'}
                  selectedKeys={
                    formData.vehicle_id ? new Set([formData.vehicle_id.toString()]) : new Set()
                  }
                  onSelectionChange={(keys) => {
                    const id = Number(Array.from(keys)[0]);
                    const vehicle = vehicles.find((v) => v.id === id);

                    setFormData((p) => ({
                      ...p,
                      vehicle_id: id,
                      vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : '',
                    }));
                  }}
                  isRequired
                >
                  {vehicles.map((v) => (
                    <SelectItem key={v.id.toString()} textValue={`${v.make} ${v.model}`}>
                      {v.make} {v.model}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200"
                  label={language === 'ar' ? 'الفرع' : 'Branch'}
                  selectedKeys={formData.branch_id ? [formData.branch_id.toString()] : []}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, branch_id: Number(e.target.value) }))
                  }
                  isRequired
                >
                  {branches.map((b) => (
                    <SelectItem key={b.id.toString()}>
                      {language === 'ar' ? b.name_ar : b.name}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  label={language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, start_date: e.target.value }))
                  }
                  isRequired
                />

                <Input
                  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  label={language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                  isRequired
                />

                <Input
                  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  label={language === 'ar' ? 'المجموع' : 'Total Amount'}
                  type="number"
                  value={formData.total_amount.toString()}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, total_amount: Number(e.target.value) }))
                  }
                  isRequired
                />

                {isEditing && (
                  <Select
                    className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200"
                    label={language === 'ar' ? 'الحالة' : 'Status'}
                    selectedKeys={[formData.status || 'pending']}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        status: e.target.value as BookingForm['status'],
                      }))
                    }
                  >
                    {BOOKING_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.key}>
                        {language === 'ar' ? status.labelAr : status.labelEn}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button color="primary" type="submit" isLoading={loadingForm}>
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </ModalFooter>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
};