import { Button, Chip, Divider } from '@heroui/react';
import { AvailablePermission } from '../hooks/types';

type PermissionSelectorProps = {
  language: string;
  permissions: AvailablePermission[];
  selectedPermissions: number[];
  loading: boolean;
  onToggle: (permissionId: number) => void;
  onToggleAll: () => void;
};

export const PermissionSelector = ({
  language,
  permissions,
  selectedPermissions,
  loading,
  onToggle,
  onToggleAll,
}: PermissionSelectorProps) => {
  return (
    <div>
      <Divider className="my-2" />

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">
          {language === 'ar' ? 'الصلاحيات' : 'Permissions'} ({selectedPermissions.length}/{permissions.length})
        </p>
        <Button size="sm" variant="flat" onPress={onToggleAll}>
          {selectedPermissions.length === permissions.length
            ? language === 'ar'
              ? 'إلغاء الكل'
              : 'Deselect All'
            : language === 'ar'
            ? 'تحديد الكل'
            : 'Select All'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-content2 rounded-lg">
        {loading ? (
          <span className="text-sm text-foreground/60">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </span>
        ) : permissions.length === 0 ? (
          <span className="text-sm text-foreground/60">
            {language === 'ar' ? 'لا توجد صلاحيات متاحة' : 'No permissions available'}
          </span>
        ) : (
          permissions.map((perm) => (
            <Chip
              key={perm.id}
              size="sm"
              variant="flat"
              color={selectedPermissions.includes(perm.id) ? 'primary' : 'default'}
              className="cursor-pointer"
              onClick={() => onToggle(perm.id)}
            >
              {language === 'ar' ? perm.name_ar || perm.name : perm.name}
            </Chip>
          ))
        )}
      </div>
    </div>
  );
};