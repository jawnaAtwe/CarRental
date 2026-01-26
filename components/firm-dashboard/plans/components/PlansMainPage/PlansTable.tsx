import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from '@heroui/react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { PlanDB } from '../types';

interface Props {
  language: string;
  plans: PlanDB[];
  loading: boolean;
  isSuperAdmin: boolean;
  onEdit: (plan: PlanDB) => void;
  onDelete: (plan: PlanDB) => void;
  onViewSubscription: (planId: number) => void;
  onAddSubscription: (planId: number) => void;
}

export const PlansTable = ({
  language,
  plans,
  loading,
  isSuperAdmin,
  onEdit,
  onDelete,
  onViewSubscription,
  onAddSubscription,
}: Props) => {
  return (
    <Table selectionMode="none">
      <TableHeader>
        <TableColumn>Name</TableColumn>
        <TableColumn>Price</TableColumn>
        <TableColumn>Billing</TableColumn>
        <TableColumn>Limits</TableColumn>
        <TableColumn>Status</TableColumn>
        <TableColumn className="text-end">Actions</TableColumn>
      </TableHeader>

      <TableBody isLoading={loading} emptyContent="No plans">
        {plans.map(plan => (
          <TableRow key={plan.id}>
            <TableCell>{plan.name}</TableCell>
            <TableCell>{plan.price} {plan.currency_code}</TableCell>
            <TableCell>{plan.billing_cycle}</TableCell>
            <TableCell>🚗 {plan.max_cars} | 👤 {plan.max_users} | 📅 {plan.max_bookings}</TableCell>
            <TableCell>{plan.status}</TableCell>
            <TableCell className="flex justify-end gap-2">
              {isSuperAdmin && (
                <>
                  <Button
                    isIconOnly
                    variant="flat"
                    onPress={() => onEdit(plan)}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="flat"
                    color="danger"
                    onPress={() => onDelete(plan)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => onViewSubscription(plan.id)}
                >
                  {language === 'ar' ? 'عرض الاشتراك' : 'View Subscription'}
                </Button>

                {!isSuperAdmin && (
                  <Button
                    size="sm"
                    startContent={<PlusIcon className="h-4 w-4" />}
                    onPress={() => onAddSubscription(plan.id)}
                  >
                    {language === 'ar' ? 'إضافة اشتراك' : 'Add Subscription'}
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};