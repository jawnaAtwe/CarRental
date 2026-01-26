import { Input, Select, SelectItem } from '@heroui/react';
import { MagnifyingGlassIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { VehicleDB } from '../types';

interface Props {
  language: string;
  search: string;
  statusFilter: VehicleDB['status'] | 'all';
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: VehicleDB['status'] | 'all') => void;
}

export const FiltersSection = ({
  language,
  search,
  statusFilter,
  totalCount,
  onSearchChange,
  onStatusChange,
}: Props) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />}
          placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
          variant="faded"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-w-[240px] transition-all duration-200 focus:shadow-md focus:border-primary"
        />

        <Select
          startContent={<CheckBadgeIcon className="h-5 w-5 text-foreground/50" />}
          variant="faded"
          placeholder={language === 'ar' ? 'الحالة' : 'Status'}
          className="min-w-[160px] transition-all duration-200 focus:shadow-md focus:border-primary"
          selectedKeys={[statusFilter]}
          onChange={(e) => onStatusChange(e.target.value as any)}
        >
          <SelectItem key="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
          <SelectItem key="available">{language === 'ar' ? 'متاحة' : 'Available'}</SelectItem>
          <SelectItem key="maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</SelectItem>
          <SelectItem key="rented">{language === 'ar' ? 'مستأجرة' : 'Rented'}</SelectItem>
        </Select>
      </div>

      <span className="text-sm text-foreground/60">
        {language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}
      </span>
    </div>
  );
};