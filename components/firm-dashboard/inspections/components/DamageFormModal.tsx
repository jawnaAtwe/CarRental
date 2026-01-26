'use client';

import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { DAMAGE_TYPES, DAMAGE_SEVERITIES, CLAIM_STATUSES } from '../constants';
import type { DamageForm, EditDamageForm } from '../types';

interface DamageFormModalProps {
  language: string;
  isOpen: boolean;
  isEditing: boolean;
  damageData: DamageForm | EditDamageForm;
  onClose: () => void;
  onChange: (data: Partial<DamageForm | EditDamageForm>) => void;
  onSubmit: () => void;
}

export default function DamageFormModal({
  language,
  isOpen,
  isEditing,
  damageData,
  onClose,
  onChange,
  onSubmit,
}: DamageFormModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md">
      <ModalContent className="max-h-[80vh] overflow-y-auto">
        <ModalHeader>
          {isEditing
            ? language === 'ar' ? 'تعديل الضرر' : 'Edit Damage'
            : language === 'ar' ? 'إضافة ضرر' : 'Add Damage'}
        </ModalHeader>

        <Form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <ModalBody className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* نوع الضرر */}
              <select
                value={damageData.damage_type}
                onChange={(e) => onChange({ damage_type: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">{language === 'ar' ? 'اختر نوع الضرر' : 'Select damage type'}</option>
                {Object.entries(DAMAGE_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {language === 'ar' ? label.ar : label.en}
                  </option>
                ))}
              </select>

              {/* شدة الضرر */}
              <select
                value={damageData.damage_severity}
                onChange={(e) => onChange({ damage_severity: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">{language === 'ar' ? 'اختر شدة الضرر' : 'Select damage severity'}</option>
                {Object.entries(DAMAGE_SEVERITIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {language === 'ar' ? label.ar : label.en}
                  </option>
                ))}
              </select>

              {/* المكان */}
              <Input
                label={language === 'ar' ? 'المكان' : 'Location'}
                value={damageData.damage_location}
                onChange={(e) => onChange({ damage_location: e.target.value })}
              />

              {/* الوصف */}
              <Input
                label={language === 'ar' ? 'الوصف' : 'Description'}
                value={damageData.description}
                onChange={(e) => onChange({ description: e.target.value })}
              />

              {/* التكلفة المقدرة */}
              <Input
                type="number"
                label={language === 'ar' ? 'التكلفة المقدرة' : 'Estimated Cost'}
                value={damageData.estimated_cost?.toString() || '0'}
                onChange={(e) => onChange({ estimated_cost: Number(e.target.value) })}
              />

              {/* التكلفة النهائية */}
              <Input
                type="number"
                label={language === 'ar' ? 'التكلفة النهائية' : 'Final Cost'}
                value={damageData.final_cost?.toString() || '0'}
                onChange={(e) => onChange({ final_cost: Number(e.target.value) })}
              />

              {/* هل يحتاج لتأمين؟ */}
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={damageData.insurance_required === true}
                  onChange={(e) =>
                    onChange({
                      insurance_required: e.target.checked,
                      insurance_provider: e.target.checked ? damageData.insurance_provider : '',
                    })
                  }
                />
                <span>{language === 'ar' ? 'هل تحتاج لتأمين؟' : 'Insurance Required'}</span>
              </label>

              {/* مزود التأمين - يظهر فقط إذا تم اختيار "نعم" */}
              {damageData.insurance_required && (
                <>
                  <Input
                    label={language === 'ar' ? 'مزود التأمين' : 'Insurance Provider'}
                    value={damageData.insurance_provider || ''}
                    onChange={(e) => onChange({ insurance_provider: e.target.value })}
                  />

                  <Input
                    label={language === 'ar' ? 'رقم المطالبة' : 'Claim Number'}
                    value={damageData.claim_number || ''}
                    onChange={(e) => onChange({ claim_number: e.target.value })}
                  />

                  <Input
                    label={language === 'ar' ? 'مبلغ المطالبة' : 'Claim Amount'}
                    value={damageData.claim_amount || ''}
                    onChange={(e) => onChange({ claim_amount: e.target.value })}
                  />
                </>
              )}

              {/* حالة المطالبة */}
              <select
                value={damageData.claim_status}
                onChange={(e) => onChange({ claim_status: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                {Object.entries(CLAIM_STATUSES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {language === 'ar' ? label.ar : label.en}
                  </option>
                ))}
              </select>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" color="primary">
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
}