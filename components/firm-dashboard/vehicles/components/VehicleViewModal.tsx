// components/VehicleViewModal.tsx

import {
  Avatar,
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import moment from 'moment';
import { VehicleDB } from '../types/vehicle.types';

interface VehicleViewModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  activeVehicle: VehicleDB | null;
  language: string;
}

export const VehicleViewModal = ({
  isOpen,
  onOpenChange,
  activeVehicle,
  language,
}: VehicleViewModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      backdrop="blur"
    >
      <ModalContent className="bg-content1/95">
        {(onClose) =>
          activeVehicle && (
            <>
              <ModalHeader className="flex items-center gap-3">
                <Avatar
                  size="md"
                  name={`${activeVehicle.make} ${activeVehicle.model}`}
                  src={activeVehicle.image || ''}
                />
                <div>
                  <p className="text-lg font-semibold">
                    {activeVehicle.make} {activeVehicle.model}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {activeVehicle.year || '-'}
                  </p>
                </div>
              </ModalHeader>

              <ModalBody className="space-y-4">
                <Divider />

                {activeVehicle && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'معلومات المركبة' : 'Vehicle Information'}
                    </p>
                    <p className="text-sm">
                      {language === 'ar' ? 'اللوحة:' : 'License Plate:'}{' '}
                      {activeVehicle.license_plate || '-'}
                    </p>
                    <p className="text-sm">
                      VIN: {activeVehicle.vin || '-'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'الفئة' : 'Category'}
                    </p>
                    <p className="text-sm font-medium">
                      {activeVehicle.category || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'السعر / يوم' : 'Price / Day'}
                    </p>
                    <p className="text-sm font-medium">
                      {activeVehicle.price_per_day
                        ? `${activeVehicle.price_per_day} ${activeVehicle.currency_code || 'ILS'}`
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'السعر / أسبوع' : 'Price / Week'}
                    </p>
                    <p className="text-sm font-medium">
                      {activeVehicle.price_per_week
                        ? `${activeVehicle.price_per_week} ${activeVehicle.currency_code || 'ILS'}`
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'السعر / شهر' : 'Price / Monthly'}
                    </p>
                    <p className="text-sm font-medium">
                      {activeVehicle.price_per_month
                        ? `${activeVehicle.price_per_month} ${activeVehicle.currency_code || 'ILS'}`
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'السعر / سنة' : 'Price / Year'}
                    </p>
                    <p className="text-sm font-medium">
                      {activeVehicle.price_per_year
                        ? `${activeVehicle.price_per_year} ${activeVehicle.currency_code || 'ILS'}`
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'العملة' : 'Currency'}
                    </p>
                    <p className="text-sm font-medium">
                      {activeVehicle.currency || activeVehicle.currency_code || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'الغرامة / يوم' : 'late fee / Day'}
                    </p>
                    <p className="text-sm font-medium">
                      {activeVehicle.late_fee_day
                        ? `${activeVehicle.late_fee_day} ${activeVehicle.currency_code || 'ILS'}`
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'ناقل الحركة' : 'Transmission'}
                    </p>
                    <p className="text-sm">
                      {activeVehicle.transmission || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'نوع الوقود' : 'Fuel Type'}
                    </p>
                    <p className="text-sm">
                      {activeVehicle.fuel_type || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'المسافة المقطوعة' : 'Mileage'}
                    </p>
                    <p className="text-sm">
                      {activeVehicle.mileage ? `${activeVehicle.mileage} km` : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      {language === 'ar' ? 'تاريخ الإضافة' : 'Created At'}
                    </p>
                    <p className="text-sm">
                      {activeVehicle.created_at
                        ? moment(activeVehicle.created_at)
                            .locale(language)
                            .format('DD MMM YYYY, hh:mm A')
                        : '-'}
                    </p>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </ModalFooter>
            </>
          )
        }
      </ModalContent>
    </Modal>
  );
};