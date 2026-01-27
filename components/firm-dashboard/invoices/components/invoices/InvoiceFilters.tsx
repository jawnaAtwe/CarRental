import { Select, SelectItem } from '@heroui/react';

type InvoiceFiltersProps = {
  language: string;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
};

export const InvoiceFilters = ({
  language,
  statusFilter,
  setStatusFilter,
}: InvoiceFiltersProps) => {
  const statusOptions = [
    { value: 'all', label: language === 'ar' ? 'الكل' : 'All' },
    { value: 'draft', label: language === 'ar' ? 'مسودة' : 'Draft' },
    { value: 'issued', label: language === 'ar' ? 'صادرة' : 'Issued' },
    { value: 'paid', label: language === 'ar' ? 'مدفوعة' : 'Paid' },
    { value: 'overdue', label: language === 'ar' ? 'متأخرة' : 'Overdue' },
  ];

  return (
    <Select
      size="sm"
      label={language === 'ar' ? 'الحالة' : 'Status'}
      placeholder={language === 'ar' ? 'اختر الحالة' : 'Select Status'}
      selectedKeys={[statusFilter]}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="min-w-[180px]"
    >
      {statusOptions.map((option) => (
        <SelectItem key={option.value}>{option.label}</SelectItem>
      ))}
    </Select>
  );
};