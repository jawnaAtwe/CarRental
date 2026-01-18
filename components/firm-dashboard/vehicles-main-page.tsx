'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import moment from 'moment';

import {
  Avatar,
  Button,
  Divider,
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
  Form
} from '@heroui/react';

import { 
  PencilSquareIcon, 
  PlusIcon, 
  TrashIcon, 
  InformationCircleIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { useLanguage } from '../context/LanguageContext';
import { TableSkeleton } from "@/lib/Skeletons";

// ------------------- Types -------------------

type VehicleDB = {
  id: number;
  tenant_id: number;
  branch_id?: number | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  late_fee_day?: number | null;
  trim?: string | null;
  category?: string | null;
  price_per_day: number;
  license_plate?: string | null;
  vin?: string | null;
  color?: string | null;
  image?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  mileage?: number | null;
  status: 'available' | 'rented' | 'maintenance' | 'reserved' | 'deleted';
  created_at?: string | null;
};

type VehicleForm = {
  id?: number;
  make: string;
  model: string;
  year?: number;
  late_fee_day?: number;
  trim?: string;
  category?: string;
  price_per_day: number;
  license_plate?: string;
  vin?: string;
  color?: string;
  image?: string | null;
  fuel_type?: string;
  transmission?: string;
  mileage?: number;
  status: VehicleDB['status'];
  branch_id?: number;
  tenant_id?: number;
};

interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: "user" | "customer";
  roles: string[];
  permissions: string[];
  tenantId: number;
  roleId: number;
}

// ------------------- Constants -------------------

const pageSize = 6;
const API_BASE_URL = '/api/v1/admin';

