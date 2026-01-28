// ================= Page Header Component =================

'use client';

import { Button, Select, SelectItem } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { Tenant } from '../types/user.types';

interface PageHeaderProps {
  language: string;
  
  // Super Admin Tenant Selector
  isSuperAdmin: boolean;
  sessionLoaded: boolean;
  selectedTenantId?: number;
  setSelectedTenantId: (id: number) => void;
  tenants: Tenant[];
  tenantsLoading: boolean;
  
  // Actions
  selectedKeysCount: number;
  onBulkDelete: () => void;
  onCreateUser: () => void;
}

export const PageHeader = ({
  language,
  isSuperAdmin,
  sessionLoaded,
  selectedTenantId,
  setSelectedTenantId,
  tenants,
  tenantsLoading,
  selectedKeysCount,
  onBulkDelete,
  onCreateUser,
}: PageHeaderProps) => {
  return (
    <>
      {/* ======= Tenant Selector (Super Admin Only) ======= */}
      {isSuperAdmin && sessionLoaded && (
        <Select
          size="md"
          label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
          onChange={(e) => setSelectedTenantId(Number(e.target.value))}
          isLoading={tenantsLoading}
        >
          {tenants.map((t) => (
            <SelectItem key={t.id}>{t.name}</SelectItem>
          ))}
        </Select>
      )}

      {/* ======= Header & Action Buttons ======= */}
      <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em]">
            {language === 'ar' ? 'إدارة المستخدمين' : 'USER MANAGEMENT'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text">
            {language === 'ar' ? 'المستخدمون' : 'Users'}
          </h1>
        </div>

        <div className="flex gap-2">
          {/* Bulk Delete Button */}
          {selectedKeysCount > 0 && (
            <Button 
              variant="flat" 
              color="danger" 
              startContent={<TrashIcon className="h-4 w-4" />} 
              onPress={onBulkDelete}
            >
              {language === 'ar' ? `حذف (${selectedKeysCount})` : `Delete (${selectedKeysCount})`}
            </Button>
          )}

          {/* Create New User Button */}
          <Button
            variant="solid"
            color="primary"
            startContent={
              <PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />
            }
            onPress={onCreateUser}
            className="
              relative overflow-hidden
              text-white font-extrabold tracking-wide
              rounded-3xl
              px-6 py-3
              bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500
              shadow-xl
              transition-all duration-500
              transform hover:scale-110 hover:shadow-2xl
              before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full
              before:bg-white/30 before:rotate-12 before:transition-all before:duration-500
              hover:before:w-[200%]
            "
          >
            <span className="relative animate-gradient-text bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
              {language === 'ar' ? 'مستخدم جديد' : 'New User'}
            </span>
          </Button>
        </div>
      </section>
    </>
  );
};