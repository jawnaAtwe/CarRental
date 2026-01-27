import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

type DeleteConfirmModalProps = {
  language: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteConfirmModal = ({ language, isOpen, onClose, onConfirm }: DeleteConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}</ModalHeader>
        <ModalBody>
          <p>
            {language === 'ar'
              ? 'هل أنت متأكد من حذف هذا القالب؟'
              : 'Are you sure you want to delete this template?'}
          </p>
          <p className="text-sm text-warning mt-2">
            {language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
          </p>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-3">
          <Button variant="flat" onPress={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="solid" color="danger" onPress={onConfirm}>
            {language === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};