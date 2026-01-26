import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Form,
} from '@heroui/react';
import { MaintenanceData } from '../types';

interface Props {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  maintenanceData: MaintenanceData;
  setMaintenanceData: React.Dispatch<React.SetStateAction<MaintenanceData>>;
  onSave: () => void;
}

export const MaintenanceModal = ({
  language,
  isOpen,
  onOpenChange,
  onClose,
  maintenanceData,
  setMaintenanceData,
  onSave,
}: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="md"
      backdrop="blur"
    >
      <ModalContent className="bg-content1/95">
        <ModalHeader>
          {language === "ar" ? "إضافة صيانة" : "Add Maintenance"}
        </ModalHeader>

        <ModalBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Form>
            <Select
              label={language === "ar" ? "نوع الصيانة" : "Maintenance Type"}
              selectedKeys={[maintenanceData.maintenance_type]}
              onChange={(e) =>
                setMaintenanceData({ ...maintenanceData, maintenance_type: e.target.value })
              }
            >
              <SelectItem key="scheduled">{language === "ar" ? "مجدولة" : "Scheduled"}</SelectItem>
              <SelectItem key="repair">{language === "ar" ? "إصلاح" : "Repair"}</SelectItem>
              <SelectItem key="inspection">{language === "ar" ? "فحص" : "Inspection"}</SelectItem>
              <SelectItem key="accident">{language === "ar" ? "حادث" : "Accident"}</SelectItem>
            </Select>

            <Input
              label={language === "ar" ? "العنوان" : "Title"}
              value={maintenanceData.title || ""}
              onChange={(e) =>
                setMaintenanceData({ ...maintenanceData, title: e.target.value })
              }
            />

            <Input
              label={language === "ar" ? "الوصف" : "Description"}
              value={maintenanceData.description || ""}
              onChange={(e) =>
                setMaintenanceData({ ...maintenanceData, description: e.target.value })
              }
            />

            <Input
              type="date"
              label={language === "ar" ? "تاريخ البداية" : "Start Date"}
              value={maintenanceData.start_date || ""}
              onChange={(e) =>
                setMaintenanceData({ ...maintenanceData, start_date: e.target.value })
              }
            />
            <Input
              type="date"
              label={language === "ar" ? "تاريخ النهاية" : "End Date"}
              value={maintenanceData.end_date || ""}
              onChange={(e) =>
                setMaintenanceData({ ...maintenanceData, end_date: e.target.value })
              }
            />

            <Input
              type="number"
              label={language === "ar" ? "المسافة المقطوعة" : "Odometer"}
              value={maintenanceData.odometer !== undefined ? maintenanceData.odometer.toString() : ""}
              onChange={(e) =>
                setMaintenanceData({
                  ...maintenanceData,
                  odometer: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
            <Input
              type="number"
              label={language === "ar" ? "التكلفة" : "Cost"}
              value={maintenanceData.cost !== undefined ? maintenanceData.cost.toString() : ""}
              onChange={(e) =>
                setMaintenanceData({
                  ...maintenanceData,
                  cost: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />

            <Input
              label={language === "ar" ? "ملاحظات" : "Notes"}
              value={maintenanceData.notes || ""}
              onChange={(e) =>
                setMaintenanceData({ ...maintenanceData, notes: e.target.value })
              }
            />

            <Input
              type="date"
              label={language === "ar" ? "تاريخ الصيانة القادمة" : "Next Due Date"}
              value={maintenanceData.next_due_date || ""}
              onChange={(e) => setMaintenanceData({ ...maintenanceData, next_due_date: e.target.value })}
            />
            <Input
              type="number"
              label={language === "ar" ? "المسافة المقطوعة القادمة" : "Next Due Mileage"}
              value={maintenanceData.next_due_mileage !== undefined ? maintenanceData.next_due_mileage?.toString() : ""}
              onChange={(e) =>
                setMaintenanceData({
                  ...maintenanceData,
                  next_due_mileage: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/70">
                {language === "ar" ? "المرفقات" : "Attachments"}
              </label>
              <input
                type="file"
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;

                  const attachmentsArray = Array.from(files).map((file) => ({
                    file_type: file.type,
                    file_url: URL.createObjectURL(file), 
                  }));

                  setMaintenanceData({
                    ...maintenanceData,
                    attachments: [...(maintenanceData.attachments || []), ...attachmentsArray],
                  });
                }}
              />

              {maintenanceData.attachments && maintenanceData.attachments.length > 0 && (
                <ul className="list-disc list-inside text-sm">
                  {maintenanceData.attachments.map((att, idx) => (
                    <li key={idx}>
                      {att.file_type} -{" "}
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                        {language === "ar" ? "عرض" : "View"}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Form>
        </ModalBody>

        <ModalFooter className="flex justify-end gap-2">
          <Button variant="light" onPress={onClose}>
            {language === "ar" ? "إغلاق" : "Close"}
          </Button>
          <Button variant="flat" color="success" onPress={onSave}>
            {language === "ar" ? "حفظ" : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};