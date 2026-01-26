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
  Textarea,
} from '@heroui/react';
import {
  BuildingOffice2Icon,
  GlobeAltIcon,
  MapPinIcon,
} from '@heroicons/react/24/solid';

type BranchFormProps = {
  language: string;
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  formData: {
    name: string;
    name_ar?: string | null;
    address?: string | null;
    address_ar?: string | null;
    latitude?: string | null;
    longitude?: string | null;
  };
  submitError: string[] | string;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: string, value: string) => void;
};

export const BranchForm = ({
  language,
  isOpen,
  isEditing,
  loading,
  formData,
  submitError,
  onClose,
  onSave,
  onChange,
}: BranchFormProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          {isEditing ? (language === 'ar' ? 'تعديل الفرع' : 'Edit Branch') : (language === 'ar' ? 'فرع جديد' : 'New Branch')}
        </ModalHeader>
        <Form className="w-full">
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

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
                label={language === 'ar' ? 'اسم الفرع' : 'Branch Name'}
                variant="faded"
                startContent={<BuildingOffice2Icon className="h-5 w-5 text-foreground/50" />}
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                isRequired
                errorMessage={language === 'ar' ? 'حقل مطلوب' : 'Required field'}
              />
              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
                label={language === 'ar' ? 'اسم الفرع بالعربي' : 'Branch Name (Arabic)'}
                variant="faded"
                startContent={<GlobeAltIcon className="h-5 w-5 text-foreground/50" />}
                value={formData.name_ar || ''}
                onChange={(e) => onChange('name_ar', e.target.value)}
              />
              <Textarea
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
                label={language === 'ar' ? 'العنوان' : 'Address'}
                variant="faded"
                minRows={2}
                startContent={<MapPinIcon className="h-5 w-5 text-foreground/50" />}
                value={formData.address || ''}
                onChange={(e) => onChange('address', e.target.value)}
              />
              <Textarea
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
                label={language === 'ar' ? 'العنوان بالعربي' : 'Address (Arabic)'}
                variant="faded"
                minRows={2}
                value={formData.address_ar || ''}
                onChange={(e) => onChange('address_ar', e.target.value)}
              />
              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
                label="Latitude"
                type="number"
                value={formData.latitude ?? ''}
                onChange={(e) => onChange('latitude', e.target.value)}
              />
              <Input
                className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg"
                label="Longitude"
                type="number"
                value={formData.longitude ?? ''}
                onChange={(e) => onChange('longitude', e.target.value)}
              />
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