import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Alert,
} from '@heroui/react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { Subscription } from '../types';

interface Props {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  currentSubscription: Subscription[];
  isSuperAdmin: boolean;
  onToggleAutoRenew: (sub: Subscription) => void;
  onDelete: (sub: Subscription) => void;
}

export const ViewSubscriptionModal = ({
  language,
  isOpen,
  onOpenChange,
  currentSubscription,
  isSuperAdmin,
  onToggleAutoRenew,
  onDelete,
}: Props) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        <ModalHeader>
          {language === 'ar' ? 'تفاصيل الاشتراك' : 'Subscription Details'}
        </ModalHeader>
        {currentSubscription.length > 0 && !isSuperAdmin && (
          <div className="flex justify-center mt-2">
            <Button
              color="danger"
              size="sm"
              onPress={() => onDelete(currentSubscription[0])}
            >
              <TrashIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
        <ModalBody>
          {currentSubscription.length > 0 ? (
            <div className="space-y-3 text-sm">
              {currentSubscription.map((sub, index) => (
                <div
                  key={index}
                  className="p-2 border rounded bg-gray-50 dark:bg-gray-800"
                >
                  <p>
                    <strong>{language === 'ar' ? 'الخطة:' : 'Plan ID:'}</strong>{' '}
                    {sub.plan_id}
                  </p>
                  <p>
                    <strong>{language === 'ar' ? 'اسم الشركة :' : 'Tenant name:'}</strong>{' '}
                    {sub.tenant_id}
                  </p>
                  <p>
                    <strong>{language === 'ar' ? 'تاريخ البداية:' : 'Start Date:'}</strong>{' '}
                    {sub.start_date}
                  </p>
                  <p>
                    <strong>{language === 'ar' ? 'تاريخ النهاية:' : 'End Date:'}</strong>{' '}
                    {sub.end_date}
                  </p>
                  <p>
                    <strong>{language === 'ar' ? 'الحالة:' : 'Status:'}</strong>{' '}
                    {sub.status}
                  </p>
                  <p>
                    <strong>{language === 'ar' ? 'تجديد تلقائي:' : 'Auto Renew:'}</strong>{' '}
                    {sub.auto_renew ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}
                  </p>

                  <Button
                    size="sm"
                    variant="flat"
                    color={sub.auto_renew ? 'success' : 'warning'}
                    onPress={() => onToggleAutoRenew(sub)}
                  >
                    {sub.auto_renew
                      ? (language === 'ar' ? 'إيقاف التجديد التلقائي' : 'Disable Auto Renew')
                      : (language === 'ar' ? 'تفعيل التجديد التلقائي' : 'Enable Auto Renew')}
                  </Button>

                  {isSuperAdmin && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => onDelete(sub)}
                    >
                      {language === 'ar' ? 'حذف الاشتراك' : 'Delete Subscription'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Alert
              color="warning"
              title={language === 'ar' ? 'لا يوجد اشتراك لهذه الخطة' : 'No subscription for this plan'}
            />
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onOpenChange}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};