// ------------------- Component -------------------

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
  const [vehicles, setVehicles] = useState<VehicleDB[]>([]);
  const [branches, setBranches] = useState<{id: number, name: string,name_ar:string}[]>([]);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleDB['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [activeVehicle, setActiveVehicle] = useState<VehicleDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [tenants, setTenants] = useState<{id: number, name: string}[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [formData, setFormData] = useState<VehicleForm>({
    make: '',
    model: '',
    year: undefined,
    late_fee_day: undefined,
    trim: '',
    category: '',
    price_per_day: 0,
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

  const [submitError, setSubmitError] = useState<string[] | string>([]);

  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);

  // ------------------- Effects -------------------

  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (sessionLoaded && isSuperAdmin) fetchTenants();
  }, [sessionLoaded, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && user) setSelectedTenantId(user.tenantId);
  }, [user, isSuperAdmin]);


  useEffect(() => {
  const tenantIdToUse = isSuperAdmin ? selectedTenantId : user?.tenantId;

  if (!tenantIdToUse) return;

  const loadBranchesAndVehicles = async () => {
    try {
      await fetchBranches(tenantIdToUse);
      await fetchVehicles();
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

  // ------------------- Functions -------------------

  const fetchTenants = async () => {
     setTenantsLoading(true);
     try {
       const response = await fetch(`${API_BASE_URL}/tenants`, {
         headers: { 'accept-language': language, 'Content-Type': 'application/json' },
       });
       if (!response.ok) throw new Error('Failed to fetch tenants');
       const data = await response.json();
       setTenants(data.data || []);
     } catch (error) {
       console.error(error);
       addToast({
         title: language === 'ar' ? 'خطأ' : 'Error',
         description: (error as any)?.message || 'Failed to fetch tenants',
         color: 'danger'
       });
     } finally {
       setTenantsLoading(false);
     }
   };

  const fetchBranches = async (tenantId: number) => {
  setBranchesLoading(true);
  setBranchesError(null);

  try {
    const response = await fetch(
      `${API_BASE_URL}/branches?tenant_id=${tenantId}`,
      {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();
    setBranches(data.data || []);
  } catch (error: any) {
    console.error(error);
    setBranches([]);
    setBranchesError(
      language === 'ar'
        ? 'فشل تحميل الفروع'
        : 'Failed to load branches'
    );
  } finally {
    setBranchesLoading(false);
  }
   };

  const fetchVehicles = async () => {
  if (!selectedTenantId) return;

  setLoading(true);
  try {
    const params = new URLSearchParams({
      tenant_id: selectedTenantId.toString(),
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      sortBy: 'created_at',
      sortOrder: 'desc',
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(selectedBranchId !== null && { branch_id: String(selectedBranchId) }),
    });

    const response = await fetch(`${API_BASE_URL}/vehicles?${params}`, {
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));

    setVehicles(Array.isArray(data?.data) ? data.data : []);
    setTotalPages(typeof data?.totalPages === 'number' ? data.totalPages : 1);
    setTotalCount(typeof data?.count === 'number' ? data.count : 0);
  } catch (err: any) {
    console.error(err);
    setVehicles([]);
    setTotalPages(1);
    setTotalCount(0);

    addToast({
      title: language === 'ar' ? 'خطأ في جلب المركبات' : 'Error fetching vehicles',
      description: err?.message || (language==='ar'?'حدث خطأ غير متوقع':'Unexpected error'),
      color: 'danger',
    });
  } finally {
    setLoading(false);
  }
   };

  const fetchVehicleDetails = async (vehicleId: number) => {
  setLoading(true);
  try {
    const response = await fetch(
      `${API_BASE_URL}/vehicles/${vehicleId}?tenant_id=${selectedTenantId}`,
      {
        headers: { 'accept-language': language },
      }
    );

    let msg = '';
    let data: any = null;

    try {
      data = await response.json();
      msg = data?.message || '';
    } catch {
      msg = await response.text();
    }

    if (!response.ok) {
      throw new Error(msg || response.statusText);
    }

    setActiveVehicle(data);
    viewModal.onOpen();
  } catch (error: any) {
    console.error('Error fetching vehicle details:', error);
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description:
        error?.message ||
        (language === 'ar'
          ? 'خطأ في جلب بيانات المركبة'
          : 'Error fetching vehicle details'),
      color: 'danger',
    });
  } finally {
    setLoading(false);
  }
   };


 // ------------------- Vehicle Form Helpers -------------------

   const resetVehicleForm = () => {
  setFormData({
    make: '',
    model: '',
    year: undefined,
    late_fee_day:undefined,
    trim: '',
    category: '',
    price_per_day: 0,
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
    status: vehicle.status,

    branch_id: vehicle.branch_id ?? undefined,
    tenant_id: vehicle.tenant_id ?? selectedTenantId,
  });

  setActiveVehicle(vehicle);
  editModal.onOpen();
  setSubmitError([]);
   };
   const saveVehicle = async () => {
  setLoadingForm(true);
  try {
    const payload = {
      ...formData,
      tenant_id: selectedTenantId,
      branch_id: formData.branch_id ?? selectedBranchId 
    };

    const endpoint = isEditing && formData.id
      ? `${API_BASE_URL}/vehicles/${formData.id}`
      : `${API_BASE_URL}/vehicles`;

    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
      return;
    }

    addToast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: data?.message || (language === 'ar' ? 'تم حفظ المركبة بنجاح' : 'Vehicle saved successfully'),
      color: 'success'
    });

    editModal.onClose();
    resetVehicleForm();
    fetchVehicles();
  } catch (err: any) {
    console.error(err);
    setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
  } finally {
    setLoadingForm(false);
  }
   };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => { setDeleteTarget({ type, id }); deleteModal.onOpen(); };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    if (deleteTarget.type === 'single' && deleteTarget.id) await handleDeleteVehicle(deleteTarget.id);
    if (deleteTarget.type === 'bulk') await handleBulkDeleteVehicles();
    setDeleteTarget(null);
  };

  const handleDeleteVehicle = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId }),
      });
      if (!response.ok) throw new Error(await response.text());
      fetchVehicles();
      addToast({title: language==='ar'?'تم الحذف':'Deleted', description:'', color:'success'});
    } catch(err:any){console.error(err); addToast({title:'Error', description: err?.message, color:'danger'});}
    finally { setLoading(false); }
  };

  const handleBulkDeleteVehicles = async () => {
    const selectedIds = Array.from(selectedKeys).map(k=>Number(k));
    if (!selectedIds.length) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId, vehicle_ids: selectedIds }),
      });
      if (!response.ok) throw new Error(await response.text());
      setSelectedKeys(new Set());
      fetchVehicles();
      addToast({title: language==='ar'?'تم الحذف':'Deleted', description:'', color:'success'});
    } catch(err:any){console.error(err); addToast({title:'Error', description: err?.message, color:'danger'});}
    finally { setLoading(false); }
  };




 return (
  <div className="min-h-screen bg-gradient-to-b from-content2 via-content2 to-background px-4 py-8 md:px-8">
    <div className="mx-auto w-full space-y-8">

      {/* ======= Branch / Tenant Selector (Super Admin Only) ======= */}
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
      fetchBranches(tenantId).then(() => {
        fetchVehicles();
      });
    }}
    isLoading={tenantsLoading}
  >
    {tenants.map((t) => (
      <SelectItem key={t.id}>{t.name}</SelectItem>
    ))}
  </Select>
  )}

      {/* ======= Branch Selector (All Users) ======= */}
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
    // بعد اختيار الفرع، جلب المركبات مباشرة
    fetchVehicles();
  }}
  isDisabled={!selectedTenantId || branchesLoading || branches.length === 0}
  isLoading={branchesLoading}
  isRequired
