import { Select, SelectItem, Alert } from '@heroui/react';

interface Props {
  language: string;
  isSuperAdmin: boolean;
  sessionLoaded: boolean;
  selectedTenantId: number | undefined;
  selectedBranchId: number | null;
  tenants: {id: number, name: string}[];
  branches: {id: number, name: string, name_ar:string}[];
  tenantsLoading: boolean;
  branchesLoading: boolean;
  branchesError: string | null;
  onTenantChange: (tenantId: number) => void;
  onBranchChange: (branchId: number) => void;
}

export const TenantBranchSelector = ({
  language,
  isSuperAdmin,
  sessionLoaded,
  selectedTenantId,
  selectedBranchId,
  tenants,
  branches,
  tenantsLoading,
  branchesLoading,
  branchesError,
  onTenantChange,
  onBranchChange,
}: Props) => {
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
          <SelectItem key={branch.id}>{branch.name}</SelectItem>
        ))}
      </Select>

      {branchesError && (
        <Alert
          title={language === 'ar' ? 'تحذير' : 'Warning'}
          description={branchesError}
          variant="flat"
          color="warning"
        />
      )}
    </>
  );
};