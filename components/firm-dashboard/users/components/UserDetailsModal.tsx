// ================= User Details Modal =================

'use client';

import {
  Avatar,
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import moment from 'moment';
import { UserDB, Role } from '../types/user.types';
import { StatusChip, RoleChip } from './UserChips';

interface UserDetailsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  user: UserDB | null;
  roles: Role[];
  language: string;
}

export const UserDetailsModal = ({
  isOpen,
  onOpenChange,
  user,
  roles,
  language,
}: UserDetailsModalProps) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" backdrop="blur">
      <ModalContent className="bg-content1/95">
        {() =>
          user && (
            <>
              <ModalHeader className="flex items-center gap-3">
                <Avatar size="md" name={user.full_name} src={''} />
                <div>
                  <p className="text-lg font-semibold">
                    {language === 'ar' ? user.full_name_ar || user.full_name : user.full_name}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Divider />
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                  </p>
                  <p className="text-sm">{user.email || '-'}</p>
                  <p className="text-sm">{user.phone || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                    </p>
                    <p className="text-sm">
                      <RoleChip roleId={user.role_id} roles={roles} language={language} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'الحالة' : 'Status'}
                    </p>
                    <p className="text-sm">
                      <StatusChip status={user.status} language={language} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                    </p>
                    <p className="text-sm">
                      {user.created_at ? moment(user.created_at).locale(language).format('DD MMM YYYY, hh:mm A') : '-'}
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onOpenChange}>
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </ModalFooter>
            </>
          )
        }
      </ModalContent>
    </Modal>
  );
};