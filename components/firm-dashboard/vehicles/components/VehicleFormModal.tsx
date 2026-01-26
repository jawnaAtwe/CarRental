// components/VehicleFormModal.tsx

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
import { VehicleForm } from '../types/vehicle.types';

interface VehicleFormModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  isEditing: boolean;
  formData: VehicleForm;
  setFormData: React.Dispatch<React.SetStateAction<VehicleForm>>;
  submitError: string[] | string;
  loadingForm: boolean;
  branches: {id: number, name: string, name_ar: string}[];
  language: string;
  onSave: () => void;
  onClose: () => void;
  resetForm: () => void;
}

export const VehicleFormModal = ({
  isOpen,
  onOpenChange,
  isEditing,
  formData,
  setFormData,
  submitError,
  loadingForm,
  branches,
  language,
  onSave,
  onClose,
  resetForm,
}: VehicleFormModalProps) => {
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
        {(closeModal) => (
          <Form onSubmit={(e: any) => { e.preventDefault(); onSave(); }} className="w-full">
            <ModalHeader className="flex items-center gap-3 text-xl font-semibold">
              {isEditing ? (language==='ar'?'تعديل المركبة':'Edit Vehicle') : (language==='ar'?'إنشاء مركبة جديدة':'Create New Vehicle')}
            </ModalHeader>

            <ModalBody className="space-y-4">
              {submitError &&
                ((Array.isArray(submitError) && submitError.length > 0) ||
                  (typeof submitError === "string" && submitError.trim() !== "")) && (
                  <Alert
                    title={
                      isEditing
                        ? language === "ar"
                          ? "فشل الحفظ"
                          : "Save Failed"
                        : language === "ar"
                        ? "فشل الإنشاء"
                        : "Create Failed"
                    }
                    description={
                      <ul className="list-disc list-inside">
                        {Array.isArray(submitError)
                          ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
                          : <li>{submitError}</li>}
                      </ul>
                    }
                    variant="flat"
                    color="danger"
                    className="mb-4"
                  />
                )}

              <div className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                <div className="w-full max-w-7xl mx-auto px-6 py-4 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      label={language === "ar" ? "الماركة" : "Make"}
                      value={formData.make}
                      onChange={e => setFormData(p => ({ ...p, make: e.target.value }))}
                      isRequired
                    />

                    <Input
                      label={language === "ar" ? "الموديل" : "Model"}
                      value={formData.model}
                      onChange={e => setFormData(p => ({ ...p, model: e.target.value }))}
                      isRequired
                    />

                    <Input
                      label={language === "ar" ? "سنة الصنع" : "Year"}
                      type="number"
                      value={formData.year?.toString() || ""}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          year: e.target.value === "" ? undefined : Number(e.target.value),
                        }))
                      }
                      isRequired
                    />

                    <Input
                      label={language === "ar" ? "غرامة كل يوم " : "Late Fee Per Day"}
                      type="number"
                      value={formData.late_fee_day?.toString() || ""}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          late_fee_day: e.target.value === "" ? undefined : Number(e.target.value),
                        }))
                      }
                    />

                    <Input
                      label={language === "ar" ? "السعر / أسبوع" : "Price / Week"}
                      type="number"
                      value={formData.price_per_week?.toString() || ""}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          price_per_week: e.target.value === "" ? undefined : Number(e.target.value),
                        }))
                      }
                    />

                    <Input
                      label={language === "ar" ? "السعر / شهر" : "Price / Month"}
                      type="number"
                      value={formData.price_per_month?.toString() || ""}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          price_per_month: e.target.value === "" ? undefined : Number(e.target.value),
                        }))
                      }
                    />

                    <Input
                      label={language === "ar" ? "السعر / سنة" : "Price / Year"}
                      type="number"
                      value={formData.price_per_year?.toString() || ""}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          price_per_year: e.target.value === "" ? undefined : Number(e.target.value),
                        }))
                      }
                    />

                    <Input
                      label={language === "ar" ? "كود العملة" : "Currency Code"}
                      type="text"
                      value={formData.currency_code || ""}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          currency_code: e.target.value,
                        }))
                      }
                      isRequired
                    />

                    <Input
                      label={language === "ar" ? " العملة" : "Currency"}
                      type="text"
                      value={formData.currency || ""}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          currency: e.target.value,
                        }))
                      }
                      isRequired
                    />

                    <Select
                      label={language === "ar" ? "الفرع" : "Branch"}
                      selectedKeys={formData.branch_id ? [formData.branch_id.toString()] : []}
                      onChange={e =>
                        setFormData(p => ({ ...p, branch_id: Number(e.target.value) }))
                      }
                      isRequired
                    >
                      {branches.map(branch => (
                        <SelectItem key={branch.id.toString()}>
                          {language === "ar" ? branch.name_ar : branch.name}
                        </SelectItem>
                      ))}
                    </Select>

                    <Select
                      label={language === "ar" ? "الفئة" : "Category"}
                      selectedKeys={formData.category ? [formData.category] : []}
                      onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                      isRequired
                    >
                      <SelectItem key="Economy">{language === "ar" ? "اقتصادي" : "Economy"}</SelectItem>
                      <SelectItem key="SUV">{language === "ar" ? "دفع رباعي" : "SUV"}</SelectItem>
                      <SelectItem key="Luxury">{language === "ar" ? "فاخر" : "Luxury"}</SelectItem>
                      <SelectItem key="Convertible">{language === "ar" ? "قابل للتحويل" : "Convertible"}</SelectItem>
                      <SelectItem key="Van">{language === "ar" ? "فان" : "Van"}</SelectItem>
                    </Select>

                    <Input
                      label={language === "ar" ? "لوحة المركبة" : "License Plate"}
                      value={formData.license_plate || ""}
                      onChange={e => setFormData(p => ({ ...p, license_plate: e.target.value }))}
                    />

                    <Input
                      label="VIN"
                      value={formData.vin || ""}
                      onChange={e => setFormData(p => ({ ...p, vin: e.target.value }))}
                    />

                    <Input
                      label={language === "ar" ? "اللون" : "Color"}
                      value={formData.color || ""}
                      onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                    />

                    <Input
                      label={language === "ar" ? "Trim" : "Trim"}
                      value={formData.trim || ""}
                      onChange={e => setFormData(p => ({ ...p, trim: e.target.value }))}
                    />

                    <Input
                      label={language === "ar" ? "سعر الإيجار باليوم" : "Price Per Day"}
                      type="number"
                      value={formData.price_per_day.toString()}
                      onChange={e =>
                        setFormData(p => ({ ...p, price_per_day: Number(e.target.value) }))
                      }
                      isRequired
                    />

                    <Input
                      label={language === "ar" ? "نوع الوقود" : "Fuel Type"}
                      value={formData.fuel_type || ""}
                      onChange={e => setFormData(p => ({ ...p, fuel_type: e.target.value }))}
                    />

                    <Input
                      label={language === "ar" ? "ناقل الحركة" : "Transmission"}
                      value={formData.transmission || ""}
                      onChange={e => setFormData(p => ({ ...p, transmission: e.target.value }))}
                    />

                    <Input
                      label={language === "ar" ? "عدد الكيلومترات" : "Mileage"}
                      type="number"
                      value={formData.mileage?.toString() || ""}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          mileage: e.target.value === "" ? undefined : Number(e.target.value),
                        }))
                      }
                    />

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-foreground/70">
                        {language === "ar" ? "صورة المركبة" : "Vehicle Image"}
                      </label>

                      <input
                        id="vehicle-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const reader = new FileReader();
                          reader.onload = () => {
                            setFormData(p => ({
                              ...p,
                              image: reader.result as string,
                            }));
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />

                      <div className="mt-2 flex items-center gap-4">
                        {formData?.image ? (
                          <img
                            src={formData.image as string}
                            alt="Preview"
                            className="h-24 w-24 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="h-24 w-24 flex items-center justify-center rounded-md border border-dashed text-xs text-foreground/50">
                            {language === "ar" ? "لا توجد صورة" : "No Image"}
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={() =>
                              document.getElementById("vehicle-image-input")?.click()
                            }
                          >
                            {language === "ar" ? "اختيار صورة" : "Choose Image"}
                          </Button>

                          {formData?.image && (
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() =>
                                setFormData(p => ({ ...p, image: null }))
                              }
                            >
                              {language === "ar" ? "حذف الصورة" : "Remove"}
                            </Button>
                          )}
                        </div>

                        {isEditing && (
                          <Select 
                            label={language==='ar'?'الحالة':'Status'} 
                            selectedKeys={[formData.status]} 
                            onChange={(e) =>
                              setFormData((prev: any) => ({ ...prev, status: e.target.value }))
                            }
                          >
                            <SelectItem key="available">{language==='ar'?'متاحة':'Available'}</SelectItem>
                            <SelectItem key="maintenance">{language==='ar'?'صيانة':'Maintenance'}</SelectItem>
                            <SelectItem key="rented">{language==='ar'?'مستأجرة':'Rented'}</SelectItem>
                          </Select>
                        )}
                      </div>
                    </div>

                    <Button variant="light" onPress={() => { onClose(); resetForm(); }}>
                      {language==='ar'?'إلغاء':'Cancel'}
                    </Button>
                    <Button color="primary" type="submit" isLoading={loadingForm}>
                      {language==='ar'?'حفظ':'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            </ModalBody>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
};