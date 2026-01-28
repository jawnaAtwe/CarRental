// ================= Delete Confirmation Modal =================

'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
  deleteTarget: { type: 'single' | 'bulk'; id?: number } | null;
  selectedCount: number;
  language: string;
}

export const DeleteConfirmationModal = ({
  isOpen,
  onOpenChange,
  onConfirm,
  deleteTarget,
  selectedCount,
  language,
}: DeleteConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent className="bg-white dark:bg-gray-800/95 transition-colors duration-300">
        {(onClose) => (
          <>
            <ModalHeader className="text-xl font-semibold text-danger">
              {deleteTarget?.type === 'bulk' 
                ? (language === 'ar' ? 'حذف متعدد' : 'Bulk Delete')
                : (language === 'ar' ? 'حذف المستخدم' : 'Delete User')
              }
            </ModalHeader>
            <ModalBody>
              <p className="text-foreground/80 text-md leading-relaxed">
                {deleteTarget?.type === 'bulk'
                  ? (language === 'ar' 
                      ? `هل أنت متأكد من حذف ${selectedCount} مستخدم؟`
                      : `Are you sure you want to delete ${selectedCount} users?`)
                  : (language === 'ar' 
                      ? 'هل أنت متأكد أنك تريد حذف هذا المستخدم؟'
                      : 'Are you sure you want to delete this user?')
                }
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