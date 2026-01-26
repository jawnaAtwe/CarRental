import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
}

export const DeletePlanModal = ({
  isOpen,
  onOpenChange,
  onConfirm,
}: Props) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalBody>Are you sure?</ModalBody>
        <ModalFooter>
          <Button color="danger" onPress={onConfirm}>Delete</Button>
          <Button variant="light" onPress={onOpenChange}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};