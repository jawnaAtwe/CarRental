import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Avatar,
  Divider,
} from '@heroui/react';
import moment from 'moment';
import { VehicleDB, VehicleMaintenance } from '../types';

interface Props {
  language: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  activeVehicle: VehicleDB | null;
  vehicleMaintenances: VehicleMaintenance[];
  onEditMaintenance: (maintenance: VehicleMaintenance) => void;
}

export const VehicleViewModal = ({
  language,
  isOpen,
  onOpenChange,
  onClose,
  activeVehicle,
  vehicleMaintenances,
  onEditMaintenance,
}: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      backdrop="blur"
    >
      <ModalContent className="bg-content1/95">
        {() =>
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

              <ModalBody className="space-y-4 max-h-[70vh] overflow-y-auto">
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

                {vehicleMaintenances.length > 0 ? (
                  <div className="space-y-3">
                    {vehicleMaintenances.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-content2/50 rounded-lg border border-border flex justify-between items-start"
                      >
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-sm">
                            {m.title || m.maintenance_type}
                          </p>
                          <div className="text-xs text-foreground/70 space-y-1">
                            {m.start_date && (
                              <p>
                                📅 {language === 'ar' ? 'من:' : 'From:'} {m.start_date}
                                {m.end_date && ` ${language === 'ar' ? 'إلى:' : 'to:'} ${m.end_date}`}
                              </p>
                            )}
                            {m.odometer && <p>🛣️ {language === 'ar' ? 'المسافة:' : 'Odometer:'} {m.odometer} km</p>}
                            {m.cost && <p>💰 {language === 'ar' ? 'التكلفة:' : 'Cost:'} {m.cost}</p>}
                            {m.description && <p>📝 {m.description}</p>}
                            {m.next_due_date && <p className="text-warning">⏰ {language === 'ar' ? 'الصيانة القادمة:' : 'Next Due:'} {m.next_due_date}</p>}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => onEditMaintenance(m)}
                          >
                            {language === 'ar' ? 'تعديل' : 'Edit'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/60">
                    {language === 'ar' ? 'لا توجد صيانات سابقة' : 'No maintenance history'}
                  </p>
                )}
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