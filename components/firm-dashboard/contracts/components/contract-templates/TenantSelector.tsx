import { Select, SelectItem } from '@heroui/react';
import { Tenant } from '../../hooks/types/contract-template.types';

type TenantSelectorProps = {
  language: string;
  selectedTenantId: number | undefined;
  tenants: Tenant[];
  loading: boolean;
  onChange: (tenantId: number) => void;
};

export const TenantSelector = ({ language, selectedTenantId, tenants, loading, onChange }: TenantSelectorProps) => {
  return (
    <Select
      size="md"
      label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
      placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
      selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
      onChange={(e) => onChange(Number(e.target.value))}
      isLoading={loading}
    >
      {tenants.map((t) => (
        <SelectItem key={t.id}>{t.name}</SelectItem>
      ))}
    </Select>
  );
};