import {
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import moment from 'moment';
import { StatusChip } from './StatusChip';
import { InvoiceDB } from '../../hooks/types/invoice.types';

type InvoiceViewModalProps = {
  language: string;
  isOpen: boolean;
  invoice: InvoiceDB | null;
  onClose: () => void;
};

export const InvoiceViewModal = ({
  language,
  isOpen,
  invoice,
  onClose,
}: InvoiceViewModalProps) => {
  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent className="bg-white dark:bg-gray-800 text-black dark:text-gray-200">
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold">{language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}</h3>
          <p className="text-sm text-gray-500">{invoice.invoice_number}</p>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {/* معلومات أساسية */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</p>
              <StatusChip status={invoice.status} language={language} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
              <p className="font-medium">
                {moment(invoice.invoice_date).locale(language).format('DD MMMM YYYY')}
              </p>
            </div>
          </div>

          <Divider />

          {/* معلومات الحجز والعميل */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}</p>
              <p className="font-medium">#{invoice.booking_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'حالة الحجز' : 'Booking Status'}</p>
              <p className="font-medium">{invoice.booking_status || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'العميل' : 'Customer'}</p>
              <p className="font-medium">{invoice.customer_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'المركبة' : 'Vehicle'}</p>
              <p className="font-medium">{invoice.vehicle_name || '-'}</p>
            </div>
          </div>

          <Divider />

          {/* التفاصيل المالية */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{language === 'ar' ? 'المبلغ الأساسي' : 'Subtotal'}</span>
                <span className="font-semibold">
                 {Number(invoice.subtotal).toFixed(2)} {invoice.currency_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'الضريبة' : 'VAT'} ({invoice.vat_rate}%)
                </span>
                <span className="font-semibold">
                {Number(invoice.vat_amount).toFixed(2)} {invoice.currency_code}
                </span>
              </div>
              <Divider />
              <div className="flex justify-between">
                <span className="text-lg font-bold">{language === 'ar' ? 'المجموع الكلي' : 'Total Amount'}</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                   {Number(invoice.total_amount).toFixed(2)} {invoice.currency_code}
                </span>
              </div>
            </div>
          </div>

          {/* الملاحظات */}
          {invoice.notes && (
            <>
              <Divider />
              <div>
                <p className="text-sm text-gray-500 mb-2">{language === 'ar' ? 'الملاحظات' : 'Notes'}</p>
                <p className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* معلومات إضافية */}
          <Divider />
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <p>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</p>
              <p>{moment(invoice.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}</p>
            </div>
            <div>
              <p>{language === 'ar' ? 'آخر تحديث' : 'Updated At'}</p>
              <p>{moment(invoice.updated_at).locale(language).format('DD MMM YYYY, hh:mm A')}</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};