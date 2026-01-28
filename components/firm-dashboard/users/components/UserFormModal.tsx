// ================= User Form Modal =================

'use client';

import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';

import {
  UserIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';

import { UserForm, Role } from '../types/user.types';

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  isEditing: boolean;
  formData: UserForm;
  setFormData: React.Dispatch<React.SetStateAction<UserForm>>;
  onSubmit: () => void;
  onCancel: () => void;
  roles: Role[];
  rolesError: string | null;
  rolesLoading: boolean;
  submitError: string[] | string;
  loadingForm: boolean;
  language: string;
  onReloadRoles: () => void;
}

export const UserFormModal = ({
  isOpen,
  onOpenChange,
  isEditing,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  roles,
  rolesError,
  rolesLoading,
  submitError,
  loadingForm,
  language,
  onReloadRoles,
}: UserFormModalProps) => {
  return (
    <Modal
      isDismissable={false}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="xl"
      scrollBehavior="inside"
      backdrop="blur"
    >
      <ModalContent className="bg-content1/95">
        {(onClose) => (
          <>
            <ModalHeader
              className="
                relative overflow-hidden
                px-6 py-5
                rounded-t-2xl
                bg-gradient-to-br from-primary/15 via-primary/5 to-background
                backdrop-blur-md
                flex items-center gap-3
                text-xl font-semibold
                animate-in fade-in slide-in-from-top-3
              "
            >
              <span
                className="
                  absolute -top-10 -right-10
                  h-24 w-24
                  rounded-full
                  bg-primary/20
                  blur-3xl
                  pointer-events-none
                "
              />

              {/* Icon */}
              <div
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-full
                  bg-primary/15
                  text-primary
                  shadow-sm
                  animate-in zoom-in-50
                "
              >
                {isEditing ? "✏️" : "➕"}
              </div>

              {/* Title */}
              <div className="flex flex-col leading-tight">
                <span>
                  {isEditing
                    ? language === "ar"
                      ? "تعديل المستخدم"
                      : "Edit User"
                    : language === "ar"
                      ? "إنشاء مستخدم جديد"
                      : "Create New User"}
                </span>

                <span className="text-xs font-normal text-foreground/60">
                  {language === "ar"
                    ? "إدارة بيانات المستخدم"
                    : "Manage user information"}
                </span>
              </div>
            </ModalHeader>

            <Form
              onSubmit={(e: any) => {
                e.preventDefault();
                onSubmit();
              }}
              className="w-full"
            >
              <ModalBody className="space-y-2">
                {/* Error Alert */}
                {submitError &&
                  ((Array.isArray(submitError) && submitError.length > 0) ||
                    (typeof submitError === 'string' && submitError.trim() !== '')) && (
                    <Alert
                      title={isEditing 
                        ? (language === 'ar' ? 'فشل الحفظ' : 'Save Failed')
                        : (language === 'ar' ? 'فشل الإنشاء' : 'Create Failed')
                      }
                      description={
                        <ul className="list-disc list-inside">
                          {Array.isArray(submitError)
                            ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
                            : <p>{submitError}</p>}
                        </ul>
                      }
                      variant="flat"
                      color="danger"
                      className="mb-4"
                    />
                  )}

                {/* Roles Error Alert */}
                {rolesError && (
                  <Alert
                    title={language === 'ar' ? 'تحذير' : 'Warning'}
                    description={
                      <div className="space-y-2">
                        <p>{language === 'ar' 
                          ? 'لم يتم تحميل الأدوار. قد لا تتمكن من حفظ المستخدم.' 
                          : 'Roles failed to load. You may not be able to save the user.'}
                        </p>
                        <Button 
                          size="sm" 
                          color="primary" 
                          variant="flat"
                          onPress={onReloadRoles}
                          isLoading={rolesLoading}
                        >
                          {language === 'ar' ? 'إعادة تحميل الأدوار' : 'Reload Roles'}
                        </Button>
                      </div>
                    }
                    variant="flat"
                    color="warning"
                    className="mb-4"
                  />
                )}

                {/* Name Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    variant="faded"
                    startContent={<UserIcon className="h-5 w-5 text-foreground/50" />}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    isRequired
                    errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                  />
                  <Input
                    label={language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}
                    variant="faded"
                    startContent={<GlobeAltIcon className="h-5 w-5 text-foreground/50" />}
                    value={formData.name_ar || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name_ar: e.target.value }))
                    }
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    variant="faded"
                    label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    startContent={<EnvelopeIcon className="h-5 w-5 text-foreground/50" />}
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    isRequired
                    errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                  />
                  <Input
                    label={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    variant="faded"
                    startContent={<DevicePhoneMobileIcon className="h-5 w-5 text-foreground/50" />}
                    value={formData.phone || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>

                {/* Role and Password */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    size="md"
                    label={language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                    startContent={<BriefcaseIcon className="h-5 w-5 text-foreground/60" />}
                    selectedKeys={formData.role_id ? [String(formData.role_id)] : []}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, role_id: e.target.value }))
                    }
                    variant="faded"
                    isRequired
                    isDisabled={roles.length === 0}
                    errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                    description={roles.length === 0 ? (language === 'ar' ? 'لا توجد أدوار متاحة' : 'No roles available') : ''}
                  >
                    {roles.map((role) => (
                      <SelectItem key={String(role.id ?? role.role_id)}>
                        {language === 'ar' ? (role.name_ar || role.name || role.role_name) : (role.name || role.role_name)}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    type="password"
                    label={language === 'ar' ? 'كلمة المرور' : 'Password'}
                    variant="faded"
                    startContent={<LockClosedIcon className="h-5 w-5 text-foreground/50" />}
                    isRequired={!isEditing}
                    value={(formData as any).password || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder={isEditing 
                      ? (language === 'ar' ? 'اختياري - اتركه فارغاً لعدم التغيير' : 'Optional - leave blank to keep unchanged')
                      : ''
                    }
                    errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                  />
                </div>

                {/* Status Field (Only for Editing) */}
                {isEditing && (
                  <div className="grid gap-4 md:grid-cols-1">
                    <Select
                      label={language === 'ar' ? 'الحالة' : 'Status'}
                      startContent={<ShieldCheckIcon className="h-5 w-5 text-foreground/60" />}
                      selectedKeys={[formData.status ? String(formData.status) : '']}
                      onChange={(e) =>
                        setFormData((prev: any) => ({ ...prev, status: e.target.value }))
                      }
                      variant="faded"
                      isRequired
                      errorMessage={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                    >
                      <SelectItem key={'active'}>
                        {language === 'ar' ? 'نشط' : 'Active'}
                      </SelectItem>
                      <SelectItem key={'pending_verification'}>
                        {language === 'ar' ? 'في انتظار التحقق' : 'Pending Verification'}
                      </SelectItem>
                      <SelectItem key={'pending_approval'}>
                        {language === 'ar' ? 'في انتظار الموافقة' : 'Pending Approval'}
                      </SelectItem>
                      <SelectItem key={'disabled'}>
                        {language === 'ar' ? 'معطل' : 'Disabled'}
                      </SelectItem>
                      <SelectItem key={'deleted'}>
                        {language === 'ar' ? 'محذوف' : 'Deleted'}
                      </SelectItem>
                    </Select>
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    onClose();
                    onCancel();
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  color="primary" 
                  type="submit" 
                  isLoading={loadingForm}
                  isDisabled={roles.length === 0 && !isEditing}
                >
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </ModalFooter>
            </Form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};