>
  {branches.map((branch) => (
    <SelectItem key={branch.id}>{branch.name}</SelectItem>
  ))}
    </Select>

  {/* ======= Branch Loading/Error Handling ======= */}
  {branchesError && (
  <Alert
    title={language === 'ar' ? 'تحذير' : 'Warning'}
    description={branchesError}
    variant="flat"
    color="warning"
  />
  )}

   {/* ======= Header & Action Buttons ======= */}
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
          {/* Bulk Delete Button */}
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

          {/* Create New Vehicle Button */}
          <Button
            variant="solid"
            color="primary"
            startContent={<PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />}
            onPress={openCreateVehicle}
            className="
              relative overflow-hidden
              text-white font-extrabold tracking-wide
              rounded-3xl
              px-6 py-3
              bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500
              shadow-xl
              transition-all duration-500
              transform hover:scale-110 hover:shadow-2xl
              before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full
              before:bg-white/30 before:rotate-12 before:transition-all before:duration-500
              hover:before:w-[200%]
            "
          >
            <span className="relative animate-gradient-text bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
              {language === 'ar' ? 'مركبة جديدة' : 'New Vehicle'}
            </span>
          </Button>
        </div>
      </section>

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

      {/* ======= Vehicles Table ======= */}
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
  className="
    group
    bg-white/90 dark:bg-gray-800/90
    rounded-xl
    shadow-md dark:shadow-gray-700/50
    transition-all duration-300
    hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl
    text-gray-900 dark:text-gray-200
    hover:text-gray-900 dark:hover:text-gray-100
  "
>
  <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                <TableCell>{vehicle.category}</TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  <Button isIconOnly radius="full" variant="flat" color="default" onPress={() => fetchVehicleDetails(vehicle.id)}>
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

      {/* ======= Vehicle Edit / Create Modal ======= */}
      <Modal
  isOpen={viewModal.isOpen}
  onOpenChange={viewModal.onOpenChange}
  size="lg"
  backdrop="blur"
>
  <ModalContent className="bg-content1/95">
    {() =>
      activeVehicle && (
        <>
          {/* Header */}
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

          {/* Body */}
          <ModalBody className="space-y-4">
            <Divider />

            {/* Basic Info */}
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
            {/* Grid Info */}
            <div className="grid grid-cols-3 gap-4">

  {/* CATEGORY */}
  <div>
    <p className="text-xs uppercase tracking-wide text-foreground/60">
      {language === 'ar' ? 'الفئة' : 'Category'}
    </p>
    <p className="text-sm font-medium">
      {activeVehicle.category || '-'}
    </p>
  </div>

  {/* PRICE */}
  <div>
    <p className="text-xs uppercase tracking-wide text-foreground/60">
      {language === 'ar' ? 'السعر / يوم' : 'Price / Day'}
    </p>
    <p className="text-sm font-medium">
      {activeVehicle.price_per_day
        ? `${activeVehicle.price_per_day} ₪`
        : '-'}
    </p>
  </div>
 <div>
    <p className="text-xs uppercase tracking-wide text-foreground/60">
      {language === 'ar' ? 'الغرامة / يوم' : 'late fee / Day'}
    </p>
    <p className="text-sm font-medium">
      {activeVehicle.late_fee_day
        ? `${activeVehicle.late_fee_day} ₪`
        : '-'}
    </p>
  </div>
  {/* TRANSMISSION */}
  <div>
    <p className="text-xs uppercase tracking-wide text-foreground/60">
      {language === 'ar' ? 'ناقل الحركة' : 'Transmission'}
    </p>
    <p className="text-sm">
      {activeVehicle.transmission || '-'}
    </p>
  </div>

  {/* FUEL */}
  <div>
    <p className="text-xs uppercase tracking-wide text-foreground/60">
      {language === 'ar' ? 'نوع الوقود' : 'Fuel Type'}
    </p>
    <p className="text-sm">
      {activeVehicle.fuel_type || '-'}
    </p>
  </div>

  {/* MILEAGE */}
  <div>
    <p className="text-xs uppercase tracking-wide text-foreground/60">
      {language === 'ar' ? 'المسافة المقطوعة' : 'Mileage'}
    </p>
    <p className="text-sm">
      {activeVehicle.mileage ? `${activeVehicle.mileage} km` : '-'}
    </p>
  </div>

  {/* CREATED AT */}
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

          {/* Footer */}
          <ModalFooter>
            <Button variant="light" onPress={viewModal.onClose}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </ModalFooter>
        </>
      )
    }
  </ModalContent>
