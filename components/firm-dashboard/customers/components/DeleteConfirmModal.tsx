import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

type DeleteConfirmModalProps = {
  language: string;
  isOpen: boolean;
  deleteType: 'single' | 'bulk' | null;
  selectedCount?: number;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteConfirmModal = ({
  language,
  isOpen,
  deleteType,
  selectedCount,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) => {
  return (
    <Modal isDismissable={false} isOpen={isOpen} onOpenChange={onClose} size="md" backdrop="blur">
      <ModalContent className="bg-content1-light/95 dark:bg-content1-dark/95 transition-colors duration-300">
        <ModalHeader className="relative overflow-hidden px-6 py-5 flex items-center gap-3 border-b border-divider">
          {deleteType === 'bulk'
            ? language === 'ar'
              ? 'حذف متعدد'
              : 'Bulk Delete'
            : language === 'ar'
            ? 'حذف المستخدم'
            : 'Delete User'}
        </ModalHeader>
        <ModalBody>
          <p className="text-foreground/80 text-md leading-relaxed">
            {deleteType === 'bulk'
              ? language === 'ar'
                ? `هل أنت متأكد من حذف ${selectedCount} مستخدم؟`
                : `Are you sure you want to delete ${selectedCount} users?`
              : language === 'ar'
              ? 'هل أنت متأكد أنك تريد حذف هذا المستخدم؟'
              : 'Are you sure you want to delete this user?'}
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
      </ModalContent>
    </Modal>
  );
};