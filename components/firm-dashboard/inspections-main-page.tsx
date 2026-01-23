'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import moment from 'moment';

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
  Form,
} from '@heroui/react';

import { 
  PencilSquareIcon, 
  PlusIcon, 
  TrashIcon, 
  InformationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/solid';

import { useLanguage } from '../context/LanguageContext';
import { TableSkeleton } from "@/lib/Skeletons";

// ------------------- Types -------------------

type InspectionDB = {
  id: number;
  booking_id: number;
  vehicle_id: number;
   vehicle_name: string;
  inspection_type: 'pre_rental' | 'post_rental';
  inspection_date: string;
  inspected_by?: number | null;
  odometer?: number | null;
  fuel_level?: number | null;
  checklist_results?: any | null;
  notes?: string | null;
  status: 'pending' | 'completed' ;
  created_at?: string;
  updated_at?: string;
  inspected_by_name_ar?:string;
  inspected_by_name?:string;
  customer_name?:string;
};

type InspectionForm = {
  id?: number;
  booking_id: number;
  vehicle_id: number;
   vehicle_name: string;
  inspection_type: 'pre_rental' | 'post_rental';
  inspection_date?: string;
  inspected_by?: number;
  odometer?: number;
  fuel_level?: number;
  checklist_results?: any;
  notes?: string;
  status: InspectionDB['status'];
  inspected_by_name_ar?:string;
  inspected_by_name?:string;
  tenant_id?:number;
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

export default function InspectionsPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;
  
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
      !isSuperAdmin ? user?.tenantId : undefined
    );
  // ------------------- States -------------------
  const [inspections, setInspections] = useState<InspectionDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [bookings, setBookings] = useState<{ id: number; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; name: string }[]>([]);

  const [activeInspection, setActiveInspection] = useState<InspectionDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<InspectionForm>({
    booking_id: 0,
    vehicle_id: 0,
    inspection_type: 'pre_rental',
    vehicle_name: '',
    status: 'pending',
    tenant_id: selectedTenantId,
  });
  const [submitError, setSubmitError] = useState<string[] | string>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [tenants, setTenants] = useState<{id: number, name: string}[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  // ------------------- Effects -------------------

  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
  if (sessionLoaded && isSuperAdmin) fetchTenants();
  }, [sessionLoaded, isSuperAdmin]);

  useEffect(() => {
  if (!isSuperAdmin && user) {
    setSelectedTenantId(user.tenantId);
  }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    if (editModal.isOpen && user) {
      fetchBookings();
      fetchVehicles();
    }
  }, [editModal.isOpen, user]);

   useEffect(() => {
    if (!isSuperAdmin && user?.tenantId) {
    fetchInspections();
     }
    if (isSuperAdmin && selectedTenantId !== undefined) {
    fetchInspections();
    }
    }, [language, page, search, statusFilter, sessionLoaded, selectedTenantId, user, isSuperAdmin]);
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

  const fetchBookings = async () => {
  try {
    if (!user) return;

    const res = await fetch(`${API_BASE_URL}/bookings?tenant_id=${selectedTenantId}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const result = await res.json();
    setBookings(result.data || []);
  } catch (err) {
    console.error(err);
    addToast({ title: 'Error', description: 'Failed to fetch bookings', color: 'danger' });
  }
};
  const fetchVehicles = async () => {
  try {
    if (!user) return;

    const res = await fetch(`${API_BASE_URL}/vehicles?tenant_id=${selectedTenantId}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = await res.json();
    setVehicles(result.data || []);
  } catch (err) {
    console.error("Failed to fetch vehicles:", err);
    addToast({ title: 'Error', description: 'Failed to fetch vehicles', color: 'danger' });
  }
};

const fetchInspections = async () => {
  if (!user) return;

  setLoading(true);
  try {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });

    const response = await fetch(
      `${API_BASE_URL}/inspections?tenant_id=${ selectedTenantId!.toString()}&${params}`,
      { headers: { 'accept-language': language } }
    );

    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();

    setInspections(data.data || []);
    setTotalPages(data.totalPages ?? 1);
  } catch (error: any) {
    console.error(error);
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description: error?.message || 'Failed to fetch inspections',
      color: 'danger',
    });
  } finally {
    setLoading(false);
  }
};