</Modal>

      <Modal isDismissable={false} isOpen={editModal.isOpen} onOpenChange={editModal.onOpenChange} size="xl" scrollBehavior="inside" backdrop="blur">
        <ModalContent className="bg-content1/95">
          {(onClose) => (
            <Form onSubmit={(e: any) => { e.preventDefault(); saveVehicle(); }} className="w-full">
              <ModalHeader className="flex items-center gap-3 text-xl font-semibold">
                {isEditing ? (language==='ar'?'تعديل المركبة':'Edit Vehicle') : (language==='ar'?'إنشاء مركبة جديدة':'Create New Vehicle')}
              </ModalHeader>
             <ModalBody className="space-y-4">
  {submitError &&
    ((Array.isArray(submitError) && submitError.length > 0) ||
      (typeof submitError === "string" && submitError.trim() !== "")) && (
      <Alert
        title={
          isEditing
            ? language === "ar"
              ? "فشل الحفظ"
              : "Save Failed"
            : language === "ar"
            ? "فشل الإنشاء"
            : "Create Failed"
        }
        description={
          <ul className="list-disc list-inside">
            {Array.isArray(submitError)
              ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
              : <li>{submitError}</li>}
          </ul>
        }
        variant="flat"
        color="danger"
        className="mb-4"
      />
    )}

  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

  {/* ===== BASIC INFO ===== */}
  <Input
    label={language === "ar" ? "الماركة" : "Make"}
    value={formData.make}
    onChange={e => setFormData(p => ({ ...p, make: e.target.value }))}
    isRequired
  />

  <Input
    label={language === "ar" ? "الموديل" : "Model"}
    value={formData.model}
    onChange={e => setFormData(p => ({ ...p, model: e.target.value }))}
    isRequired
  />

  <Input
    label={language === "ar" ? "سنة الصنع" : "Year"}
    type="number"
    value={formData.year?.toString() || ""}
    onChange={e =>
      setFormData(p => ({
        ...p,
        year: e.target.value === "" ? undefined : Number(e.target.value),
      }))
    }
    isRequired
  />
  <Input
    label={language === "ar" ? "غرامة كل يوم " : "Late Fee Per Day"}
    type="number"
    value={formData.late_fee_day?.toString() || ""}
    onChange={e =>
      setFormData(p => ({
        ...p,
        late_fee_day: e.target.value === "" ? undefined : Number(e.target.value),
      }))
    }
  />
{/* ===== BRANCH ===== */}
<Select
  label={language === "ar" ? "الفرع" : "Branch"}
  selectedKeys={formData.branch_id ? [formData.branch_id.toString()] : []}
  onChange={e =>
    setFormData(p => ({ ...p, branch_id: Number(e.target.value) }))
  }
  isRequired
>
  {branches.map(branch => (
    <SelectItem key={branch.id.toString()}>
      {language === "ar" ? branch.name_ar : branch.name}
    </SelectItem>
  ))}
</Select>

  {/* ===== CATEGORY / IDENTIFIERS ===== */}
  <Select
    label={language === "ar" ? "الفئة" : "Category"}
    selectedKeys={formData.category ? [formData.category] : []}
    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
    isRequired
  >
    <SelectItem key="Economy">{language === "ar" ? "اقتصادي" : "Economy"}</SelectItem>
    <SelectItem key="SUV">{language === "ar" ? "دفع رباعي" : "SUV"}</SelectItem>
    <SelectItem key="Luxury">{language === "ar" ? "فاخر" : "Luxury"}</SelectItem>
    <SelectItem key="Convertible">{language === "ar" ? "قابل للتحويل" : "Convertible"}</SelectItem>
    <SelectItem key="Van">{language === "ar" ? "فان" : "Van"}</SelectItem>
  </Select>

  <Input
    label={language === "ar" ? "لوحة المركبة" : "License Plate"}
    value={formData.license_plate || ""}
    onChange={e => setFormData(p => ({ ...p, license_plate: e.target.value }))}
  />

  <Input
    label="VIN"
    value={formData.vin || ""}
    onChange={e => setFormData(p => ({ ...p, vin: e.target.value }))}
  />

  {/* ===== APPEARANCE ===== */}
  <Input
    label={language === "ar" ? "اللون" : "Color"}
    value={formData.color || ""}
    onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
  />

  <Input
    label={language === "ar" ? "Trim" : "Trim"}
    value={formData.trim || ""}
    onChange={e => setFormData(p => ({ ...p, trim: e.target.value }))}
  />

  <Input
    label={language === "ar" ? "سعر الإيجار باليوم" : "Price Per Day"}
    type="number"
    value={formData.price_per_day.toString()}
    onChange={e =>
      setFormData(p => ({ ...p, price_per_day: Number(e.target.value) }))
    }
    isRequired
  />

  {/* ===== TECHNICAL ===== */}
  <Input
    label={language === "ar" ? "نوع الوقود" : "Fuel Type"}
    value={formData.fuel_type || ""}
    onChange={e => setFormData(p => ({ ...p, fuel_type: e.target.value }))}
  />

  <Input
    label={language === "ar" ? "ناقل الحركة" : "Transmission"}
    value={formData.transmission || ""}
    onChange={e => setFormData(p => ({ ...p, transmission: e.target.value }))}
  />

  <Input
    label={language === "ar" ? "عدد الكيلومترات" : "Mileage"}
    type="number"
    value={formData.mileage?.toString() || ""}
    onChange={e =>
      setFormData(p => ({
        ...p,
        mileage: e.target.value === "" ? undefined : Number(e.target.value),
      }))
    }
  />

  {/* ===== IMAGE (FULL WIDTH) ===== */}
  <div className="sm:col-span-2 lg:col-span-3">
    <label className="block text-sm font-medium text-foreground/70">
      {language === "ar" ? "صورة المركبة" : "Vehicle Image"}
    </label>

  {/* FILE INPUT (hidden) */}
  <input
    id="vehicle-image-input"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setFormData(p => ({
          ...p,
          image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);

      e.target.value = "";
    }}
  />

  {/* PREVIEW + ACTIONS */}
  <div className="mt-2 flex items-center gap-4">
    {/* IMAGE PREVIEW */}
    {formData?.image ? (
      <img
        src={formData.image as string}
        alt="Preview"
        className="h-24 w-24 object-cover rounded-md border"
      />
    ) : (
      <div className="h-24 w-24 flex items-center justify-center rounded-md border border-dashed text-xs text-foreground/50">
        {language === "ar" ? "لا توجد صورة" : "No Image"}
      </div>
    )}

    {/* BUTTONS */}
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        color="primary"
        variant="flat"
        onPress={() =>
          document.getElementById("vehicle-image-input")?.click()
        }
      >
        {language === "ar" ? "اختيار صورة" : "Choose Image"}
      </Button>

      {formData?.image && (
        <Button
          size="sm"
          color="danger"
          variant="flat"
          onPress={() =>
            setFormData(p => ({ ...p, image: null }))
          }
        >
          {language === "ar" ? "حذف الصورة" : "Remove"}
        </Button>
      )}
    </div>
     {/* ===== STATUS (EDIT ONLY) ===== */}
    {isEditing && (
                  <Select label={language==='ar'?'الحالة':'Status'} selectedKeys={[formData.status]} 
                    onChange={(e) =>
                          setFormData((prev: any) => ({ ...prev, status: e.target.value }))
                        }>
                    <SelectItem key="available">{language==='ar'?'متاحة':'Available'}</SelectItem>
                    <SelectItem key="maintenance">{language==='ar'?'صيانة':'Maintenance'}</SelectItem>
                    <SelectItem key="rented">{language==='ar'?'مستأجرة':'Rented'}</SelectItem>
                  </Select>
                )}
  </div>

  </div>

 </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => { onClose(); resetVehicleForm(); }}>{language==='ar'?'إلغاء':'Cancel'}</Button>
                <Button color="primary" type="submit" isLoading={loadingForm}>{language==='ar'?'حفظ':'Save'}</Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </div>
    
  </div>
);

}
