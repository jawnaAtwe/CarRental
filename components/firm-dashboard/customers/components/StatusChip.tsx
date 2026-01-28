import { Chip, Tooltip } from '@heroui/react';
import { ShieldCheckIcon, NoSymbolIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { CustomerStatus } from '../hooks/types';

type StatusChipProps = {
  status: CustomerStatus;
  language: string;
};

export const StatusChip = ({ status, language }: StatusChipProps) => {
  const statusText =
    status === 'active'
      ? language === 'ar'
        ? 'نشط'
        : 'Active'
      : status === 'deleted'
      ? language === 'ar'
        ? 'محذوف'
        : 'Deleted'
      : status === 'blacklisted'
      ? language === 'ar'
        ? 'محظور'
        : 'Blacklisted'
      : status;

  return (
    <Tooltip showArrow content={statusText}>
      <Chip
        size="sm"
        color={status === 'active' ? 'success' : status === 'deleted' ? 'default' : 'danger'}
        variant="flat"
      >
        {status === 'active' ? (
          <ShieldCheckIcon className="h-4 w-4" />
        ) : status === 'deleted' ? (
          <NoSymbolIcon className="h-4 w-4" />
        ) : (
          <ShieldExclamationIcon className="h-4 w-4" />
        )}
      </Chip>
    </Tooltip>
  );
};