const fetchInspectionDetails = async (id: number) => {
  if (!user) return;

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/inspections/${id}?tenant_id=${selectedTenantId!.toString()}`, {
      headers: { 'accept-language': language },
    });

    if (!response.ok) throw new Error('Failed to fetch inspection details');

    const data = await response.json();
    const inspection = data.data;

    if (!inspection) throw new Error('Inspection not found');

    setActiveInspection(inspection);
    viewModal.onOpen();

  } catch (error: any) {
    console.error('Fetch inspection error:', error);
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description: error?.message || (language === 'ar' ? 'فشل في جلب بيانات الفحص' : 'Failed to fetch inspection'),
      color: 'danger',
    });

  } finally {
    setLoading(false);
  }
};


  const saveInspection = async () => {
    setLoadingForm(true);
    setSubmitError([]);
    try {
      const endpoint = isEditing && formData.id ? `${API_BASE_URL}/inspections/${formData.id}` : `${API_BASE_URL}/inspections`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(data?.error || 'Failed to save inspection');
        return;
      }

      addToast({ title: language === 'ar' ? 'تم الحفظ' : 'Saved', description: data?.message || '', color: 'success' });
      editModal.onClose();
      resetForm();
      fetchInspections();
    } catch (error: any) {
      console.error(error);
      setSubmitError(error?.message || 'Failed to save inspection');
    } finally {
      setLoadingForm(false);
    }
  };

  const resetForm = () => {
    setFormData({ booking_id: 0, vehicle_id: 0, inspection_type: 'pre_rental', vehicle_name: '',status: 'pending' });
    setSubmitError([]);
  };

 const openCreateInspection = async () => {
  if (!user) return addToast({ title: 'خطأ', description: 'User not loaded yet', color: 'danger' });

  setLoadingFormData(true);
  resetForm();
  setIsEditing(false);

  try {
    await Promise.all([fetchBookings(), fetchVehicles()]);
    editModal.onOpen(); 
  } catch (err) {
    console.error(err);
    addToast({ title: 'Error', description: 'Failed to load data', color: 'danger' });
  } finally {
    setLoadingFormData(false);
  }
};


  const openEditInspection = async (inspection: InspectionDB) => {
    if (!user) return addToast({ title: 'خطأ', description: 'User not loaded yet', color: 'danger' });

    setFormData({
      id: inspection.id,
      booking_id: inspection.booking_id,
      vehicle_id: inspection.vehicle_id,
       vehicle_name:inspection.vehicle_name,
      inspection_type: inspection.inspection_type,
      inspection_date: inspection.inspection_date,
      inspected_by: inspection.inspected_by ?? undefined,
      odometer: inspection.odometer ?? undefined,
      fuel_level: inspection.fuel_level ?? undefined,
      checklist_results: inspection.checklist_results ?? undefined,
      notes: inspection.notes ?? undefined,
      status: inspection.status
    });

    setIsEditing(true);
    editModal.onOpen();
  };

  const handleDeleteInspection = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/inspections/${id}`, { method: 'DELETE', headers: { 'accept-language': language } });
      let msg = '';
      try { const data = await response.json(); msg = data?.message || ''; } catch { msg = await response.text(); }
      if (!response.ok) throw new Error(msg);
      fetchInspections();
      addToast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted', description: msg, color: 'success' });
    } catch (error: any) {
      console.error(error);
      addToast({ title: language === 'ar' ? 'خطأ' : 'Error', description: error?.message || '', color: 'danger' });
    } finally { setLoading(false); }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedKeys).map(Number);
    if (ids.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/inspections`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspection_ids: ids }),
      });
      let msg = '';
      try { const data = await response.json(); msg = data?.message || ''; } catch { msg = await response.text(); }
      if (!response.ok) throw new Error(msg);
      setSelectedKeys(new Set());
      fetchInspections();
      addToast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted', description: msg, color: 'success' });
    } catch (error: any) {
      console.error(error);
      addToast({ title: language === 'ar' ? 'خطأ' : 'Error', description: error?.message || '', color: 'danger' });
    } finally { setLoading(false); }
  };

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => { setDeleteTarget({ type, id }); deleteModal.onOpen(); };
  const executeDelete = async () => { if (!deleteTarget) return; deleteModal.onClose(); if (deleteTarget.type === 'single' && deleteTarget.id) await handleDeleteInspection(deleteTarget.id); if (deleteTarget.type === 'bulk') await handleBulkDelete(); setDeleteTarget(null); };


  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto w-full space-y-8">
      {isSuperAdmin && sessionLoaded && (
        <Select
          size="md"
          label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
          selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
          onChange={(e) => setSelectedTenantId(Number(e.target.value))}
          isLoading={tenantsLoading}
        >
          {tenants.map((t) => (
            <SelectItem key={t.id}>{t.name}</SelectItem>
          ))}
        </Select>
      )}
        {/* ===== Header & Action Buttons ===== */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em]">
              {language==='ar' ? 'إدارة الفحوصات' : 'INSPECTIONS MANAGEMENT'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {language==='ar' ? 'الفحوصات' : 'Inspections'}
            </h1>
          </div>

          <div className="flex gap-2">
            {selectedKeys.size > 0 && (
              <Button 
                color="danger" 
                startContent={<TrashIcon className="h-4 w-4"/>} 
                onPress={() => confirmDelete('bulk')}
              >
                {language==='ar' ? `حذف (${selectedKeys.size})` : `Delete (${selectedKeys.size})`}
              </Button>
            )}
            <Button
              variant="solid"
              color="primary"
              startContent={
                <PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />
              }
              onPress={openCreateInspection}
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
              <span className="relative animate-gradient-text bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                {language === 'ar' ? 'فحص جديد' : 'New Inspection'}
              </span>
            </Button>
          </div>
        </section>

        {/* ===== Table ===== */}
        <Table
          aria-label={language==='ar' ? 'جدول الفحوصات' : 'Inspections table'}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
          topContent={
            <div className="flex gap-3 p-3 border-b border-border">
              <Input
                placeholder={language==='ar' ? 'بحث...' : 'Search...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                startContent={<MagnifyingGlassIcon className="h-5 w-5"/>}
              />
              <Select
                selectedKeys={[statusFilter]}
                onSelectionChange={(keys) => { setStatusFilter(Array.from(keys)[0] as any); setPage(1); }}
              >
                <SelectItem key="all">{language==='ar' ? 'الكل' : 'All'}</SelectItem>
                <SelectItem key="pending">{language==='ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                <SelectItem key="completed">{language==='ar' ? 'مكتمل' : 'Completed'}</SelectItem>
              </Select>
            </div>
          }
          bottomContent={
            <div className="flex justify-between p-3 border-t border-border">
              {/* Previous / Next Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="flat"
                  className="transition-transform duration-200 hover:scale-105"
                  onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
                  isDisabled={page === 1}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  className="transition-transform duration-200 hover:scale-105"
                  onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  isDisabled={page === totalPages}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>

              {/* Page Info */}
              <span className="text-xs text-foreground/50">
                {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>

              {/* Pagination Component */}
              <Pagination
                style={{ direction: 'ltr' }}
                page={page}
                total={totalPages}
                onChange={setPage}
                showControls
                color="primary"
                size="sm"
                isDisabled={inspections.length === 0}
              />
            </div>
          }
        >
  <TableHeader>
  <TableColumn key="id">ID</TableColumn>
  <TableColumn key="booking">
    {language === 'ar' ? 'الحجز' : 'Booking'}
  </TableColumn>
  <TableColumn key="vehicle">
    {language === 'ar' ? 'المركبة' : 'Vehicle'}
  </TableColumn>
  <TableColumn key="type">
    {language === 'ar' ? 'النوع' : 'Type'}
  </TableColumn>
  <TableColumn key="date">
    {language === 'ar' ? 'التاريخ' : 'Date'}
  </TableColumn>
  <TableColumn key="inspectedBy">
    {language === 'ar' ? 'قام بالفحص' : 'Inspected By'}
  </TableColumn>
   <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
</TableHeader>

<TableBody
  isLoading={loading}
  loadingContent={<TableSkeleton rows={8} columns={7} />}
  emptyContent={language === 'ar' ? 'لا توجد فحوصات' : 'No inspections found'}
>
  {inspections.map((ins) => (
    <TableRow key={ins.id}>
      <TableCell>{ins.id}</TableCell>
      <TableCell>{ins.booking_id}</TableCell>
      <TableCell>{ins.vehicle_name}</TableCell>
      <TableCell>{ins.inspection_type}</TableCell>
      <TableCell>
        {ins.inspection_date
          ? moment(ins.inspection_date).format('DD MMM YYYY, hh:mm A')
          : '-'}
      </TableCell>
      <TableCell>
        {language === 'ar'
          ? ins.inspected_by_name_ar || '-'
          : ins.inspected_by_name || '-'}
      </TableCell>
     <TableCell className="flex items-center justify-end gap-2">
            <Button 
              isIconOnly radius="full" variant="flat" color="default" 
              className="transition-transform duration-200 hover:scale-110 hover:bg-background/30"
              onPress={() => fetchInspectionDetails(ins.id)}
            >
              <InformationCircleIcon className="h-5 w-5" />
            </Button>
           <Button variant="flat" color="primary" size="sm" startContent={<PencilSquareIcon className="h-4 w-4" />}
              onPress={() => openEditInspection(ins)}
            >
                {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
           <Button variant="flat" color="danger" size="sm" startContent={<TrashIcon className="h-4 w-4" />} 
              onPress={() => confirmDelete('single', ins.id)}
            >  {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </TableCell>
    </TableRow>
  ))}
</TableBody>
        </Table>

        {/* ===== View Modal ===== */}
        <Modal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange} size="lg" backdrop="blur">
          <ModalContent>
            {activeInspection && (
              <>
                <ModalHeader>{language==='ar' ? 'تفاصيل الفحص' : 'Inspection Details'}</ModalHeader>
                <ModalBody className="space-y-2">
                  <p><strong>{language==='ar'?'رقم الحجز':'Booking ID'}:</strong> {activeInspection.booking_id}</p>
                  <p><strong>{language==='ar'?'رقم المركبة':'Vehicle ID'}:</strong> {activeInspection.vehicle_id}</p>
                  <p><strong>{language==='ar'?'اسم العميل':'Customer Name'}:</strong> {activeInspection.customer_name}</p>
                 
                  <p><strong>{language==='ar'?'نوع الفحص':'Inspection Type'}:</strong> {activeInspection.inspection_type}</p>
                  <p><strong>{language==='ar'?'تاريخ الفحص':'Inspection Date'}:</strong> {moment(activeInspection.inspection_date).format('DD MMM YYYY, hh:mm A')}</p>
                  <p><strong>{language==='ar'?'قام بالفحص':'Inspected By'}:</strong> {activeInspection.inspected_by ?? '-'}</p>
                  <p><strong>{language==='ar'?'عداد الكيلومترات':'Odometer'}:</strong> {activeInspection.odometer ?? '-'}</p>
                  <p><strong>{language==='ar'?'مستوى الوقود':'Fuel Level'}:</strong> {activeInspection.fuel_level != null ? `${activeInspection.fuel_level}%` : '-'}</p>
                  <p><strong>{language==='ar'?'نتائج القائمة':'Checklist Results'}:</strong></p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">
                    {activeInspection.checklist_results ? JSON.stringify(activeInspection.checklist_results, null, 2) : '-'}
                  </pre>
                  <p><strong>{language==='ar'?'ملاحظات':'Notes'}:</strong> {activeInspection.notes || '-'}</p>
                  <p><strong>{language==='ar'?'الحالة':'Status'}:</strong> {activeInspection.status}</p>
                </ModalBody>
                <ModalFooter>
                  <Button onPress={viewModal.onClose}>{language==='ar'?'إغلاق':'Close'}</Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
 {/* ===== Edit / Create Modal ===== */}
<Modal isOpen={editModal.isOpen} onOpenChange={editModal.onOpenChange} size="xl">
  <ModalContent>
    <ModalHeader>
      {isEditing 
        ? (language==='ar'?'تعديل الفحص':'Edit Inspection') 
        : (language==='ar'?'فحص جديد':'New Inspection')}
    </ModalHeader>

    {loadingFormData ? (
      <div className="flex justify-center items-center p-6">
        <p>{language==='ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
      </div>
    ) : (
      <Form onSubmit={(e)=>{ e.preventDefault(); saveInspection(); }}>
        <ModalBody className="space-y-3">
          <div className="w-full max-w-7xl mx-auto px-6 py-4 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">

              {/* Booking Select */}
              <Select
                label={language==='ar'?'الحجز':'Booking'}
                selectedKeys={[formData.booking_id?.toString() || '']}
                onSelectionChange={(keys) => {
                  const id = Number(Array.from(keys)[0]);
                  setFormData({ ...formData, booking_id: id });
                }}
              >
                {bookings.map(b => (
                  <SelectItem key={b.id.toString()}>{b.name || `Booking #${b.id}`}</SelectItem>
                ))}
              </Select>

              {/* Vehicle Select */}
              <Select
                label={language==='ar'?'المركبة':'Vehicle'}
                selectedKeys={[formData.vehicle_id?.toString() || '']}
                onSelectionChange={(keys) => {
                  const id = Number(Array.from(keys)[0]);
                  setFormData({ ...formData, vehicle_id: id });
                }}
              >
                {vehicles.map(v => (
                  <SelectItem key={v.id.toString()}>{v.name || `Vehicle #${v.id}`}</SelectItem>
                ))}
              </Select>

              {/* Fuel Level */}
              <Input
                type="number"
                label={language==='ar'?'مستوى الوقود (%)':'Fuel Level (%)'}
                value={formData.fuel_level !== undefined ? formData.fuel_level.toString() : ''}
                onChange={(e) => setFormData({...formData, fuel_level: Number(e.target.value)})}
                min={0}
                max={100}
              />

              {/* Inspection Type */}
              <Select 
                label={language==='ar'?'نوع الفحص':'Inspection Type'} 
                selectedKeys={[formData.inspection_type]} 
                onChange={(e)=>setFormData({...formData, inspection_type:e.target.value as 'pre_rental'|'post_rental'})}
              >
                <SelectItem key="pre_rental">{language==='ar'?'قبل الإيجار':'Pre Rental'}</SelectItem>
                <SelectItem key="post_rental">{language==='ar'?'بعد الإيجار':'Post Rental'}</SelectItem>
              </Select>

              {/* Inspection Date */}
          <Input 
  type="date"
  label={language==='ar' ? 'تاريخ الفحص' : 'Inspection Date'}
  value={formData.inspection_date ? moment(formData.inspection_date).format('YYYY-MM-DD') : ''}
  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
