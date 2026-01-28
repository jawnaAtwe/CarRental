import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

type DeleteConfirmModalProps = {
  language: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteConfirmModal = ({ language, isOpen, onClose, onConfirm }: DeleteConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} backdrop="blur">
      <ModalContent className="bg-content1/95">
        <ModalHeader className="text-xl font-semibold text-danger">
          {language === 'ar' ? 'إلغاء العقد' : 'Cancel Contract'}
        </ModalHeader>
        <ModalBody>
          <p className="text-foreground/80 text-md leading-relaxed">
            {language === 'ar'
              ? 'هل أنت متأكد أنك تريد إلغاء هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.'
              : 'Are you sure you want to cancel this contract? This action cannot be undone.'}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button color="danger" onPress={onConfirm}>
            {language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancellation'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};