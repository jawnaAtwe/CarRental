import { Button, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import moment from 'moment';
import { StatusChip } from './StatusChip';
import { ContractTemplateDB } from '../../hooks/types/contract-template.types';

type ContractTemplateViewModalProps = {
  language: string;
  isOpen: boolean;
  template: ContractTemplateDB | null;
  onClose: () => void;
};

export const ContractTemplateViewModal = ({
  language,
  isOpen,
  template,
  onClose,
}: ContractTemplateViewModalProps) => {
  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent className="bg-white dark:bg-gray-800 text-black dark:text-gray-200">
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold">{language === 'ar' ? 'تفاصيل القالب' : 'Template Details'}</h3>
          <p className="text-sm text-gray-500">
            {template.name || (language === 'ar' ? 'قالب بدون عنوان' : 'Untitled Template')}
          </p>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {/* معلومات أساسية */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'اللغة' : 'Language'}</p>
              <p className="font-medium uppercase">{template.language}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</p>
              <StatusChip status={template.status} language={language} />
            </div>
          </div>

          <Divider />

          {/* محتوى العقد */}
          <div>
            <p className="text-sm text-gray-500 mb-3 font-semibold">
              {language === 'ar' ? 'محتوى العقد' : 'Contract Content'}
            </p>
            <div
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 max-h-[400px] overflow-y-auto"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {template.content}
            </div>
          </div>

          <Divider />

          {/* معلومات إضافية */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</p>
              <p className="font-medium">
                {template.created_at
                  ? moment(template.created_at).locale(language).format('DD MMM YYYY, hh:mm A')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">{language === 'ar' ? 'آخر تحديث' : 'Updated At'}</p>
              <p className="font-medium">
                {template.updated_at
                  ? moment(template.updated_at).locale(language).format('DD MMM YYYY, hh:mm A')
                  : '-'}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};