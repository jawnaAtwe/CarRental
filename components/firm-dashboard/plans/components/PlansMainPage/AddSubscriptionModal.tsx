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
import { PlanDB } from '../types';

interface Props {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  plans: PlanDB[];
  selectedPlanId: number | null;
  setSelectedPlanId: (id: number | null) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  onAdd: () => void;
  submitting: boolean;
}

export const AddSubscriptionModal = ({
  language,
  isOpen,
  onOpenChange,
  plans,
  selectedPlanId,
  setSelectedPlanId,
  startDate,
  setStartDate,
  onAdd,
  submitting,
}: Props) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        <ModalHeader>{language === 'ar' ? 'إضافة اشتراك' : 'Add Subscription'}</ModalHeader>
        <ModalBody>
          <Input
            type="date"
            label={language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <Select
            label={language === 'ar' ? 'اختر خطة' : 'Select Plan'}
            selectedKeys={selectedPlanId !== null ? new Set([String(selectedPlanId)]) : new Set()}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0];
              setSelectedPlanId(key ? Number(key) : null);
            }}
          >
            {plans.map(plan => (
              <SelectItem key={String(plan.id)} textValue={String(plan.id)}>
                {plan.name} - {plan.price} {plan.currency_code} ({plan.billing_cycle})
              </SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onAdd} isLoading={submitting}>
            {language === 'ar' ? 'إضافة' : 'Add'}
          </Button>
          <Button variant="light" onPress={onOpenChange}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};