import { Chip, Tooltip } from '@heroui/react';
import { ContractTemplateStatus } from '../../hooks/types/contract-template.types';

type StatusChipProps = {
  status: ContractTemplateStatus;
  language: string;
};

export const StatusChip = ({ status, language }: StatusChipProps) => {
  const statusConfig = {
    active: {
      text: language === 'ar' ? 'نشط' : 'Active',
      color: 'success' as const,
    },
    inactive: {
      text: language === 'ar' ? 'غير نشط' : 'Inactive',
      color: 'warning' as const,
    },
    deleted: {
      text: language === 'ar' ? 'محذوف' : 'Deleted',
      color: 'danger' as const,
    },
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <Tooltip showArrow className="capitalize" color={config.color} content={config.text}>
      <Chip size="sm" color={config.color} variant="flat">
        {config.text}
      </Chip>
    </Tooltip>
  );
};