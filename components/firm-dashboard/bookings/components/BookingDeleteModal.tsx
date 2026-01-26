'use client';

import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';

interface BookingDeleteModalProps {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  deleteTarget: { type: 'single' | 'bulk'; id?: number } | null;
  selectedKeysSize: number;
  submitError: string[] | string;
  onConfirm: () => void;
  onClose: () => void;
}

export const BookingDeleteModal = ({
  language,
  isOpen,
  onOpenChange,
  deleteTarget,
  selectedKeysSize,
  submitError,
  onConfirm,
  onClose,
}: BookingDeleteModalProps) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent className="bg-white dark:bg-gray-800 text-black dark:text-gray-200">
        {() => (
          <>
            <ModalHeader className="text-xl font-semibold text-danger">
              {deleteTarget?.type === 'bulk'
                ? language === 'ar'
                  ? 'حذف حجوزات متعددة'
                  : 'Bulk Delete Bookings'
                : language === 'ar'
                ? 'حذف الحجز'
                : 'Delete Booking'}
            </ModalHeader>

            <ModalBody>
              {submitError &&
                ((Array.isArray(submitError) && submitError.length > 0) ||
                  (typeof submitError === 'string' && submitError.trim() !== '')) && (
                  <Alert
                    title={language === 'ar' ? 'فشل الحذف' : 'Delete Failed'}
                    description={
                      <ul className="list-disc list-inside">
                        {Array.isArray(submitError)
                          ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
                          : <li>{submitError}</li>}
                      </ul>
                    }
                    variant="flat"
                    color="danger"
                    className="mb-4"
                  />
                )}

              <p className="text-foreground/80 text-md leading-relaxed">
                {deleteTarget?.type === 'bulk'
                  ? language === 'ar'
                    ? `هل أنت متأكد من حذف ${selectedKeysSize} حجوزات؟`
                    : `Are you sure you want to delete ${selectedKeysSize} bookings?`
                  : language === 'ar'
                  ? 'هل أنت متأكد أنك تريد حذف هذا الحجز؟'
                  : 'Are you sure you want to delete this booking?'}
              </p>
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button color="danger" onPress={onConfirm}>
                {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};