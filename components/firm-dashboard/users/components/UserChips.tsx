// ================= User UI Components =================

import { Chip, Tooltip } from '@heroui/react';
import { 
  ShieldCheckIcon, 
  NoSymbolIcon, 
  ShieldExclamationIcon 
} from '@heroicons/react/24/solid';
import { UserDB, Role } from '../types/user.types';

interface StatusChipProps {
  status: UserDB['status'];
  language: string;
}

export const StatusChip = ({ status, language }: StatusChipProps) => {
  const statusText = 
    status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
    status === 'disabled' ? (language === 'ar' ? 'معطل' : 'Disabled') :
    status === 'pending_verification' ? (language === 'ar' ? 'في انتظار التحقق' : 'Pending Verification') :
    status === 'pending_approval' ? (language === 'ar' ? 'في انتظار الموافقة' : 'Pending Approval') :
    status === 'deleted' ? (language === 'ar' ? 'محذوف' : 'Deleted') : status;

  return (
    <Tooltip 
      showArrow 
      className="capitalize" 
      color={status === 'active' ? 'success' : status === 'pending_verification' ? 'warning' : 'default'} 
      content={statusText}
    >
      <Chip
        size="sm"
        color={status === 'active' ? 'success' : status === 'pending_verification' ? 'warning' : 'default'}
        variant="flat"
      >
        {status === 'active' ?
          <ShieldCheckIcon className="h-4 w-4" />
          : status === 'disabled' ?
            <NoSymbolIcon className="h-4 w-4" />
            : <ShieldExclamationIcon className="h-4 w-4" />
        }
      </Chip>
    </Tooltip>
  );
};

interface RoleChipProps {
  roleId?: number | null;
  roles: Role[];
  language: string;
}

export const RoleChip = ({ roleId, roles, language }: RoleChipProps) => {
  if (!roleId) {
    return <Chip size="sm" variant="flat" color="default">-</Chip>;
  }

  if (roles.length === 0) {
    return (
      <Chip size="sm" variant="flat" color="warning">
        ID: {roleId}
      </Chip>
    );
  }

  const role = roles.find((r) => Number(r.id) === Number(roleId));

  if (!role) {
    return (
      <Chip size="sm" variant="flat" color="warning">
        ID: {roleId}
      </Chip>
    );
  }

  return (
    <Chip size="sm" color="primary" variant="solid">
      {language === 'ar' ? (role.name_ar || role.name) : role.name}
    </Chip>
  );
};