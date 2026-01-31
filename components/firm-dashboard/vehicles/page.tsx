// pages/VehiclesPage.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  addToast,
  Alert,
} from '@heroui/react';

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';

import { useLanguage } from '../../context/LanguageContext';
import { TableSkeleton } from '@/lib/Skeletons';

// Hooks
import { useTenants } from './hooks/useTenants';
import { useBranches } from './hooks/useBranches';
import { useVehicles } from './hooks/useVehicles';
import { useVehicleSave } from './hooks/useVehicleSave';
import { useVehicleDelete } from './hooks/useVehicleDelete';

// Components
import { VehicleFormModal } from './components/VehicleFormModal';
import { VehicleDetailsModal } from './components/VehicleViewModal';

// Types & Constants
import { VehicleForm, VehicleDB, SessionUser, VehicleStatus } from './types/vehicle.types';
import { VEHICLE_STATUSES } from './constants/vehicle.constants';

export default function VehiclesPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;

  // States
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const [activeVehicle, setActiveVehicle] = useState<VehicleDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<VehicleForm>({
    make: '',
    model: '',
    year: undefined,
    late_fee_day: undefined,
    late_fee_hour: undefined,
    trim: '',
    category: '',
    price_per_day: 0,
    price_per_hour: 0,
    price_per_week: undefined,
    price_per_month: undefined,
    price_per_year: undefined,
    license_plate: '',
    vin: '',
    color: '',
    image: '',
    fuel_type: '',
    transmission: '',
    mileage: undefined,
    status: 'available',
    branch_id: undefined,
  });

  // Hooks
  const { tenants, tenantsLoading, tenantCurrency, fetchTenants, fetchTenantCurrency } =
    useTenants();
  const { branches, branchesLoading, branchesError, fetchBranches, clearBranches } =
    useBranches();
  const { vehicles, loading, totalPages, totalCount, fetchVehicles, fetchVehicleDetails } =
    useVehicles();
  const { loadingForm, submitError, setSubmitError, saveVehicle } = useVehicleSave();
  const { loading: deleteLoading, deleteVehicle, bulkDeleteVehicles } = useVehicleDelete();

  // Modals
  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'bulk';
    id?: number;
  } | null>(null);

  // Effects
  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (sessionLoaded && isSuperAdmin) {
      fetchTenants(language);
    }
  }, [sessionLoaded, isSuperAdmin, language]);

  useEffect(() => {
    if (!isSuperAdmin && user?.tenantId) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user, isSuperAdmin]);

  // ⭐ Auto-load tenant currency for non-admin users
  useEffect(() => {
    if (!sessionLoaded) return;
    if (isSuperAdmin) return;
    if (!user?.tenantId) return;

    handleTenantChange(user.tenantId);
  }, [sessionLoaded, isSuperAdmin, user?.tenantId]);

  useEffect(() => {
    const tenantIdToUse = isSuperAdmin ? selectedTenantId : user?.tenantId;

    if (!tenantIdToUse) return;

    const loadBranchesAndVehicles = async () => {
      try {
        await fetchBranches(tenantIdToUse, language);
        await fetchVehicles(
          tenantIdToUse,
          page,
          search,
          statusFilter,
          selectedBranchId,
          language
        );
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadBranchesAndVehicles();
  }, [language, page, search, statusFilter, sessionLoaded, selectedTenantId, selectedBranchId]);

  // Handlers
  const handleTenantChange = async (tenantId: number) => {
    setSelectedTenantId(tenantId);
    setSelectedBranchId(null);
    clearBranches();

    // ⭐ جلب العملة من التينانت
    await fetchTenantCurrency(tenantId, language);

    await fetchBranches(tenantId, language);
    await fetchVehicles(tenantId, page, search, statusFilter, null, language);
  };

  const handleBranchChange = async (branchId: string) => {
    const id = Number(branchId);
    setSelectedBranchId(id);

    if (selectedTenantId) {
      await fetchVehicles(selectedTenantId, page, search, statusFilter, id, language);
    }
  };

  const resetVehicleForm = () => {
    setFormData({
      make: '',
      model: '',
      year: undefined,
      late_fee_day: undefined,
      late_fee_hour: undefined,
      trim: '',
      category: '',
      price_per_hour: 0,
      price_per_day: 0,
      price_per_week: undefined,
      price_per_month: undefined,
      price_per_year: undefined,
      license_plate: '',
      vin: '',
      color: '',
      image: '',
      fuel_type: '',
      transmission: '',
      mileage: undefined,
      status: 'available',
      branch_id: undefined,
    });
    setSubmitError([]);
  };

  const openCreateVehicle = () => {
    if (branches.length === 0) {
      addToast({
        title: language === 'ar' ? 'تحذير' : 'Warning',
        description:
          language === 'ar'
            ? 'لا يمكن إضافة مركبة. يرجى التأكد من تحميل الفروع أولاً'
            : 'Cannot add vehicle. Please ensure branches are loaded first',
        color: 'warning',
      });
      return;
    }

    setIsEditing(false);
    resetVehicleForm();
    setActiveVehicle(null);
    editModal.onOpen();
  };

  const openEditVehicle = (vehicle: VehicleDB) => {
    setIsEditing(true);

    setFormData({
      id: vehicle.id,
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year ?? undefined,
      late_fee_day: vehicle.late_fee_day ?? undefined,
       late_fee_hour: vehicle.late_fee_hour ?? undefined,
      trim: vehicle.trim ?? undefined,
      category: vehicle.category ?? undefined,
      license_plate: vehicle.license_plate ?? undefined,
      vin: vehicle.vin ?? undefined,
      color: vehicle.color ?? undefined,
      image: vehicle.image ?? undefined,
      fuel_type: vehicle.fuel_type ?? undefined,
      transmission: vehicle.transmission ?? undefined,
      mileage: vehicle.mileage ?? undefined,
      price_per_hour: vehicle.price_per_hour,
      price_per_day: vehicle.price_per_day,
      price_per_week: vehicle.price_per_week ?? undefined,
      price_per_month: vehicle.price_per_month ?? undefined,
      price_per_year: vehicle.price_per_year ?? undefined,
      status: vehicle.status,
      branch_id: vehicle.branch_id ?? undefined,
    });

    setActiveVehicle(vehicle);
    editModal.onOpen();
    setSubmitError([]);
  };

  const handleSaveVehicle = async () => {
    // ⭐ تمرير العملة من التينانت تلقائياً
    await saveVehicle(
      formData,
      isEditing,
      selectedTenantId,
      selectedBranchId,
      tenantCurrency,
      language,
      () => {
        editModal.onClose();
        resetVehicleForm();
        if (selectedTenantId) {
          fetchVehicles(selectedTenantId, page, search, statusFilter, selectedBranchId, language);
        }
      }
    );
  };

  const handleViewVehicle = async (vehicleId: number) => {
    const vehicle = await fetchVehicleDetails(vehicleId, selectedTenantId, language);
    if (vehicle) {
      setActiveVehicle(vehicle);
      viewModal.onOpen();
    }
  };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();

    if (deleteTarget.type === 'single' && deleteTarget.id) {
      await deleteVehicle(deleteTarget.id, selectedTenantId, language, () => {
        if (selectedTenantId) {
          fetchVehicles(selectedTenantId, page, search, statusFilter, selectedBranchId, language);
        }
      });
    }

    if (deleteTarget.type === 'bulk') {
      const selectedIds = Array.from(selectedKeys).map((k) => Number(k));
      await bulkDeleteVehicles(selectedIds, selectedTenantId, language, () => {
        setSelectedKeys(new Set());
        if (selectedTenantId) {
          fetchVehicles(selectedTenantId, page, search, statusFilter, selectedBranchId, language);
        }
      });
    }

    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-content2 via-content2 to-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full space-y-8">
        {/* Tenant Selector (Super Admin Only) */}
        {isSuperAdmin && sessionLoaded && (
          <Select
            size="md"
            label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
            placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
            selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
            onChange={(e) => handleTenantChange(Number(e.target.value))}
            isLoading={tenantsLoading}
          >
            {tenants.map((t) => (
              <SelectItem key={t.id}>{t.name}</SelectItem>
            ))}
          </Select>
        )}

        {/* Branch Selector */}
        <Select
          label={language === 'ar' ? 'اختر الفرع' : 'Select Branch'}
          placeholder={
            !selectedTenantId
              ? language === 'ar'
                ? 'اختر الشركة أولاً'
                : 'Select tenant first'
              : language === 'ar'
              ? 'اختر الفرع'
              : 'Select branch'
          }
          selectedKeys={selectedBranchId ? [String(selectedBranchId)] : []}
          onChange={(e) => handleBranchChange(e.target.value)}
          isDisabled={!selectedTenantId || branchesLoading || branches.length === 0}
          isLoading={branchesLoading}
          isRequired
        >
          {branches.map((branch) => (
            <SelectItem key={branch.id}>{branch.name}</SelectItem>
          ))}
        </Select>

        {branchesError && (
          <Alert title={language === 'ar' ? 'تحذير' : 'Warning'} description={branchesError} variant="flat" color="warning" />
        )}

        {/* Header & Actions */}
        <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em]">
              {language === 'ar' ? 'إدارة المركبات' : 'VEHICLE MANAGEMENT'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text">
              {language === 'ar' ? 'المركبات' : 'Vehicles'}
            </h1>
          </div>

          <div className="flex gap-2">
            {selectedKeys.size > 0 && (
              <Button
                variant="flat"
                color="danger"
                startContent={<TrashIcon className="h-4 w-4" />}
                onPress={() => confirmDelete('bulk')}
              >
                {language === 'ar' ? `حذف (${selectedKeys.size})` : `Delete (${selectedKeys.size})`}
              </Button>
            )}

            <Button
              variant="solid"
              color="primary"
              startContent={<PlusIcon className="h-5 w-5" />}
              onPress={openCreateVehicle}
              className="bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500"
            >
              {language === 'ar' ? 'مركبة جديدة' : 'New Vehicle'}
            </Button>
          </div>
        </section>

        {/* Vehicles Table */}
        <Table
          aria-label={language === 'ar' ? 'جدول المركبات' : 'Vehicles Table'}
          classNames={{
            table: 'min-w-full text-base bg-background rounded-lg shadow-md',
          }}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            if (keys === 'all') {
              setSelectedKeys(new Set(vehicles.map((v) => String(v.id))));
            } else {
              setSelectedKeys(keys as Set<string>);
            }
          }}
          topContent={
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />}
                  placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                  variant="faded"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="min-w-[240px]"
                />

                <Select
                  startContent={<CheckBadgeIcon className="h-5 w-5 text-foreground/50" />}
                  variant="faded"
                  placeholder={language === 'ar' ? 'الحالة' : 'Status'}
                  className="min-w-[160px]"
                  selectedKeys={[statusFilter]}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setPage(1);
                  }}
                >
                  {VEHICLE_STATUSES.map((status) => (
                    <SelectItem key={status.key}>{language === 'ar' ? status.ar : status.en}</SelectItem>
                  ))}
                </Select>
              </div>

              <span className="text-sm text-foreground/60">
                {language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}
              </span>
            </div>
          }
          bottomContent={
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border-t border-border">
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
                  isDisabled={page === 1}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  isDisabled={page === totalPages}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
              <span className="text-xs text-foreground/50">
                {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <Pagination
                style={{ direction: 'ltr' }}
                page={page}
                total={totalPages}
                onChange={setPage}
                showControls
                color="primary"
                size="sm"
                isDisabled={vehicles.length === 0}
              />
            </div>
          }
        >
          <TableHeader>
            <TableColumn>{language === 'ar' ? 'المركبة' : 'Vehicle'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'الفئة' : 'Category'}</TableColumn>
            <TableColumn>{language === 'ar' ? 'سنة الصنع' : 'Year'}</TableColumn>
            <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
          </TableHeader>

          {loading ? (
            <TableBody loadingContent={<TableSkeleton rows={8} columns={8} />} isLoading={loading} emptyContent={''}>
              {[]}
            </TableBody>
          ) : (
            <TableBody
              emptyContent={vehicles.length === 0 ? (language === 'ar' ? 'لا توجد مركبات' : 'No vehicles found') : undefined}
            >
              {vehicles.map((vehicle) => (
                <TableRow
                  key={vehicle.id}
                  className="group bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02]"
                >
                  <TableCell>
                    {vehicle.make} {vehicle.model}
                  </TableCell>
                  <TableCell>{vehicle.category}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell className="flex items-center justify-end gap-2">
                    <Button isIconOnly radius="full" variant="flat" color="default" onPress={() => handleViewVehicle(vehicle.id)}>
                      <InformationCircleIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="flat"
                      color="primary"
                      size="sm"
                      startContent={<PencilSquareIcon className="h-4 w-4" />}
                      onPress={() => openEditVehicle(vehicle)}
                    >
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button
                      variant="flat"
                      color="danger"
                      size="sm"
                      startContent={<TrashIcon className="h-4 w-4" />}
                      onPress={() => confirmDelete('single', vehicle.id)}
                    >
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>

        {/* Vehicle Details Modal */}
        <VehicleDetailsModal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange} vehicle={activeVehicle} language={language} />

        {/* Vehicle Form Modal */}
        <VehicleFormModal
          isOpen={editModal.isOpen}
          onOpenChange={editModal.onOpenChange}
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          submitError={submitError}
          loadingForm={loadingForm}
          branches={branches}
          language={language}
          tenantCurrency={tenantCurrency}
          onSave={handleSaveVehicle}
          onClose={() => {
            editModal.onClose();
            resetVehicleForm();
          }}
          resetForm={resetVehicleForm}
        />

        {/* Delete Confirmation Modal */}
        <Modal isOpen={deleteModal.isOpen} onOpenChange={deleteModal.onOpenChange} backdrop="blur">
          <ModalContent className="bg-content1/95">
            {(onClose) => (
              <>
                <ModalHeader className="text-xl font-semibold text-danger">
                  {deleteTarget?.type === 'bulk'
                    ? language === 'ar'
                      ? 'حذف مركبات متعددة'
                      : 'Bulk Delete Vehicles'
                    : language === 'ar'
                    ? 'حذف المركبة'
                    : 'Delete Vehicle'}
                </ModalHeader>

                <ModalBody>
                  <p className="text-foreground/80 text-md leading-relaxed">
                    {deleteTarget?.type === 'bulk'
                      ? language === 'ar'
                        ? `هل أنت متأكد من حذف ${selectedKeys.size} مركبات؟`
                        : `Are you sure you want to delete ${selectedKeys.size} vehicles?`
                      : language === 'ar'
                      ? 'هل أنت متأكد أنك تريد حذف هذه المركبة؟'
                      : 'Are you sure you want to delete this vehicle?'}
                  </p>
                </ModalBody>

                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button color="danger" onPress={executeDelete}>
                    {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}