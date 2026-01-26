'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";

import {
  Alert,
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
import { TableSkeleton } from "@/lib/Skeletons";

// Types
import { VehicleDB, VehicleForm, SessionUser } from './types/vehicle.types';

// Hooks
import { useVehicles } from './hooks/useVehicles';
import { useBranches } from './hooks/useBranches';
import { useTenants } from './hooks/useTenants';
import { useVehicleSave } from './hooks/useVehicleSave';
import { useVehicleDelete } from './hooks/useVehicleDelete';
import { useVehicleDetails } from './hooks/useVehicleDetails';

// Components
import { VehicleViewModal } from './components/VehicleViewModal';
import { VehicleFormModal } from './components/VehicleFormModal';

export default function VehiclesPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;

  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleDB['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<VehicleForm>({
    make: '',
    model: '',
    year: undefined,
    late_fee_day: undefined,
    trim: '',
    category: '',
    price_per_day: 0,
    price_per_week: 0,
    price_per_month: 0,
    price_per_year: 0,
    currency: ''  , 
    currency_code: '', 
    license_plate: '',
    vin: '',
    color: '',
    image: '',
    fuel_type: '',
    transmission: '',
    mileage: undefined,
    status: 'available',
    branch_id: undefined,
    tenant_id: selectedTenantId,
  });

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);

  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  // Custom Hooks
  const { vehicles, loading, totalPages, totalCount, fetchVehicles } = useVehicles();
  const { branches, branchesLoading, branchesError, fetchBranches } = useBranches();
  const { tenants, tenantsLoading, fetchTenants } = useTenants();
  const { loadingForm, submitError, setSubmitError, saveVehicle } = useVehicleSave();
  const { loading: deleteLoading, handleDeleteVehicle, handleBulkDeleteVehicles } = useVehicleDelete();
  const { activeVehicle, setActiveVehicle, fetchVehicleDetails: fetchDetails } = useVehicleDetails();

  // Effects
  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (sessionLoaded && isSuperAdmin) fetchTenants(language);
  }, [sessionLoaded, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && user) setSelectedTenantId(user.tenantId);
  }, [user, isSuperAdmin]);

  useEffect(() => {
    const tenantIdToUse = isSuperAdmin ? selectedTenantId : user?.tenantId;

    if (!tenantIdToUse) return;

    const loadBranchesAndVehicles = async () => {
      try {
        await fetchBranches(tenantIdToUse, language);
        await fetchVehicles({
          selectedTenantId: tenantIdToUse,
          page,
          search,
          statusFilter,
          selectedBranchId,
          language,
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadBranchesAndVehicles();
  }, [
    language,
    page,
    search,
    statusFilter,
    sessionLoaded,
    selectedTenantId,
    selectedBranchId,
    user,
    isSuperAdmin,
  ]);

  // Handlers
  const resetVehicleForm = () => {
    setFormData({
      make: '',
      model: '',
      year: undefined,
      late_fee_day:undefined,
      trim: '',
      category: '',
      price_per_day: 0,
      price_per_week:0,
      price_per_month: 0,
      price_per_year: 0,
      currency: '',
      currency_code: '',
      license_plate: '',
      vin: '',
      color: '',
      image: '',
      fuel_type: '',
      transmission: '',
      mileage: undefined,
      status: 'available',
      branch_id: undefined,
      tenant_id: selectedTenantId,
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
      make: vehicle.make??"",
      model: vehicle.model??"",
      year: vehicle.year ?? undefined,
      late_fee_day:vehicle.late_fee_day ?? undefined,
      trim: vehicle.trim ?? undefined,
      category: vehicle.category ?? undefined,
      license_plate: vehicle.license_plate ?? undefined,
      vin: vehicle.vin ?? undefined,
      color: vehicle.color ?? undefined,
      image: vehicle.image ?? undefined,
      fuel_type: vehicle.fuel_type ?? undefined,
      transmission: vehicle.transmission ?? undefined,
      mileage: vehicle.mileage ?? undefined,
      price_per_day: vehicle.price_per_day,
      price_per_week: vehicle.price_per_week?? undefined,
      price_per_month: vehicle.price_per_month?? undefined,
      price_per_year: vehicle.price_per_year?? undefined,
      currency: vehicle.currency??"",    
      currency_code: vehicle.currency_code??"",   
      status: vehicle.status,
      branch_id: vehicle.branch_id ?? undefined,
      tenant_id: vehicle.tenant_id ?? selectedTenantId,
    });

    setActiveVehicle(vehicle);
    editModal.onOpen();
    setSubmitError([]);
  };

  const handleSaveVehicle = async () => {
    await saveVehicle(
      formData,
      isEditing,
      selectedTenantId,
      selectedBranchId,
      language,
      () => {
        editModal.onClose();
        resetVehicleForm();
        fetchVehicles({
          selectedTenantId,
          page,
          search,
          statusFilter,
          selectedBranchId,
          language,
        });
      }
    );
  };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => { 
    setDeleteTarget({ type, id }); 
    deleteModal.onOpen(); 
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    
    if (deleteTarget.type === 'single' && deleteTarget.id) {
      await handleDeleteVehicle(
        deleteTarget.id,
        selectedTenantId,
        language,
        () => {
          fetchVehicles({
            selectedTenantId,
            page,
            search,
            statusFilter,
            selectedBranchId,
            language,
          });
        }
      );
    }
    
    if (deleteTarget.type === 'bulk') {
      await handleBulkDeleteVehicles(
        selectedKeys,
        selectedTenantId,
        language,
        () => {
          setSelectedKeys(new Set());
          fetchVehicles({
            selectedTenantId,
            page,
            search,
            statusFilter,
            selectedBranchId,
            language,
          });
        }
      );
    }
    
    setDeleteTarget(null);
  };

  const handleFetchVehicleDetails = async (vehicleId: number) => {
    await fetchDetails(
      vehicleId,
      selectedTenantId,
      language,
      () => {
        viewModal.onOpen();
      }
    );
  };

return (
  <div className="min-h-screen bg-gradient-to-b from-content2 via-content2 to-background px-4 py-8 md:px-8">
    <div className="mx-auto w-full space-y-8">

      {/* Tenant Selector (Super Admin) */}
      {isSuperAdmin && sessionLoaded && (
        <Select
          size="md"
          label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
          onChange={(e) => {
            const tenantId = Number(e.target.value);
            setSelectedTenantId(tenantId);
            setSelectedBranchId(null); 
            fetchBranches(tenantId, language).then(() => {
              fetchVehicles({
                selectedTenantId: tenantId,
                page,
                search,
                statusFilter,
                selectedBranchId: null,
                language,
              });
            });
          }}
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
        onChange={(e) => {
          const branchId = Number(e.target.value);
          setSelectedBranchId(branchId);
          fetchVehicles({
            selectedTenantId,
            page,
            search,
            statusFilter,
            selectedBranchId: branchId,
            language,
          });
        }}
        isDisabled={!selectedTenantId || branchesLoading || branches.length === 0}
        isLoading={branchesLoading}
        isRequired
      >
        {branches.map((branch) => (
          <SelectItem key={branch.id}>{branch.name}</SelectItem>
        ))}
      </Select>

      {branchesError && (
        <Alert
          title={language === 'ar' ? 'تحذير' : 'Warning'}
          description={branchesError}
          variant="flat"
          color="warning"
        />
      )}

      {/* Header */}
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
            startContent={<PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />}
            onPress={openCreateVehicle}
            className="relative overflow-hidden text-white font-extrabold tracking-wide rounded-3xl px-6 py-3 bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500 shadow-xl transition-all duration-500 transform hover:scale-110 hover:shadow-2xl before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full before:bg-white/30 before:rotate-12 before:transition-all before:duration-500 hover:before:w-[200%]"
          >
            <span className="relative animate-gradient-text bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
              {language === 'ar' ? 'مركبة جديدة' : 'New Vehicle'}
            </span>
          </Button>
        </div>
      </section>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onOpenChange={deleteModal.onOpenChange}
        backdrop="blur"
      >
        <ModalContent className="bg-content1/95">
          {(onClose) => (
            <>
              <ModalHeader className="text-xl font-semibold text-danger">
                {deleteTarget?.type === 'bulk'
                  ? (language === 'ar' ? 'حذف مركبات متعددة' : 'Bulk Delete Vehicles')
                  : (language === 'ar' ? 'حذف المركبة' : 'Delete Vehicle')
                }
              </ModalHeader>

              <ModalBody>
                {submitError &&
                  ((Array.isArray(submitError) && submitError.length > 0) ||
                    (typeof submitError === 'string' && submitError.trim() !== '')) && (
                    <Alert
                      title={isEditing 
                        ? (language === 'ar' ? 'فشل الحفظ' : 'Save Failed')
                        : (language === 'ar' ? 'فشل الإنشاء' : 'Create Failed')
                      }
                      description={
                        <ul className="list-disc list-inside">
                          {Array.isArray(submitError)
                            ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
                            : <p>{submitError}</p>}
                        </ul>
                      }
                      variant="flat"
                      color="danger"
                      className="mb-4"
                    />
                  )}

                <p className="text-foreground/80 text-md leading-relaxed">
                  {deleteTarget?.type === 'bulk'
                    ? (language === 'ar'
                        ? `هل أنت متأكد من حذف ${selectedKeys.size} مركبات؟`
                        : `Are you sure you want to delete ${selectedKeys.size} vehicles?`)
                    : (language === 'ar'
                        ? 'هل أنت متأكد أنك تريد حذف هذه المركبة؟'
                        : 'Are you sure you want to delete this vehicle?')
                  }
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

      {/* Vehicles Table */}
      <Table
        aria-label={language === 'ar' ? 'جدول المركبات' : 'Vehicles Table'}
        classNames={{
          table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300',
        }}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => {
          if (keys === "all") {
            setSelectedKeys(new Set(vehicles.map(v => String(v.id))));
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
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="min-w-[240px] transition-all duration-200 focus:shadow-md focus:border-primary"
              />

              <Select
                startContent={<CheckBadgeIcon className="h-5 w-5 text-foreground/50" />}
                variant="faded"
                placeholder={language === 'ar' ? 'الحالة' : 'Status'}
                className="min-w-[160px] transition-all duration-200 focus:shadow-md focus:border-primary"
                selectedKeys={[statusFilter]}
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              >
                <SelectItem key="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                <SelectItem key="available">{language === 'ar' ? 'متاحة' : 'Available'}</SelectItem>
                <SelectItem key="maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</SelectItem>
                <SelectItem key="rented">{language === 'ar' ? 'مستأجرة' : 'Rented'}</SelectItem>
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
              <Button size="sm" variant="flat" className="transition-transform duration-200 hover:scale-105" onPress={() => setPage(prev => Math.max(prev - 1, 1))} isDisabled={page === 1}>
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              <Button size="sm" variant="flat" className="transition-transform duration-200 hover:scale-105" onPress={() => setPage(prev => Math.min(prev + 1, totalPages))} isDisabled={page === totalPages}>
                {language === 'ar' ? 'التالي' : 'Next'}
              </Button>
            </div>
            <span className="text-xs text-foreground/50">
              {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <Pagination style={{ direction: 'ltr' }} page={page} total={totalPages} onChange={setPage} showControls color="primary" size="sm" isDisabled={vehicles.length === 0}/>
          </div>
        }
      >
        <TableHeader>
          <TableColumn>{language==='ar'?'المركبة':'Vehicle'}</TableColumn>
          <TableColumn>{language==='ar'?'الفئة':'Category'}</TableColumn>
          <TableColumn>{language==='ar'?'سنة الصنع':'Year'}</TableColumn>
          <TableColumn className="text-end">{language==='ar'?'الإجراءات':'Actions'}</TableColumn>
        </TableHeader>

        {loading ? (
          <TableBody loadingContent={<TableSkeleton rows={8} columns={8}/>} isLoading={loading} emptyContent={""}>{[]}</TableBody>
        ) : (
          <TableBody
            emptyContent={vehicles.length === 0 ? (language==='ar'?'لا توجد مركبات':'No vehicles found') : undefined}
          >
            {vehicles.map(vehicle => (
              <TableRow
                key={vehicle.id}
                className="group bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md dark:shadow-gray-700/50 transition-all duration-300 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl text-gray-900 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                <TableCell>{vehicle.category}</TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  <Button isIconOnly radius="full" variant="flat" color="default" onPress={() => handleFetchVehicleDetails(vehicle.id)}>
                    <InformationCircleIcon className="h-5 w-5"/>
                  </Button>
                  <Button variant="flat" color="primary" size="sm" startContent={<PencilSquareIcon className="h-4 w-4"/>} onPress={() => openEditVehicle(vehicle)}>
                    {language==='ar'?'تعديل':'Edit'}
                  </Button>
                  <Button variant="flat" color="danger" size="sm" startContent={<TrashIcon className="h-4 w-4"/>} onPress={() => confirmDelete('single', vehicle.id)}>
                    {language==='ar'?'حذف':'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      {/* View Modal */}
      <VehicleViewModal
        isOpen={viewModal.isOpen}
        onOpenChange={viewModal.onOpenChange}
        activeVehicle={activeVehicle}
        language={language}
      />

      {/* Form Modal */}
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
        onSave={handleSaveVehicle}
        onClose={editModal.onClose}
        resetForm={resetVehicleForm}
      />
    </div>
  </div>
);
}