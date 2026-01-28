import { Button, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import moment from 'moment';
import { StatusChip } from './StatusChip';
import { RentalContractDB } from '../hooks/types';
import { DocumentTextIcon } from '@heroicons/react/24/solid';

type RentalContractViewModalProps = {
  language: string;
  isOpen: boolean;
  contract: RentalContractDB | null;
  onClose: () => void;
};

export const RentalContractViewModal = ({
  language,
  isOpen,
  contract,
  onClose,
}: RentalContractViewModalProps) => {
  if (!contract) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" backdrop="blur">
      <ModalContent className="bg-white dark:bg-gray-800 text-black dark:text-gray-200">
        <ModalHeader className="flex gap-2 items-center">
          <DocumentTextIcon className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold">{language === 'ar' ? 'تفاصيل العقد' : 'Contract Details'}</h3>
            <p className="text-sm text-gray-500">{contract.contract_number || `#${contract.id}`}</p>
          </div>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {/* معلومات أساسية */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</p>
              <StatusChip status={contract.status} language={language} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}</p>
              <p className="font-medium">#{contract.booking_id}</p>
            </div>
          </div>

          <Divider />

          {/* معلومات العميل والمركبة */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'رقم العميل' : 'Customer ID'}</p>
              <p className="font-medium">#{contract.customer_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'رقم المركبة' : 'Vehicle ID'}</p>
              <p className="font-medium">#{contract.vehicle_id}</p>
            </div>
          </div>

          <Divider />

          {/* معلومات القالب */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'رقم القالب' : 'Template ID'}</p>
              <p className="font-medium">#{contract.template_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'ملف PDF' : 'PDF File'}</p>
         {contract.pdf_path ? (
  <a
    href={contract.pdf_path}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary hover:underline"
  >
    {language === 'ar' ? 'عرض الملف' : 'View File'}
  </a>
) : (
  <p className="text-gray-500">-</p>
)}

            </div>
          </div>

          <Divider />

          {/* معلومات إضافية */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</p>
              <p className="font-medium">
                {contract.created_at
                  ? moment(contract.created_at).locale(language).format('DD MMM YYYY, hh:mm A')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">{language === 'ar' ? 'المعرف' : 'ID'}</p>
              <p className="font-medium">#{contract.id}</p>
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
  )
};