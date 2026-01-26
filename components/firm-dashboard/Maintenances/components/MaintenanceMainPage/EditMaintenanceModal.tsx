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
} from '@heroui/react';

interface Props {
  language: string;
  isOpen: boolean;
  onClose: () => void;
  editingMaintenance: any;
  setEditingMaintenance: React.Dispatch<React.SetStateAction<any>>;
  onSave: () => void;
  saving: boolean;
}

export const EditMaintenanceModal = ({
  language,
  isOpen,
  onClose,
  editingMaintenance,
  setEditingMaintenance,
  onSave,
  saving,
}: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          {language === "ar" ? "تعديل الصيانة" : "Edit Maintenance"}
        </ModalHeader>

        <ModalBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label={language === "ar" ? "العنوان" : "Title"}
            value={editingMaintenance?.title || ""}
            onChange={(e) =>
              setEditingMaintenance({ ...editingMaintenance, title: e.target.value })
            }
          />

          <Select
            label={language === "ar" ? "نوع الصيانة" : "Maintenance Type"}
            selectedKeys={[editingMaintenance?.maintenance_type]}
            onChange={(e) =>
              setEditingMaintenance({
                ...editingMaintenance,
                maintenance_type: e.target.value,
              })
            }
          >
            <SelectItem key="scheduled">Scheduled</SelectItem>
            <SelectItem key="repair">Repair</SelectItem>
            <SelectItem key="inspection">Inspection</SelectItem>
            <SelectItem key="accident">Accident</SelectItem>
          </Select>

          <Select
            label={language === "ar" ? "حالة الدفع" : "Payment Status"}
            selectedKeys={[editingMaintenance?.payment_status]}
            onChange={(e) =>
              setEditingMaintenance({
                ...editingMaintenance,
                payment_status: e.target.value,
              })
            }
          >
            <SelectItem key="unpaid">{language === "ar" ? "غير مدفوع" : "Unpaid"}</SelectItem>
            <SelectItem key="partial">{language === "ar" ? "مدفوع جزئي" : "Partial"}</SelectItem>
            <SelectItem key="paid">{language === "ar" ? "مدفوع" : "Paid"}</SelectItem>
          </Select>

          <Select
            label={language === "ar" ? "الحالة" : "Status"}
            selectedKeys={[editingMaintenance?.status]}
            onChange={(e) =>
              setEditingMaintenance({
                ...editingMaintenance,
                status: e.target.value,
              })
            }
          >
            <SelectItem key="planned">{language === "ar" ? "مخطط" : "Planned"}</SelectItem>
            <SelectItem key="in_progress">{language === "ar" ? "قيد التنفيذ" : "In Progress"}</SelectItem>
            <SelectItem key="completed">{language === "ar" ? "مكتمل" : "Completed"}</SelectItem>
            <SelectItem key="deleted">{language === "ar" ? "محذوف" : "Deleted"}</SelectItem>
          </Select>

          <Input
            type="date"
            label={language === "ar" ? "تاريخ البداية" : "Start Date"}
            value={editingMaintenance?.start_date || ""}
            onChange={(e) =>
              setEditingMaintenance({ ...editingMaintenance, start_date: e.target.value })
            }
          />

          <Input
            type="date"
            label={language === "ar" ? "تاريخ النهاية" : "End Date"}
            value={editingMaintenance?.end_date || ""}
            onChange={(e) =>
              setEditingMaintenance({ ...editingMaintenance, end_date: e.target.value })
            }
          />

          <Input
            type="number"
            label={language === "ar" ? "عداد المسافة (كم)" : "Odometer (km)"}
            value={editingMaintenance?.odometer || ""}
            onChange={(e) =>
              setEditingMaintenance({
                ...editingMaintenance,
                odometer: Number(e.target.value),
              })
            }
          />

          <Input
            type="number"
            label={language === "ar" ? "التكلفة" : "Cost"}
            value={editingMaintenance?.cost || ""}
            onChange={(e) =>
              setEditingMaintenance({
                ...editingMaintenance,
                cost: Number(e.target.value),
              })
            }
          />

          <Input
            label={language === "ar" ? "ملاحظات" : "Notes"}
            value={editingMaintenance?.notes || ""}
            onChange={(e) =>
              setEditingMaintenance({
                ...editingMaintenance,
                notes: e.target.value,
              })
            }
          />

          <Input
            type="date"
            label={language === "ar" ? "تاريخ الصيانة القادمة" : "Next Due Date"}
            value={editingMaintenance?.next_due_date || null}
            onChange={(e) =>
              setEditingMaintenance({
                ...editingMaintenance,
                next_due_date: e.target.value,
              })
            }
          />

          <Input
            type="number"
            label={language === "ar" ? "المسافة القادمة (كم)" : "Next Due Mileage"}
            value={editingMaintenance?.next_due_mileage || ""}
            onChange={(e) =>
              setEditingMaintenance({
                ...editingMaintenance,
                next_due_mileage: Number(e.target.value),
              })
            }
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70">
              {language === "ar" ? "المرفقات" : "Attachments"}
            </label>
            
            {editingMaintenance?.attachments && editingMaintenance.attachments.length > 0 && (
              <ul className="list-disc list-inside text-sm space-y-1">
                {editingMaintenance.attachments.map((att: any, idx: number) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>{att.file_type} - 
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="text-blue-500 underline ml-2">
                        {language === "ar" ? "عرض" : "View"}
                      </a>
                    </span>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => {
                        const updatedAttachments = editingMaintenance.attachments.filter((_: any, i: number) => i !== idx);
                        setEditingMaintenance({ ...editingMaintenance, attachments: updatedAttachments });
                      }}
                    >
                      {language === "ar" ? "حذف" : "Remove"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            
            <input
              type="file"
              multiple
              onChange={(e) => {
                if (!e.target.files || !editingMaintenance) return;

                const newAttachments = Array.from(e.target.files).map(file => ({
                  file_type: file.type,
                  file_url: URL.createObjectURL(file),
                }));

                setEditingMaintenance({
                  ...editingMaintenance,
                  attachments: [...(editingMaintenance.attachments || []), ...newAttachments],
                });
              }}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>

          <Button
            color="primary"
            isLoading={saving}
            onPress={onSave}
          >
            {language === "ar" ? "حفظ" : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};