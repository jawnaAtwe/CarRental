import { Modal, ModalContent, ModalHeader, ModalBody, Alert } from '@heroui/react';

interface Props {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  deleteTarget: { type: 'single' | 'bulk'; id?: number } | null;
  selectedKeysSize: number;
  submitError: string[] | string;
  isEditing: boolean;
}

export const DeleteModal = ({
  language,
  isOpen,
  onOpenChange,
  deleteTarget,
  selectedKeysSize,
  submitError,
  isEditing,
}: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
    >
      <ModalContent className="bg-content1/95">
        {(onClose) => (
          <>
            <ModalHeader className="text-xl font-semibold text-danger">
              {deleteTarget?.type === 'bulk'
                ? (language === 'ar' ? 'حذف مركبات متعددة' : 'Bulk Delete Vehicles')
                : (language === 'ar' ? 'حذف المركبة' : 'Delete Vehicle')
              }
            </ModalHeader>

            <ModalBody>
              {submitError &&
                ((Array.isArray(submitError) && submitError.length > 0) ||
                  (typeof submitError === 'string' && submitError.trim() !== '')) && (
                  <Alert
                    title={isEditing 
                      ? (language === 'ar' ? 'فشل الحفظ' : 'Save Failed')
                      : (language === 'ar' ? 'فشل الإنشاء' : 'Create Failed')
                    }
                    description={
                      <ul className="list-disc list-inside">
                        {Array.isArray(submitError)
                          ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
                          : <p>{submitError}</p>}
                      </ul>
                    }
                    variant="flat"
                    color="danger"
                    className="mb-4"
                  />
                )}
              
              <p className="text-foreground/80 text-md leading-relaxed">
                {deleteTarget?.type === 'bulk'
                  ? (language === 'ar'
                      ? `هل أنت متأكد من حذف ${selectedKeysSize} مركبات؟`
                      : `Are you sure you want to delete ${selectedKeysSize} vehicles?`)
                  : (language === 'ar'
                      ? 'هل أنت متأكد أنك تريد حذف هذه المركبة؟'
                      : 'Are you sure you want to delete this vehicle?')
                }
              </p>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};