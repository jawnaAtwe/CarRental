import { Avatar, Button, Chip, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import moment from 'moment';
import { UserGroupIcon, TagIcon } from '@heroicons/react/24/solid';
import { RoleDB } from '../hooks/types';

type RoleViewModalProps = {
  language: string;
  isOpen: boolean;
  role: RoleDB | null;
  onClose: () => void;
};

export const RoleViewModal = ({ language, isOpen, role, onClose }: RoleViewModalProps) => {
  if (!role) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="lg" backdrop="blur">
      <ModalContent className="bg-white dark:bg-gray-800/95 transition-colors duration-300">
        <ModalHeader className="flex items-center gap-3">
          <Avatar icon={<UserGroupIcon className="h-6 w-6" />} size="md" />
          <div>
            <p className="text-lg font-semibold">{language === 'ar' ? role.name_ar || role.name : role.name}</p>
            <p className="text-gray-700 dark:text-gray-300 transition-colors duration-300 flex items-center gap-1">
              <TagIcon className="h-3 w-3" />
              {role.slug}
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Divider />
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/60">
              {language === 'ar' ? 'الوصف' : 'Description'}
            </p>
            <p className="text-sm">{role.description || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/60">
              {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
            </p>
            <p className="text-sm">{moment(role.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              {language === 'ar' ? 'الصلاحيات' : 'Permissions'} ({role.permissions?.length || 0})
            </p>
            <div className="flex flex-wrap gap-2">
              {role.permissions && role.permissions.length > 0 ? (
                role.permissions.map((perm) => (
                  <Chip key={perm.permission_id} size="sm" color="secondary" variant="flat">
                    {language === 'ar' ? perm.name_ar || perm.name : perm.name}
                  </Chip>
                ))
              ) : (
                <span className="text-sm text-foreground/50">
                  {language === 'ar' ? 'لا توجد صلاحيات' : 'No permissions'}
                </span>
              )}
            </div>
          </div>
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