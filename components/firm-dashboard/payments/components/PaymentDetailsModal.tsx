// components/PaymentDetailsModal.tsx

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import moment from 'moment';
import { Payment } from '../types/paymentTypes';

interface PaymentDetailsModalProps {
  language: string;
  isOpen: boolean;
  payment: Payment | null;
  currency: string;
  onClose: () => void;
}

export const PaymentDetailsModal = ({
  language,
  isOpen,
  payment,
  currency,
  onClose,
}: PaymentDetailsModalProps) => {
  if (!payment) return null;

  const renderAmount = () => {
    const full = `${payment.amount} ${currency}`;
    const paid = payment.paid_amount
      ? `(${language === 'ar' ? 'مدفوع' : 'Paid'}: ${payment.paid_amount} ${currency})`
      : '';
    const partial = payment.partial_amount
      ? `(${language === 'ar' ? 'جزئي' : 'Partial'}: ${payment.partial_amount} ${currency})`
      : '';

    return (
      <span>
        {full} {paid} {partial}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md">
      <ModalContent>
        <>
          <ModalHeader>
            {language === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}
          </ModalHeader>
          <ModalBody className="space-y-2 text-sm">
            <p>
              <strong>{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}:</strong>{' '}
              {payment.booking_id}
            </p>
            <p>
              <strong>{language === 'ar' ? 'المبلغ' : 'Amount'}:</strong>{' '}
              {renderAmount()}
            </p>
            <p>
              <strong>{language === 'ar' ? 'الحالة' : 'Status'}:</strong> {payment.status}
            </p>
            <p>
              <strong>{language === 'ar' ? 'وقت الدفع' : 'Payment Time'}:</strong>{' '}
              {moment(payment.created_at).format('DD MMM YYYY, hh:mm A')}
            </p>
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