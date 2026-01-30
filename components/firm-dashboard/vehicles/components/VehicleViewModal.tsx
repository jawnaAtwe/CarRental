// components/VehicleDetailsModal.tsx

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

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  vehicle: VehicleDB | null;
  language: string;
}

export const VehicleDetailsModal = ({
  isOpen,
  onOpenChange,
  vehicle,
  language,
}: VehicleDetailsModalProps) => {
  if (!vehicle) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" backdrop="blur">
      <ModalContent className="bg-content1/95">
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <Avatar
                size="md"
                name={`${vehicle.make} ${vehicle.model}`}
                src={vehicle.image || ''}
              />
              <div>
                <p className="text-lg font-semibold">
                  {vehicle.make} {vehicle.model}
                </p>
                <p className="text-sm text-foreground/60">{vehicle.year || '-'}</p>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-4">
              <Divider />

              {/* Basic Info */}
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  {language === 'ar' ? 'معلومات المركبة' : 'Vehicle Information'}
                </p>
                <p className="text-sm">
                  {language === 'ar' ? 'اللوحة:' : 'License Plate:'}{' '}
                  {vehicle.license_plate || '-'}
                </p>
                <p className="text-sm">VIN: {vehicle.vin || '-'}</p>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'الفئة' : 'Category'}
                  </p>
                  <p className="text-sm font-medium">{vehicle.category || '-'}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'السعر / يوم' : 'Price / Day'}
                  </p>
                  <p className="text-sm font-medium">
                    {vehicle.price_per_day
                      ? `${vehicle.price_per_day} ${vehicle.currency_code || 'ILS'}`
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'السعر / أسبوع' : 'Price / Week'}
                  </p>
                  <p className="text-sm font-medium">
                    {vehicle.price_per_week
                      ? `${vehicle.price_per_week} ${vehicle.currency_code || 'ILS'}`
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'السعر / شهر' : 'Price / Monthly'}
                  </p>
                  <p className="text-sm font-medium">
                    {vehicle.price_per_month
                      ? `${vehicle.price_per_month} ${vehicle.currency_code || 'ILS'}`
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'السعر / سنة' : 'Price / Year'}
                  </p>
                  <p className="text-sm font-medium">
                    {vehicle.price_per_year
                      ? `${vehicle.price_per_year} ${vehicle.currency_code || 'ILS'}`
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'العملة' : 'Currency'}
                  </p>
                  <p className="text-sm font-medium">
                    {vehicle.currency || vehicle.currency_code || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'الغرامة / يوم' : 'Late Fee / Day'}
                  </p>
                  <p className="text-sm font-medium">
                    {vehicle.late_fee_day
                      ? `${vehicle.late_fee_day} ${vehicle.currency_code || 'ILS'}`
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'ناقل الحركة' : 'Transmission'}
                  </p>
                  <p className="text-sm">{vehicle.transmission || '-'}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'نوع الوقود' : 'Fuel Type'}
                  </p>
                  <p className="text-sm">{vehicle.fuel_type || '-'}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'المسافة المقطوعة' : 'Mileage'}
                  </p>
                  <p className="text-sm">
                    {vehicle.mileage ? `${vehicle.mileage} km` : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    {language === 'ar' ? 'تاريخ الإضافة' : 'Created At'}
                  </p>
                  <p className="text-sm">
                    {vehicle.created_at
                      ? moment(vehicle.created_at)
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
        )}
      </ModalContent>
    </Modal>
  );
};