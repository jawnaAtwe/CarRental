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
import {
  DocumentTextIcon,
  UserIcon,
  TruckIcon,
  DocumentDuplicateIcon,
  HashtagIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/solid';
import { CONTRACT_STATUS_OPTIONS } from '../constants';
import { BookingDB, ContractTemplateDB } from '../hooks/types';

type RentalContractFormProps = {
  language: string;
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  formData: {
    booking_id?: number;
    customer_id?: number;
    vehicle_id?: number;
    template_id?: number;
    contract_number?: string | null;
    pdf_path?: string;
    status?: string;
  };
  bookings: BookingDB[]; 
  templates: ContractTemplateDB[];
  loadingBookings: boolean;
  loadingTemplates: boolean;
  submitError: string[] | string;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: string, value: any) => void;
  onBookingChange: (bookingId: number) => void; 
};

export const RentalContractForm = ({
  language,
  isOpen,
  isEditing,
  loading,
  formData,
  bookings,
  templates,
  loadingBookings,
  loadingTemplates,
  submitError,
  onClose,
  onSave,
  onChange,
  onBookingChange,
}: RentalContractFormProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <DocumentTextIcon className="h-6 w-6 text-primary" />
          {isEditing
            ? language === 'ar'
              ? 'تعديل عقد الإيجار'
              : 'Edit Rental Contract'
            : language === 'ar'
            ? 'عقد إيجار جديد'
            : 'New Rental Contract'}
        </ModalHeader>
        <Form className="w-full">
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
                    <ul className="list-disc list-inside">
                      {Array.isArray(submitError) ? (
                        submitError.map((err, idx) => <li key={idx}>{err}</li>)
                      ) : (
                        <p>{submitError}</p>
                      )}
                    </ul>
                  }
                  variant="flat"
                  color="danger"
                  className="mb-4"
                />
              )}

         <Select
  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
  label={language === 'ar' ? 'رقم الحجز' : 'Booking ID'}
  placeholder={language === 'ar' ? 'اختر الحجز' : 'Select Booking'}
  variant="faded"
  startContent={<HashtagIcon className="h-5 w-5 text-foreground/50" />}
  selectedKeys={formData.booking_id ? new Set([formData.booking_id.toString()]) : new Set()}
  onSelectionChange={(keys) => {
    const id = Number(Array.from(keys)[0]);
    const booking = bookings.find((b) => b.id === id);

    onChange('booking_id', id); 
    onChange('customer_id', booking?.customer_id || 0); 
    onBookingChange(id); 
  }}
  isRequired
  isDisabled={isEditing}
  isLoading={loadingBookings}
>
  {bookings.map((booking) => (
    <SelectItem
      key={booking.id.toString()}
      textValue={`#${booking.id} - ${booking.customer_name || `Customer ${booking.customer_id}`}`}
    >
      #{booking.id} - {booking.customer_name || `Customer ${booking.customer_id}`} - {booking.vehicle_name || 'Unknown'}
    </SelectItem>
  ))}
</Select>


            <div className="grid gap-4 md:grid-cols-2">
              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
                label={language === 'ar' ? 'رقم العميل' : 'Customer ID'}
                type="number"
                variant="faded"
                startContent={<UserIcon className="h-5 w-5 text-foreground/50" />}
                value={String(formData.customer_id || '')}
                isReadOnly
                isDisabled
                description={language === 'ar' ? 'يتم ملؤه تلقائياً من الحجز' : 'Auto-filled from booking'}
              />

              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
                label={language === 'ar' ? 'رقم المركبة' : 'Vehicle ID'}
                type="number"
                variant="faded"
                startContent={<TruckIcon className="h-5 w-5 text-foreground/50" />}
                value={String(formData.vehicle_id || '')}
                isReadOnly
                isDisabled
                description={language === 'ar' ? 'يتم ملؤه تلقائياً من الحجز' : 'Auto-filled from booking'}
              />
            </div>

         <Select
  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
  label={language === 'ar' ? 'قالب العقد' : 'Contract Template'}
  variant="faded"
  startContent={<DocumentDuplicateIcon className="h-5 w-5 text-foreground/50" />}
  selectedKeys={formData.template_id ? new Set([formData.template_id.toString()]) : new Set()}
  onSelectionChange={(keys) => {
    const id = Number(Array.from(keys)[0]);
    const template = templates.find((t) => t.id === id);

    onChange('template_id', id); 
  }}
  isRequired
>
  {templates.map((template) => (
    <SelectItem
      key={template.id.toString()}
      textValue={`${template.name} (${template.language.toUpperCase()})`}
    >
      {template.name} ({template.language.toUpperCase()})
    </SelectItem>
  ))}
</Select>



            <Input
              className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
              label={language === 'ar' ? 'رقم العقد' : 'Contract Number'}
              variant="faded"
              startContent={<DocumentTextIcon className="h-5 w-5 text-foreground/50" />}
              value={formData.contract_number || ''}
              onChange={(e) => onChange('contract_number', e.target.value)}
              placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
            />

            {/* <Input
              className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
              label={language === 'ar' ? 'مسار ملف PDF' : 'PDF Path'}
              variant="faded"
              startContent={<DocumentArrowUpIcon className="h-5 w-5 text-foreground/50" />}
              value={formData.pdf_path || ''}
              onChange={(e) => onChange('pdf_path', e.target.value)}
              isRequired={!isEditing}
              placeholder={language === 'ar' ? 'مثال: /contracts/contract_123.pdf' : 'Example: /contracts/contract_123.pdf'}
            /> */}

            {isEditing && (
              <Select
                label={language === 'ar' ? 'الحالة' : 'Status'}
                placeholder={language === 'ar' ? 'اختر الحالة' : 'Select Status'}
                selectedKeys={formData.status ? [formData.status] : []}
                onChange={(e) => onChange('status', e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg"
                isRequired
              >
                {CONTRACT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value}>
                    {language === 'ar' ? option.labelAr : option.labelEn}
                  </SelectItem>
                ))}
              </Select>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {language === 'ar' ? (
                  <>
                    <strong>💡 تلميح:</strong> عند اختيار الحجز، سيتم ملء بيانات العميل والمركبة تلقائياً.
                  </>
                ) : (
                  <>
                    <strong>💡 Tip:</strong> When you select a booking, customer and vehicle data will be auto-filled.
                  </>
                )}
              </p>
            </div>
          </ModalBody>
        </Form>
        <ModalFooter className="flex justify-end gap-3">
          <Button variant="flat" onPress={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="solid" color="primary" isLoading={loading} onPress={onSave}>
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};