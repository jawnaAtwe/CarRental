import { Chip, Tooltip } from '@heroui/react';
import { InvoiceStatus } from '../../hooks/types/invoice.types'; // enum الجديد

type StatusChipProps = {
  status: InvoiceStatus;
  language: string;
};

export const StatusChip = ({ status, language }: StatusChipProps) => {
  // configuration لكل حالة
  const statusConfig: Record<InvoiceStatus, { text: string; color: 'default' | 'primary' | 'success' | 'danger' | 'warning' }> = {
    draft: {
      text: language === 'ar' ? 'مسودة' : 'Draft',
      color: 'default',
    },
    issued: {
      text: language === 'ar' ? 'صادرة' : 'Issued',
      color: 'primary',
    },
    partially_paid: {
      text: language === 'ar' ? 'مدفوعة جزئياً' : 'Partially Paid',
      color: 'warning',
    },
    paid: {
      text: language === 'ar' ? 'مدفوعة' : 'Paid',
      color: 'success',
    },
    cancelled: {
      text: language === 'ar' ? 'ملغاة' : 'Cancelled',
      color: 'danger',
    },
  };

  // fallback لأي قيمة غير متوقعة
  const config = statusConfig[status] ?? statusConfig.draft;

  return (
    <Tooltip showArrow className="capitalize" color={config.color} content={config.text}>
      <Chip size="sm" color={config.color} variant="flat">
        {config.text}
      </Chip>
    </Tooltip>
  );
};
