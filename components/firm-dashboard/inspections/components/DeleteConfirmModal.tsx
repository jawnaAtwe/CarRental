'use client';

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import type { DeleteTarget } from '../types';

interface DeleteConfirmModalProps {
  language: string;
  isOpen: boolean;
  deleteTarget: DeleteTarget | null;
  selectedCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  language,
  isOpen,
  deleteTarget,
  selectedCount,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          {deleteTarget?.type === 'bulk'
            ? language === 'ar' ? 'حذف متعدد' : 'Bulk Delete'
            : language === 'ar' ? 'حذف الفحص' : 'Delete Inspection'}
        </ModalHeader>

        <ModalBody>
          {deleteTarget?.type === 'bulk'
            ? language === 'ar'
              ? `هل أنت متأكد من حذف ${selectedCount} فحوصات؟`
              : `Are you sure you want to delete ${selectedCount} inspections?`
            : language === 'ar'
            ? 'هل أنت متأكد من حذف هذا الفحص؟'
            : 'Are you sure you want to delete this inspection?'}
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
}