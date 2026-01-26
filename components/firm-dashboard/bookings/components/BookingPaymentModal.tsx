'use client';

import {
  Alert,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';
import { BookingDB, PaymentData } from '../types/bookingTypes';
import { PAYMENT_METHOD_OPTIONS } from '../constants/bookingConstants';

interface BookingPaymentModalProps {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  paymentBooking: BookingDB | null;
  paymentData: PaymentData;
  setPaymentData: (data: PaymentData | ((prev: PaymentData) => PaymentData)) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const BookingPaymentModal = ({
  language,
  isOpen,
  onOpenChange,
  paymentBooking,
  paymentData,
  setPaymentData,
  onSubmit,
  onClose,
}: BookingPaymentModalProps) => {
  const calculatePaidAmount = () => {
    return (
      Number(paymentData.late_fee) +
      Number(paymentData.partial_amount > 0 ? paymentData.partial_amount : paymentData.amount)
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="lg">
      <ModalContent>
        {() => (
          <>
            <ModalHeader>{language === 'ar' ? 'الدفع' : 'Payment'}</ModalHeader>

            <ModalBody className="space-y-4">
              {paymentBooking && (
                <Alert
                  color="primary"
                  variant="flat"
                  title={language === 'ar' ? 'معلومات الحجز' : 'Booking Info'}
                  description={`${paymentBooking.customer_name} - ${paymentBooking.vehicle_name}`}
                />
              )}

              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                type="number"
                label={language === 'ar' ? 'رقم الحجز' : 'Booking Id'}
                value={paymentData.booking_id.toString()}
                isReadOnly
              />

              <Select
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200"
                label={language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                selectedKeys={[paymentData.payment_method]}
                onChange={(e) =>
                  setPaymentData((p) => ({
                    ...p,
                    payment_method: e.target.value as any,
                  }))
                }
              >
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <SelectItem key={method.key}>
                    {language === 'ar' ? method.labelAr : method.labelEn}
                  </SelectItem>
                ))}
              </Select>

              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                type="number"
                label={language === 'ar' ? 'المبلغ' : 'Amount'}
                value={paymentData.amount.toString()}
                isReadOnly
              />

              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                type="number"
                label={language === 'ar' ? 'دفعة جزئية' : 'Partial Amount'}
                value={paymentData.partial_amount.toString()}
                onChange={(e) =>
                  setPaymentData((p) => ({
                    ...p,
                    partial_amount: Number(e.target.value),
                    is_deposit: Number(e.target.value) > 0,
                  }))
                }
              />

              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                type="number"
                label={language === 'ar' ? 'غرامة تأخير' : 'Late Fee'}
                value={paymentData.late_fee.toString()}
                isReadOnly
              />

              <div className="text-lg font-bold">
                {language === 'ar' ? 'المبلغ المدفوع = ' : 'Paid Amount = '}
                {calculatePaidAmount()}
              </div>

              {(paymentData.payment_method === 'bank_transfer' ||
                paymentData.payment_method === 'online') && (
                <Input
                  className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  label={language === 'ar' ? 'تفاصيل إضافية' : 'Details'}
                  value={paymentData.split_details}
                  onChange={(e) =>
                    setPaymentData((p) => ({
                      ...p,
                      split_details: e.target.value,
                    }))
                  }
                />
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button color="success" onPress={onSubmit}>
                {language === 'ar' ? 'دفع' : 'Pay'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};