import { Chip, Tooltip } from '@heroui/react';

type StatusChipProps = {
  status: 'active' | 'deleted';
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
      : status;

  return (
    <Tooltip
      showArrow
      className="capitalize"
      color={status === 'active' ? 'success' : status === 'deleted' ? 'warning' : 'default'}
      content={statusText}
    >
      <Chip
        size="sm"
        color={status === 'active' ? 'success' : status === 'deleted' ? 'warning' : 'default'}
        variant="flat"
      />
    </Tooltip>
  );
};