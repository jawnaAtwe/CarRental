// components/BookingDetailsModal.tsx

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import moment from 'moment';
import { BookingDB } from '../types/paymentTypes';

interface BookingDetailsModalProps {
  language: string;
  isOpen: boolean;
  booking: BookingDB | null;
  loading: boolean;
  onClose: () => void;
}

export const BookingDetailsModal = ({
  language,
  isOpen,
  booking,
  loading,
  onClose,
}: BookingDetailsModalProps) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="lg">
      <ModalContent>
        <>
          <ModalHeader>
            {language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
          </ModalHeader>

          <ModalBody className="space-y-2 text-sm">
            {loading && (
              <p className="text-center text-gray-500">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            )}

            {booking && (
              <>
                <p>
                  <strong>{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}:</strong>{' '}
                  {booking.id}
                </p>

                <p>
                  <strong>{language === 'ar' ? 'اسم الزبون' : 'Customer'}:</strong>{' '}
                  {booking.customer_name}
                </p>

                <p>
                  <strong>{language === 'ar' ? 'السيارة' : 'Vehicle'}:</strong>{' '}
                  {booking.vehicle_name || '-'}
                </p>

                <p>
                  <strong>{language === 'ar' ? 'الفرع' : 'Branch'}:</strong>{' '}
                  {language === 'ar'
                    ? booking.branch_name_ar || booking.branch_name || '-'
                    : booking.branch_name || '-'}
                </p>

                <p>
                  <strong>{language === 'ar' ? 'بداية الحجز' : 'Start Date'}:</strong>{' '}
                  {moment(booking.start_date).format('DD MMM YYYY')}
                </p>

                <p>
                  <strong>{language === 'ar' ? 'نهاية الحجز' : 'End Date'}:</strong>{' '}
                  {moment(booking.end_date).format('DD MMM YYYY')}
                </p>

                <p>
                  <strong>
                    {language === 'ar' ? 'غرامة التأخير / يوم' : 'Late Fee / Day'}:
                  </strong>{' '}
                  {booking.late_fee_day ?? '-'}
                </p>

                <p>
                  <strong>{language === 'ar' ? 'قيمة الحجز' : 'Total Amount'}:</strong>{' '}
                  {booking.total_amount}
                </p>

                <p>
                  <strong>{language === 'ar' ? 'الحالة' : 'Status'}:</strong>{' '}
                  {booking.status}
                </p>

                {booking.created_at && (
                  <p>
                    <strong>
                      {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}:
                    </strong>{' '}
                    {moment(booking.created_at).format('DD MMM YYYY, hh:mm A')}
                  </p>
                )}
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};