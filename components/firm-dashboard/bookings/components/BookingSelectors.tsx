'use client';

import { Select, SelectItem } from '@heroui/react';
import { Branch, Tenant } from '../types/bookingTypes';

interface BookingSelectorsProps {
  language: string;
  isSuperAdmin: boolean;
  sessionLoaded: boolean;
  selectedTenantId?: number;
  selectedBranchId: number | null;
  tenants: Tenant[];
  branches: Branch[];
  tenantsLoading: boolean;
  branchesLoading: boolean;
  onTenantChange: (tenantId: number) => void;
  onBranchChange: (branchId: number) => void;
}

export const BookingSelectors = ({
  language,
  isSuperAdmin,
  sessionLoaded,
  selectedTenantId,
  selectedBranchId,
  tenants,
  branches,
  tenantsLoading,
  branchesLoading,
  onTenantChange,
  onBranchChange,
}: BookingSelectorsProps) => {
  return (
    <>
      {isSuperAdmin && sessionLoaded && (
        <Select
          size="md"
          label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
          onChange={(e) => onTenantChange(Number(e.target.value))}
          isLoading={tenantsLoading}
        >
          {tenants.map((t) => (
            <SelectItem key={t.id}>{t.name}</SelectItem>
          ))}
        </Select>
      )}

      <Select
        label={language === 'ar' ? 'اختر الفرع' : 'Select Branch'}
        placeholder={
          !selectedTenantId
            ? language === 'ar'
              ? 'اختر الشركة أولاً'
              : 'Select tenant first'
            : language === 'ar'
            ? 'اختر الفرع'
            : 'Select branch'
        }
        selectedKeys={selectedBranchId ? [String(selectedBranchId)] : []}
        onChange={(e) => onBranchChange(Number(e.target.value))}
        isDisabled={!selectedTenantId || branchesLoading || branches.length === 0}
        isLoading={branchesLoading}
        isRequired
      >
        {branches.map((branch) => (
          <SelectItem key={branch.id}>
            {language === 'ar' ? branch.name_ar : branch.name}
          </SelectItem>
        ))}
      </Select>
    </>
  );
};