/>


              {/* Odometer */}
              <Input
                type="number"
                label={language === 'ar' ? 'عداد الكيلومترات' : 'Odometer'}
                value={formData.odometer !== undefined ? formData.odometer.toString() : ''}
                onChange={(e) =>
                  setFormData({ ...formData, odometer: Number(e.target.value) })
                }
              />

              {/* Checklist Results */}
              <Input 
                type="text" 
                label={language==='ar'?'نتائج القائمة':'Checklist Results (JSON)'} 
                value={formData.checklist_results ? JSON.stringify(formData.checklist_results) : ''} 
                onChange={(e)=>{ try{ setFormData({...formData, checklist_results:JSON.parse(e.target.value)}) }catch{} }} 
              />

              {/* Notes */}
              <Input 
                type="text" 
                label={language==='ar'?'ملاحظات':'Notes'} 
                value={formData.notes || ''} 
                onChange={(e)=>setFormData({...formData, notes:e.target.value})} 
              />

              {/* Status */}
              <Select 
                label={language==='ar'?'الحالة':'Status'} 
                selectedKeys={[formData.status]} 
                onChange={(e)=>setFormData({...formData, status:e.target.value as 'pending'|'completed'})}
              >
                <SelectItem key="pending">{language==='ar'?'قيد الانتظار':'Pending'}</SelectItem>
                <SelectItem key="completed">{language==='ar'?'مكتمل':'Completed'}</SelectItem>
              </Select>

             </div>
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
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={editModal.onClose}>{language==='ar'?'إلغاء':'Cancel'}</Button>
          <Button color="primary" type="submit" isLoading={loadingForm}>{language==='ar'?'حفظ':'Save'}</Button>
        </ModalFooter>
      </Form>
    )}
  </ModalContent>
</Modal>



     
      {/* ===== Delete Modal ===== */}
      <Modal isOpen={deleteModal.isOpen} onOpenChange={deleteModal.onOpenChange}>
        <ModalContent>
          <ModalHeader>{deleteTarget?.type==='bulk'?(language==='ar'?'حذف متعدد':'Bulk Delete'):(language==='ar'?'حذف الفحص':'Delete Inspection')}</ModalHeader>
          <ModalBody>{deleteTarget?.type==='bulk'?`هل أنت متأكد من حذف ${selectedKeys.size} فحوصات؟`:'هل أنت متأكد من حذف هذا الفحص؟'}</ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={deleteModal.onClose}>{language==='ar'?'إلغاء':'Cancel'}</Button>
            <Button color="danger" onPress={executeDelete}>{language==='ar'?'تأكيد الحذف':'Confirm Delete'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  </div>
);

}
