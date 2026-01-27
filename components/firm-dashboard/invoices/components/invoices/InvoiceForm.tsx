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
  Textarea,
} from '@heroui/react';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/solid';
import { InvoiceStatus,Booking } from '../../hooks/types/invoice.types';

type InvoiceFormProps = {
  language: string;
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  formData: {
    status?: InvoiceStatus;
    booking_id?: number;
    customer_id?: number;
    subtotal?: number;
    vat_rate?: number;
    currency_code?: string;
    notes?: string | null;
  };
    bookings: Booking[];
  submitError: string[] | string;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: string, value: any) => void;
};

export const InvoiceForm = ({
  language,
  isOpen,
  isEditing,
  loading,
  formData,
  bookings,
  submitError,
  onClose,
  onSave,
  onChange,
}: InvoiceFormProps) => {
const statuses = [
  { value: 'draft', label: language === 'ar' ? 'مسودة' : 'Draft' },
  { value: 'issued', label: language === 'ar' ? 'صادرة' : 'Issued' },
  { value: 'partially_paid', label: language === 'ar' ? 'مدفوعة جزئياً' : 'Partially Paid' },
  { value: 'paid', label: language === 'ar' ? 'مدفوعة' : 'Paid' },
  { value: 'cancelled', label: language === 'ar' ? 'ملغاة' : 'Cancelled' },
];

  const calculateTotal = () => {
    const subtotal = Number(formData.subtotal || 0);
    const vatRate = Number(formData.vat_rate || 0);
    const vatAmount = (subtotal * vatRate) / 100;
    const total = subtotal + vatAmount;
    return { vatAmount: vatAmount.toFixed(2), total: total.toFixed(2) };
  };

  const { vatAmount, total } = calculateTotal();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <DocumentTextIcon className="h-6 w-6 text-primary" />
          {isEditing
            ? language === 'ar'
              ? 'تعديل الفاتورة'
              : 'Edit Invoice'
            : language === 'ar'
            ? 'فاتورة جديدة'
            : 'New Invoice'}
        </ModalHeader>
        <Form className="w-full">
          <ModalBody className="space-y-4 max-h-[70vh] overflow-auto">
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

            <div className="grid gap-4 md:grid-cols-2">
              {/* <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
                label={language === 'ar' ? 'رقم الحجز' : 'Booking ID'}
                type="number"
                variant="faded"
                startContent={<CalendarIcon className="h-5 w-5 text-foreground/50" />}
                value={String(formData.booking_id || '')}
                onChange={(e) => onChange('booking_id', Number(e.target.value))}
                isRequired
                isDisabled={isEditing}
              /> */}
<Select
  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
  label={language === 'ar' ? 'رقم الحجز' : 'Booking ID'}
  variant="faded"
  startContent={<CalendarIcon className="h-5 w-5 text-foreground/50" />}
  selectedKeys={formData.booking_id ? new Set([formData.booking_id.toString()]) : new Set()}
  onSelectionChange={(keys) => {
    const id = Number(Array.from(keys)[0]);
    const booking = bookings.find((b) => b.id === id);

    onChange('booking_id', id); 
    onChange('customer_id', booking?.customer_id || 0); 
  }}
  isRequired
  isDisabled={isEditing}
>
  {bookings.map((b) => (
    <SelectItem key={b.id.toString()} textValue={`${b.id} - ${b.customer_name || 'Unknown'}`}>
      {b.id} - {b.customer_name || 'Unknown'} -  {b.vehicle_name || 'Unknown'} 
    </SelectItem>
  ))}
</Select>

<Input
  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
  label={language === 'ar' ? 'رقم العميل' : 'Customer ID'}
  type="number"
  variant="faded"
  startContent={<UserIcon className="h-5 w-5 text-foreground/50" />}
  value={String(formData.customer_id || '')}
  isDisabled 
/>

            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
                label={language === 'ar' ? 'المبلغ الأساسي' : 'Subtotal'}
                type="number"
                step="0.01"
                variant="faded"
                startContent={<CurrencyDollarIcon className="h-5 w-5 text-foreground/50" />}
                value={String(formData.subtotal || '')}
                onChange={(e) => onChange('subtotal', Number(e.target.value))}
                isRequired
              />
              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
                label={language === 'ar' ? 'نسبة الضريبة (%)' : 'VAT Rate (%)'}
                type="number"
                step="0.01"
                variant="faded"
                startContent={<ReceiptPercentIcon className="h-5 w-5 text-foreground/50" />}
                value={String(formData.vat_rate || '')}
                onChange={(e) => onChange('vat_rate', Number(e.target.value))}
                isRequired
              />
            </div>

             <Input
                className="bg-gray-50 dark:bg-gray-700 rounded-lg"
                placeholder={language === 'ar' ? 'اختر العملة' : 'Select Currency'}
                label={language === 'ar' ? 'العملة' : 'Currency'}
                type="string"
                variant="faded"
                value={String(formData.currency_code || '')}
                   onChange={(e) => onChange('currency_code', e.target.value)}
                isRequired
                isDisabled={isEditing}
              />
              
            {/* عرض الحسابات */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-600">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'المبلغ الأساسي:' : 'Subtotal:'}
                </span>
                <span className="text-sm font-semibold">
                  {Number(formData.subtotal || 0).toFixed(2)} {formData.currency_code}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'الضريبة:' : 'VAT:'}
                </span>
                <span className="text-sm font-semibold">
                  {vatAmount} {formData.currency_code}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300 dark:border-gray-600">
                <span className="text-base font-bold">
                  {language === 'ar' ? 'المجموع الكلي:' : 'Total Amount:'}
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {total} {formData.currency_code}
                </span>
              </div>
            </div>
              <Select
              className="bg-gray-50 dark:bg-gray-700 rounded-lg"
              label={language === 'ar' ? 'الحالة' : 'Status'}
              placeholder={language === 'ar' ? 'اختر الحالة' : 'Select Status'}
              selectedKeys={formData.status ? [formData.status] : []}
              onChange={(e) => onChange('status', e.target.value)}
              isRequired
            >
              {statuses.map((s) => (
                <SelectItem key={s.value}>{s.label}</SelectItem>
              ))}
            </Select>

            <Textarea
              className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
              label={language === 'ar' ? 'ملاحظات' : 'Notes'}
              variant="faded"
              minRows={3}
              value={formData.notes || ''}
              onChange={(e) => onChange('notes', e.target.value)}
            />
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