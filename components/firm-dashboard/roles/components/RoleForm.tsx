import { Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea, Button } from '@heroui/react';
import { RoleForm as RoleFormType, AvailablePermission } from '../hooks/types';
import { PermissionSelector } from './PermissionSelector';

type RoleFormProps = {
  language: string;
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  formData: RoleFormType;
  permissions: AvailablePermission[];
  permissionsLoading: boolean;
  submitError: string | string[];
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof RoleFormType, value: any) => void;
  onTogglePermission: (permissionId: number) => void;
  onToggleAllPermissions: () => void;
};

export const RoleForm = ({
  language,
  isOpen,
  isEditing,
  loading,
  formData,
  permissions,
  permissionsLoading,
  submitError,
  onClose,
  onSave,
  onChange,
  onTogglePermission,
  onToggleAllPermissions,
}: RoleFormProps) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="xl" scrollBehavior="inside" backdrop="blur">
      <ModalContent className="bg-content1/95">
        <ModalHeader className="text-xl font-semibold">
          {isEditing
            ? language === 'ar'
              ? 'تعديل الدور'
              : 'Edit Role'
            : language === 'ar'
            ? 'إنشاء دور جديد'
            : 'Create New Role'}
        </ModalHeader>
        <ModalBody className="space-y-4">
          {submitError &&
            ((Array.isArray(submitError) && submitError.length > 0) ||
              (typeof submitError === 'string' && submitError.trim() !== '')) && (
              <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
                {Array.isArray(submitError) ? submitError.join(', ') : submitError}
              </div>
            )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label={language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                isRequired
              />
              <Input
                label={language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}
                value={formData.name_ar || ''}
                onChange={(e) => onChange('name_ar', e.target.value)}
              />
            </div>
            <Input
              label={language === 'ar' ? 'المعرف (Slug)' : 'Slug'}
              value={formData.slug}
              onChange={(e) => onChange('slug', e.target.value)}
              isRequired
            />
            <Textarea
              label={language === 'ar' ? 'الوصف' : 'Description'}
              value={formData.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
            />

            <PermissionSelector
              language={language}
              permissions={permissions}
              selectedPermissions={formData.permissions}
              loading={permissionsLoading}
              onToggle={onTogglePermission}
              onToggleAll={onToggleAllPermissions}
            />
          </div>
        </ModalBody>
        <ModalFooter className="justify-end gap-2">
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button color="primary" onPress={onSave} isLoading={loading}>
            {language === 'ar' ? (isEditing ? 'تحديث' : 'حفظ') : isEditing ? 'Update' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};