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
  Textarea,
} from '@heroui/react';
import { DocumentTextIcon, LanguageIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

type ContractTemplateFormProps = {
  language: string;
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  formData: {
    language?: string;
    name?: string | null;
    content?: string;
    status?: string;
  };
  submitError: string[] | string;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: string, value: any) => void;
};

export const ContractTemplateForm = ({
  language,
  isOpen,
  isEditing,
  loading,
  formData,
  submitError,
  onClose,
  onSave,
  onChange,
}: ContractTemplateFormProps) => {
  const languageOptions = [
    { value: 'en', label: language === 'ar' ? 'الإنجليزية' : 'English' },
    { value: 'ar', label: language === 'ar' ? 'العربية' : 'Arabic' },
  ];

  const statusOptions = [
    { value: 'active', label: language === 'ar' ? 'نشط' : 'Active' },
    { value: 'inactive', label: language === 'ar' ? 'غير نشط' : 'Inactive' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <DocumentTextIcon className="h-6 w-6 text-primary" />
          {isEditing
            ? language === 'ar'
              ? 'تعديل قالب العقد'
              : 'Edit Contract Template'
            : language === 'ar'
            ? 'قالب عقد جديد'
            : 'New Contract Template'}
        </ModalHeader>
        <Form className="w-full">
          <ModalBody className="space-y-4">
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

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
                label={language === 'ar' ? 'عنوان القالب' : 'Template Name'}
                variant="faded"
                startContent={<DocumentTextIcon className="h-5 w-5 text-foreground/50" />}
                value={formData.name || ''}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder={language === 'ar' ? 'مثال: عقد إيجار سيارة' : 'Example: Car Rental Contract'}
              />

              <Select
                label={language === 'ar' ? 'اللغة' : 'Language'}
                placeholder={language === 'ar' ? 'اختر اللغة' : 'Select Language'}
                selectedKeys={formData.language ? [formData.language] : []}
                onChange={(e) => onChange('language', e.target.value)}
                startContent={<LanguageIcon className="h-5 w-5 text-foreground/50" />}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg"
                isRequired
              >
                {languageOptions.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>

            <Select
              label={language === 'ar' ? 'الحالة' : 'Status'}
              placeholder={language === 'ar' ? 'اختر الحالة' : 'Select Status'}
              selectedKeys={formData.status ? [formData.status] : []}
              onChange={(e) => onChange('status', e.target.value)}
              startContent={<CheckCircleIcon className="h-5 w-5 text-foreground/50" />}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg"
              isRequired
            >
              {statusOptions.map((option) => (
                <SelectItem key={option.value}>{option.label}</SelectItem>
              ))}
            </Select>

            <Textarea
              className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 rounded-lg"
              label={language === 'ar' ? 'محتوى العقد' : 'Contract Content'}
              variant="faded"
              minRows={12}
              value={formData.content || ''}
              onChange={(e) => onChange('content', e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'أدخل نص العقد هنا... يمكنك استخدام HTML أو نص عادي'
                  : 'Enter contract text here... You can use HTML or plain text'
              }
              isRequired
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {language === 'ar' ? (
                  <>
                    <strong>نصيحة:</strong> يمكنك استخدام متغيرات ديناميكية مثل {'{customer_name}'},{' '}
                    {'{vehicle_name}'}, {'{start_date}'} في محتوى العقد
                  </>
                ) : (
                  <>
                    <strong>Tip:</strong> You can use dynamic variables like {'{customer_name}'}, {'{vehicle_name}'}
                    , {'{start_date}'} in the contract content
                  </>
                )}
              </p>
            </div>
          </ModalBody>
        </Form>
        <ModalFooter className="flex justify-end gap-3">
          <Button variant="flat" onPress={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="solid" color="primary" isLoading={loading} onPress={onSave}>
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};