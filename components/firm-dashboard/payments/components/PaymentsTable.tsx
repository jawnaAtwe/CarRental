// components/PaymentsTable.tsx

import {
  Button,
  Table,
  Select,
  SelectItem,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import moment from 'moment';
import { Payment, PaymentStatus } from '../types/paymentTypes';
import { PAYMENT_STATUSES } from '../constants/paymentConstants';

interface PaymentsTableProps {
  language: string;
  payments: Payment[];
  currencies: Record<number, string>;
  updatingStatus: number | null;
  onViewPayment: (payment: Payment) => void;
  onViewBooking: (bookingId: number) => void;
  onUpdateStatus: (paymentId: number, status: PaymentStatus) => void;
}

export const PaymentsTable = ({
  language,
  payments,
  currencies,
  updatingStatus,
  onViewPayment,
  onViewBooking,
  onUpdateStatus,
}: PaymentsTableProps) => {
  const renderAmount = (payment: Payment) => {
    const currency = currencies[payment.booking_id] || '';

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
    <Table aria-label="Payments Table" classNames={{ table: 'min-w-full text-base' }}>
      <TableHeader>
        <TableColumn>{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'الحالة' : 'Status'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'وقت الدفع' : 'Payment Time'}</TableColumn>
        <TableColumn className="text-end">
          {language === 'ar' ? 'الإجراءات' : 'Actions'}
        </TableColumn>
      </TableHeader>

      <TableBody
        emptyContent={language === 'ar' ? 'لا توجد مدفوعات' : 'No payments found'}
      >
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{payment.booking_id}</TableCell>
            <TableCell>{renderAmount(payment)}</TableCell>
            <TableCell>
              <Select
                size="sm"
                selectedKeys={[payment.status]}
                isDisabled={updatingStatus === payment.id}
                onChange={(e) =>
                  onUpdateStatus(payment.id, e.target.value as PaymentStatus)
                }
                className="min-w-[150px]"
              >
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status}>{status}</SelectItem>
                ))}
              </Select>
            </TableCell>
            <TableCell>
              {moment(payment.created_at).format('DD MMM YYYY, hh:mm A')}
            </TableCell>
            <TableCell className="flex justify-end gap-2">
              <Button
                isIconOnly
                variant="flat"
                color="default"
                onPress={() => onViewPayment(payment)}
              >
                <InformationCircleIcon className="h-5 w-5" />
              </Button>
              <Button
                isIconOnly
                variant="flat"
                color="primary"
                onPress={() => onViewBooking(payment.booking_id)}
              >
                <InformationCircleIcon className="h-5 w-5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};