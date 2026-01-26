'use client';

import {
  Avatar,
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import moment from 'moment';
import { BookingDB } from '../types/bookingTypes';

interface BookingViewModalProps {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  activeBooking: BookingDB | null;
  onClose: () => void;
}

export const BookingViewModal = ({
  language,
  isOpen,
  onOpenChange,
  activeBooking,
  onClose,
}: BookingViewModalProps) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" backdrop="blur">
      <ModalContent className="bg-content1/95">
        {() =>
          activeBooking && (
            <>
              <ModalHeader className="flex items-center gap-3">
                <Avatar size="md" name={`${activeBooking.customer_name}`} src="" />
                <div>
                  <p className="text-lg font-semibold">{activeBooking.customer_name}</p>
                  <p className="text-sm text-foreground/60">
                    {language === 'ar'
                      ? activeBooking.branch_name_ar || '-'
                      : activeBooking.branch_name || '-'}
                  </p>
                </div>
              </ModalHeader>

              <ModalBody className="space-y-4">
                <Divider />

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'معلومات الحجز' : 'Booking Information'}
                  </p>
                  <p className="text-sm">
                    {language === 'ar' ? 'المركبة:' : 'Vehicle:'}{' '}
                    {activeBooking.vehicle_name || '-'}
                  </p>

                  <p className="text-sm">
                    {language === 'ar' ? 'الحالة:' : 'Status:'} {activeBooking.status}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                    </p>
                    <p className="text-sm">{activeBooking.start_date || '-'}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                    </p>
                    <p className="text-sm">{activeBooking.end_date || '-'}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'الإجمالي' : 'Total Amount'}
                    </p>
                    <p className="text-sm">{activeBooking.total_amount} ₪</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'تاريخ الإضافة' : 'Created At'}
                    </p>
                    <p className="text-sm">
                      {activeBooking.created_at
                        ? moment(activeBooking.created_at)
                            .locale(language)
                            .format('DD MMM YYYY, hh:mm A')
                        : '-'}
                    </p>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </ModalFooter>
            </>
          )
        }
      </ModalContent>
    </Modal>
  );
};