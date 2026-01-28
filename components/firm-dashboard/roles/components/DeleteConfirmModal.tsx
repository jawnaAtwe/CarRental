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
    <Modal isOpen={isOpen} onOpenChange={onClose} backdrop="blur">
      <ModalContent className="bg-content1/95">
        <ModalHeader className="text-xl font-semibold text-danger">
          {deleteType === 'bulk'
            ? language === 'ar'
              ? 'حذف جماعي'
              : 'Bulk Delete'
            : language === 'ar'
            ? 'حذف الدور'
            : 'Delete Role'}
        </ModalHeader>
        <ModalBody>
          <p className="text-foreground/80 text-md leading-relaxed">
            {deleteType === 'bulk'
              ? language === 'ar'
                ? `هل أنت متأكد من حذف ${selectedCount} دور؟`
                : `Are you sure you want to delete ${selectedCount} roles?`
              : language === 'ar'
              ? 'هل أنت متأكد أنك تريد حذف هذا الدور؟'
              : 'Are you sure you want to delete this role?'}
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