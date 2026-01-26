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
  Alert,
  Form,
} from '@heroui/react';
import { PlanForm } from '../types';

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  isEditing: boolean;
  formData: PlanForm;
  setFormData: React.Dispatch<React.SetStateAction<PlanForm>>;
  submitError: string;
  onSave: () => void;
}

export const PlanFormModal = ({
  isOpen,
  onOpenChange,
  isEditing,
  formData,
  setFormData,
  submitError,
  onSave,
}: Props) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        <Form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <ModalHeader>{isEditing ? 'Edit Plan' : 'New Plan'}</ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submitError && (
                <div className="md:col-span-2">
                  <Alert color="danger" title="Error" description={submitError} />
                </div>
              )}
              <Input
                label="Name"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                isRequired
              />
              <Input
                label="Description"
                value={formData.description || ''}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              />
              <Input
                type="number"
                label="Price"
                value={formData.price.toString()}
                onChange={e => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
              />
              <Select
                label="Currency"
                selectedKeys={new Set([formData.currency_code])}
                onSelectionChange={keys => {
                  const key = Array.from(keys)[0] as 'USD' | 'EUR' | 'ILS';
                  setFormData(p => ({ ...p, currency_code: key }));
                }}
              >
                <SelectItem key="USD">USD</SelectItem>
                <SelectItem key="EUR">EUR</SelectItem>
                <SelectItem key="ILS">ILS</SelectItem>
              </Select>

              <Input
                type="number"
                label="Max Cars"
                value={formData.max_cars.toString()}
                onChange={e => setFormData(p => ({ ...p, max_cars: Number(e.target.value) }))}
              />
              <Input
                type="number"
                label="Max Users"
                value={formData.max_users.toString()}
                onChange={e => setFormData(p => ({ ...p, max_users: Number(e.target.value) }))}
              />
              <Input
                type="number"
                label="Max Bookings"
                value={formData.max_bookings.toString()}
                onChange={e => setFormData(p => ({ ...p, max_bookings: Number(e.target.value) }))}
              />
              <Select
                label="Billing Cycle"
                selectedKeys={new Set([formData.billing_cycle])}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as 'monthly' | 'yearly';
                  setFormData(p => ({ ...p, billing_cycle: key }));
                }}
              >
                <SelectItem key="monthly">Monthly</SelectItem>
                <SelectItem key="yearly">Yearly</SelectItem>
              </Select>

              <Select
                label="Status"
                selectedKeys={new Set([formData.status])}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as 'active' | 'inactive' | 'deleted';
                  setFormData(p => ({ ...p, status: key }));
                }}
              >
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="inactive">Inactive</SelectItem>
                <SelectItem key="deleted">Deleted</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="submit">Save</Button>
            <Button variant="light" onPress={() => onOpenChange()}>Cancel</Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};