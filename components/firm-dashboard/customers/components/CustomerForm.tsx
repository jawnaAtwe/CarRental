import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';
import { CustomerForm as CustomerFormType, Gender, IDType } from '../hooks/types';
import { GENDER_OPTIONS, ID_TYPE_OPTIONS, STATUS_OPTIONS } from '../constants';

type CustomerFormProps = {
  language: string;
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  formData: CustomerFormType;
  submitError: string | string[];
  onClose: () => void;
  onSave: () => void;
  updateForm: <K extends keyof CustomerFormType>(key: K, value: CustomerFormType[K]) => void;
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormType>>;
};

export const CustomerForm = ({
  language,
  isOpen,
  isEditing,
  loading,
  formData,
  submitError,
  onClose,
  onSave,
  updateForm,
  setFormData,
}: CustomerFormProps) => {
  return (
    <Modal
      isDismissable={false}
      isOpen={isOpen}
      onOpenChange={onClose}
      size="xl"
      scrollBehavior="inside"
      backdrop="blur"
    >
      <ModalContent className="bg-content1/95">
        <ModalHeader className="relative overflow-hidden px-6 py-5 rounded-t-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-background backdrop-blur-md flex items-center gap-3 text-xl font-semibold animate-in fade-in slide-in-from-top-3">
          <span className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary shadow-sm animate-in zoom-in-50">
            {isEditing ? '✏️' : '➕'}
          </div>

          <div className="flex flex-col leading-tight">
            <span>
              {isEditing
                ? language === 'ar'
                  ? 'تعديل العميل'
                  : 'Edit Customer'
                : language === 'ar'
                ? 'إنشاء عميل جديد'
                : 'Create New Customer'}
            </span>
            <span className="text-xs font-normal text-foreground/60">
              {language === 'ar' ? 'إدارة بيانات العميل' : 'Manage customer information'}
            </span>
          </div>
        </ModalHeader>

        <Form
          onSubmit={(e: any) => {
            e.preventDefault();
            onSave();
          }}
          className="w-full"
        >
          <ModalBody className="space-y-2">
            {submitError &&
              ((Array.isArray(submitError) && submitError.length > 0) ||
                (typeof submitError === 'string' && submitError.trim() !== '')) && (
                <Alert
                  title={
                    isEditing
                      ? language === 'ar'
                        ? 'فشل الحفظ'
                        : 'Save Failed'
                      : language === 'ar'
                      ? 'فشل الإنشاء'
                      : 'Create Failed'
                  }
                  description={
                    <ul className="list-disc list-inside">
                      {Array.isArray(submitError) ? (
                        submitError.map((err, idx) => <li key={idx}>{err}</li>)
                      ) : (
                        <p>{submitError}</p>
                      )}
                    </ul>
                  }
                  variant="flat"
                  color="danger"
                  className="mb-4"
                />
              )}

            <div className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
              <div className="w-full max-w-7xl mx-auto px-6 py-4 space-y-6">
                {/* Names */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    label="First Name"
                    value={formData.first_name || ''}
                    onChange={(e) => updateForm('first_name', e.target.value)}
                  />

                  <Input
                    label="Last Name"
                    value={formData.last_name || ''}
                    onChange={(e) => updateForm('last_name', e.target.value)}
                  />

                  <Input
                    label="Full Name"
                    value={formData.full_name || ''}
                    onChange={(e) => updateForm('full_name', e.target.value)}
                  />

                  <Select
                    label={language === 'ar' ? 'الجنس' : 'Gender'}
                    selectedKeys={formData.gender ? [formData.gender] : []}
                    onChange={(e) => updateForm('gender', e.target.value as Gender)}
                    variant="faded"
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value}>
                        {language === 'ar' ? option.labelAr : option.labelEn}
                      </SelectItem>
                    ))}
                  </Select>

                  {!isEditing && (
                    <Input
                      type="password"
                      label={language === 'ar' ? 'كلمة المرور' : 'Password'}
                      value={formData.password || ''}
                      onChange={(e) => updateForm('password', e.target.value)}
                    />
                  )}

                  <Input
                    type="date"
                    label={language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
                    className="p-2 rounded-lg w-full"
                    value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''}
                    onChange={(e) => updateForm('date_of_birth', e.target.value)}
                  />
                </div>

                {/* Identity */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Select
                    label={language === 'ar' ? 'نوع الهوية' : 'ID Type'}
                    selectedKeys={formData.id_type ? [formData.id_type] : []}
                    onChange={(e) => updateForm('id_type', e.target.value as IDType)}
                    variant="faded"
                  >
                    {ID_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value}>
                        {language === 'ar' ? option.labelAr : option.labelEn}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    label={language === 'ar' ? 'رقم الهوية' : 'ID Number'}
                    value={formData.id_number || ''}
                    onChange={(e) => updateForm('id_number', e.target.value)}
                  />

                  <Input
                    label={language === 'ar' ? 'الجنسية' : 'Nationality'}
                    value={formData.nationality || ''}
                    onChange={(e) => updateForm('nationality', e.target.value)}
                  />
                </div>

                {/* Driving License */}
                {formData.customer_type === 'individual' && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      label={language === 'ar' ? 'رقم رخصة القيادة' : 'Driving License Number'}
                      value={formData.driving_license_number || ''}
                      onChange={(e) => updateForm('driving_license_number', e.target.value)}
                    />

                    <Input
                      label={language === 'ar' ? 'بلد الرخصة' : 'License Country'}
                      value={formData.license_country || ''}
                      onChange={(e) => updateForm('license_country', e.target.value)}
                    />

                    <Input
                      type="date"
                      label={language === 'ar' ? 'تاريخ انتهاء الرخصة' : 'License Expiry Date'}
                      className="p-2 rounded-lg w-full"
                      value={formData.license_expiry_date ? formData.license_expiry_date.split('T')[0] : ''}
                      onChange={(e) => updateForm('license_expiry_date', e.target.value)}
                    />
                  </div>
                )}

                {/* Address */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={language === 'ar' ? 'العنوان' : 'Address'}
                    value={formData.address || ''}
                    onChange={(e) => updateForm('address', e.target.value)}
                  />

                  <Input
                    label={language === 'ar' ? 'المدينة' : 'City'}
                    value={formData.city || ''}
                    onChange={(e) => updateForm('city', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={language === 'ar' ? 'الدولة' : 'Country'}
                    value={formData.country || ''}
                    onChange={(e) => updateForm('country', e.target.value)}
                  />

                  <Input
                    label="WhatsApp"
                    value={formData.whatsapp || ''}
                    onChange={(e) => updateForm('whatsapp', e.target.value)}
                  />
                </div>

                {/* Profile Image */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-foreground/70">
                      {language === 'ar' ? 'صورة العميل' : 'Customer Image'}
                    </label>

                    <input
                      id="customer-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = () => {
                          setFormData((p) => ({
                            ...p,
                            profile_image: reader.result as string,
                          }));
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />

                    <div className="mt-2 flex items-center gap-4">
                      {formData?.profile_image ? (
                        <img
                          src={formData.profile_image as string}
                          alt="Profile"
                          className="h-24 w-24 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="h-24 w-24 flex items-center justify-center rounded-md border border-dashed text-xs text-foreground/50">
                          {language === 'ar' ? 'لا توجد صورة' : 'No Image'}
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => document.getElementById('customer-image-input')?.click()}
                        >
                          {language === 'ar' ? 'اختيار صورة' : 'Choose Image'}
                        </Button>

                        {formData?.profile_image && (
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => setFormData((p) => ({ ...p, profile_image: null }))}
                          >
                            {language === 'ar' ? 'حذف الصورة' : 'Remove'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status (Edit Only) */}
                {isEditing && (
                  <div className="grid gap-4 md:grid-cols-1">
                    <Select
                      label={language === 'ar' ? 'الحالة' : 'Status'}
                      selectedKeys={formData.status ? [formData.status] : []}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                      variant="faded"
                      isRequired
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value}>
                          {language === 'ar' ? option.labelAr : option.labelEn}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="light"
                    onPress={() => {
                      onClose();
                    }}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button color="primary" type="submit" isLoading={loading}>
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </ModalBody>
        </Form>
      </ModalContent>
    </Modal>
  );
};