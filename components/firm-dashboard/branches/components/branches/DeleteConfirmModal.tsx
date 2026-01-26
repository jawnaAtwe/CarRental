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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}</ModalHeader>
        <ModalBody>
          {deleteType === 'single' ? (
            <p>{language === 'ar' ? 'هل أنت متأكد من حذف هذا الفرع؟' : 'Are you sure you want to delete this branch?'}</p>
          ) : (
            <p>
              {language === 'ar'
                ? `هل أنت متأكد من حذف ${selectedCount} فروع؟`
                : `Are you sure you want to delete ${selectedCount} branches?`}
            </p>
          )}
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