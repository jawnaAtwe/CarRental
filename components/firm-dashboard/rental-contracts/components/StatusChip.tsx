import { Chip, Tooltip } from '@heroui/react';
import { ContractStatus } from '../hooks/types';

type StatusChipProps = {
  status: ContractStatus;
  language: string;
};

export const StatusChip = ({ status, language }: StatusChipProps) => {
  const statusConfig = {
    draft: {
      text: language === 'ar' ? 'مسودة' : 'Draft',
      color: 'default' as const,
    },
    signed: {
      text: language === 'ar' ? 'موقّع' : 'Signed',
      color: 'success' as const,
    },
    cancelled: {
      text: language === 'ar' ? 'ملغي' : 'Cancelled',
      color: 'danger' as const,
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Tooltip showArrow className="capitalize" color={config.color} content={config.text}>
      <Chip size="sm" color={config.color} variant="flat">
        {config.text}
      </Chip>
    </Tooltip>
  );
};