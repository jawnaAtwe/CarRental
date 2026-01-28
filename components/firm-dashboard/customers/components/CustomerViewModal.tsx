import { Button, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { CustomerDB } from '../hooks/types';

type CustomerViewModalProps = {
  language: string;
  isOpen: boolean;
  customer: CustomerDB | null;
  onClose: () => void;
};

export const CustomerViewModal = ({ language, isOpen, customer, onClose }: CustomerViewModalProps) => {
  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="xl" backdrop="blur">
      <ModalContent className="bg-content1/95">
        <ModalHeader className="flex items-center gap-4">
          <div className="flex flex-col">
            <p className="text-xl font-semibold">{customer.full_name}</p>
            <p className="text-sm text-foreground/60">
              {language === 'ar' ? 'نوع العميل:' : 'Customer Type:'}{' '}
              <span className="font-medium">
                {customer.customer_type === 'individual'
                  ? language === 'ar'
                    ? 'فرد'
                    : 'Individual'
                  : language === 'ar'
                  ? 'شركة'
                  : 'Corporate'}
              </span>
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-6">
          <Divider />

          {/* Contact Info */}
          <section>
            <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <strong>Email:</strong> {customer.email || '-'}
              </p>
              <p>
                <strong>Phone:</strong> {customer.phone || '-'}
              </p>
              <p>
                <strong>WhatsApp:</strong> {(customer as any).whatsapp || '-'}
              </p>
              <p>
                <strong>Language:</strong> {(customer as any).preferred_language || '-'}
              </p>
            </div>
          </section>

          <Divider />

          {/* Personal Info */}
          <section>
            <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <strong>{language === 'ar' ? 'الجنسية' : 'Nationality'}:</strong>{' '}
                {(customer as any).nationality || '-'}
              </p>
              <p>
                <strong>{language === 'ar' ? 'الجنس' : 'Gender'}:</strong> {(customer as any).gender || '-'}
              </p>
              <p>
                <strong>{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}:</strong>{' '}
                {customer.date_of_birth ? (customer.date_of_birth as string).split('T')[0] : '-'}
              </p>
            </div>
          </section>

          <Divider />

          {/* Identity */}
          <section>
            <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              {language === 'ar' ? 'بيانات الهوية' : 'Identity'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <strong>ID Type:</strong> {(customer as any).id_type || '-'}
              </p>
              <p>
                <strong>ID Number:</strong> {(customer as any).id_number || '-'}
              </p>
            </div>
          </section>

          <Divider />

          {/* Driving License */}
          <section>
            <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              {language === 'ar' ? 'رخصة القيادة' : 'Driving License'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <strong>{language === 'ar' ? 'رقم الرخصة' : 'License Number'}:</strong>{' '}
                {(customer as any).driving_license_number || '-'}
              </p>
              <p>
                <strong>{language === 'ar' ? 'الدولة' : 'Country'}:</strong>{' '}
                {(customer as any).license_country || '-'}
              </p>
              <p>
                <strong>{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}:</strong>{' '}
                {customer.license_expiry_date ? (customer.license_expiry_date as string).split('T')[0] : '-'}
              </p>
            </div>
          </section>

          <Divider />

          {/* Address */}
          <section>
            <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              {language === 'ar' ? 'العنوان' : 'Address'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <strong>{language === 'ar' ? 'المدينة' : 'City'}:</strong> {(customer as any).city || '-'}
              </p>
              <p>
                <strong>{language === 'ar' ? 'الدولة' : 'Country'}:</strong> {(customer as any).country || '-'}
              </p>
              <p className="col-span-2">
                <strong>{language === 'ar' ? 'العنوان الكامل' : 'Address'}:</strong>{' '}
                {(customer as any).address || '-'}
              </p>
            </div>
          </section>

          <Divider />

          {/* System Info */}
          <section>
            <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              {language === 'ar' ? 'معلومات النظام' : 'System Info'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <strong>Status:</strong> {customer.status}
              </p>
              <p>
                <strong>Created At:</strong> {customer.created_at || '-'}
              </p>
            </div>
          </section>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};