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
type BookingDB = {
  id: number;
  tenant_id: number;
  branch_id?: number | null;
  customer_id: number;
  customer_name: string;
  vehicle_id: number;
  vehicle_name?: string | null;
  start_date: string;          
  end_date: string;  
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  branch_name?: string | null;   
  branch_name_ar?: string | null;
  created_at?: string | null;
};

type BookingForm = {
  id?: number;
  tenant_id?: number;
  branch_id?: number;
  customer_id?: number; 
  vehicle_id?: number;  
  start_date: string;
  vehicle_name?: string; 
  end_date: string;
  total_amount: number;
  status?: BookingDB['status']; 
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

export default function BookingsPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;

  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [Bookings, setBookings] = useState<BookingDB[]>([]);
  const [branches, setBranches] = useState<{id: number, name: string,name_ar:string}[]>([]);
  const [customers, setCustomers] = useState<{id: number, full_name: string}[]>([]);
  const [vehicles, setVehicles] = useState<{id: number, make: string, model: string}[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingDB['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [activeBooking, setActiveBooking] = useState<BookingDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [tenants, setTenants] = useState<{id: number, name: string}[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
// -------- Payment States --------
const paymentModal = useDisclosure();

const [paymentBooking, setPaymentBooking] = useState<BookingDB | null>(null);

const [paymentData, setPaymentData] = useState({
  booking_id:0,
  amount: 0,
  customer_id:0,
  payment_method: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'online',
  is_deposit: false,
  partial_amount: 0,
  late_fee: 0,
  split_details: '',
});

const [formData, setFormData] = useState<BookingForm>({
  tenant_id: selectedTenantId,
  branch_id: undefined,
  customer_id: 0,   
  vehicle_id: 0,   
  vehicle_name:'',  
  start_date: '',      
  end_date: '',        
  total_amount: 0,
  status: 'pending',   
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
  fetchCustomers();
  fetchVehicles();
  }, [selectedTenantId]);

  useEffect(() => {
  const tenantIdToUse = isSuperAdmin ? selectedTenantId : user?.tenantId;

  if (!tenantIdToUse) return;

  const loadBranchesAndVehicles = async () => {
    try {
      await fetchBranches(tenantIdToUse);
      await fetchBookings();
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
// --- Fetch customers ---
const fetchCustomers = async () => {
  if (!selectedTenantId) return;

  setLoading(true);
  try {
    const params = new URLSearchParams({
      tenant_id: selectedTenantId.toString(),
      page: '1',
      pageSize: '1000', 
    });

    const response = await fetch(`${API_BASE_URL}/customers?${params}`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });

    const data = await response.json().catch(() => ({}));
    setCustomers(Array.isArray(data?.data) ? data.data : []);
  } catch (err: any) {
    console.error(err);
    setCustomers([]);
  } finally {
    setLoading(false);
  }
};

// --- Fetch vehicles ---
const fetchVehicles = async () => {
  if (!selectedTenantId) return;

  setLoading(true);
  try {
    const params = new URLSearchParams({
      tenant_id: selectedTenantId.toString(),
      status: 'available',
      page: '1',
      pageSize: '1000',
    });

    const response = await fetch(`${API_BASE_URL}/vehicles?${params}`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });

    const data = await response.json().catch(() => ({}));
    setVehicles(Array.isArray(data?.data) ? data.data : []);
  } catch (err: any) {
    console.error(err);
    setVehicles([]);
  } finally {
    setLoading(false);
  }
};
// --- Fetch Tenants ---
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

  const fetchBookings = async () => {
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

    const response = await fetch(`${API_BASE_URL}/bookings?${params}`, {
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));

    setBookings(Array.isArray(data?.data) ? data.data : []);
    setTotalPages(typeof data?.totalPages === 'number' ? data.totalPages : 1);
    setTotalCount(typeof data?.count === 'number' ? data.count : 0);
  } catch (err: any) {
    console.error(err);
    setBookings([]);
    setTotalPages(1);
    setTotalCount(0);

    addToast({
      title: language === 'ar' ? 'خطأ في جلب الحجوزات' : 'Error fetching bookings',
      description: err?.message || (language === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error'),
      color: 'danger',
    });
  } finally {
    setLoading(false);
  }
};

  const fetchBookingDetails = async (bookingId: number) => {
  setLoading(true);
  try {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}?tenant_id=${selectedTenantId}`,
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

    setActiveBooking(data);
    viewModal.onOpen();
  } catch (error: any) {
    console.error('Error fetching booking details:', error);
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description:
        error?.message ||
        (language === 'ar'
          ? 'خطأ في جلب بيانات المركبة'
          : 'Error fetching booking details'),
      color: 'danger',
    });
  } finally {
    setLoading(false);
  }
   };


 // ------------------- Vehicle Form Helpers -------------------

   const resetBookingForm = () => {
  setFormData({
    id: undefined,             
    customer_id: undefined,     
    vehicle_id: undefined,     
    branch_id: undefined,       
    tenant_id: selectedTenantId, 
    start_date: '',            
    end_date: '',               
    total_amount: 0,         
    status: 'pending',        
  });
  setSubmitError([]);
    };
   const openPaymentModal = (booking: BookingDB) => {
  setPaymentBooking(booking);

  setPaymentData({
    booking_id:booking.id,
    customer_id:booking.customer_id,
    amount: booking.total_amount,
    payment_method: 'cash',
    is_deposit: false,
    partial_amount: 0,
    late_fee: 0,
    split_details: '',
  });

  paymentModal.onOpen();
    };
   const submitPayment = async () => {
  if (!paymentBooking) return;

  try {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept-language': language,
      },
      body: JSON.stringify({
        tenant_id:selectedTenantId,
        customer_id: paymentBooking.customer_id,
        booking_id: paymentBooking.id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        is_deposit: paymentData.is_deposit,
        partial_amount: paymentData.partial_amount,
        late_fee: paymentData.late_fee,
        split_details: paymentData.split_details,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Payment failed');
    }

    addToast({
      title: language === 'ar' ? 'تم الدفع' : 'Payment Successful',
      color: 'success',
    });

    paymentModal.onClose();
    fetchBookings();
  } catch (err: any) {
    addToast({
      title: language === 'ar' ? 'فشل الدفع' : 'Payment Failed',
      description: err.message,
      color: 'danger',
    });
  }
    };

    const openCreateBooking = () => {
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
  resetBookingForm(); 
  setActiveBooking(null);
  editModal.onOpen();
    };
    const openEditBooking = (booking: BookingDB) => {
  setIsEditing(true);
  const vehicle = vehicles.find(v => v.id === booking.vehicle_id);

  setFormData({
    id: booking.id,
    customer_id: booking.customer_id ?? undefined,
    vehicle_id: booking.vehicle_id ?? undefined,
     vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : '', 
    branch_id: booking.branch_id ?? undefined,
    tenant_id: booking.tenant_id ?? selectedTenantId,
    start_date: booking.start_date ? booking.start_date.split('T')[0] : '',
    end_date: booking.end_date ? booking.end_date.split('T')[0] : '',      
    total_amount: booking.total_amount ?? 0,
    status: booking.status ?? 'pending',
  });

  setActiveBooking(booking);
  editModal.onOpen();
  setSubmitError([]);
    };

    const saveBooking = async () => {
  setLoadingForm(true);
  try {
    const payload = {
      ...formData,
      tenant_id: selectedTenantId,
      branch_id: formData.branch_id ?? selectedBranchId,
    };

    const endpoint = isEditing && formData.id
      ? `${API_BASE_URL}/bookings/${formData.id}`
      : `${API_BASE_URL}/bookings`;

    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
      return;
    }

    addToast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: data?.message || (language === 'ar' ? 'تم حفظ الحجز بنجاح' : 'Booking saved successfully'),
      color: 'success',
    });

    editModal.onClose();
    resetBookingForm();
    fetchBookings();
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
    if (deleteTarget.type === 'single' && deleteTarget.id) await handleDeleteBooking(deleteTarget.id);
    if (deleteTarget.type === 'bulk') await handleBulkDeleteBookings();
    setDeleteTarget(null);
  };

 // حذف حجز واحد
   const handleDeleteBooking = async (id: number) => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: selectedTenantId }),
    });

    if (!response.ok) throw new Error(await response.text());

    fetchBookings();
    addToast({
      title: language === 'ar' ? 'تم الحذف' : 'Deleted',
      description: '',
      color: 'success',
    });
  } catch (err: any) {
    console.error(err);
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description: err?.message,
      color: 'danger',
    });
  } finally {
    setLoading(false);
  }
  };

   const handleBulkDeleteBookings = async () => {
  const selectedIds = Array.from(selectedKeys).map(k => Number(k));
  if (!selectedIds.length) return;

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: selectedTenantId, booking_ids: selectedIds }),
    });

    if (!response.ok) throw new Error(await response.text());

    setSelectedKeys(new Set());
    fetchBookings();
    addToast({
      title: language === 'ar' ? 'تم الحذف' : 'Deleted',
      description: '',
      color: 'success',
    });
  } catch (err: any) {
    console.error(err);
    addToast({
      title: language === 'ar' ? 'خطأ' : 'Error',
      description: err?.message,
      color: 'danger',
    });
  } finally {
    setLoading(false);
  }
  };





 return (
  <div className="min-h-screen bg-gradient-to-b from-content2 via-content2 to-background px-4 py-8 md:px-8">
    <div className="mx-auto w-full space-y-8">

      {/* ======= Branch / Tenant Selector (Super Admin Only) ======= */}
 {/* TENANT (Super Admin Only) */}
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
      fetchBranches(tenantId).then(fetchBookings);
    }}
    isLoading={tenantsLoading}
  >
    {tenants.map((t) => (
      <SelectItem key={t.id}>{t.name}</SelectItem>
    ))}
  </Select>
)}

{/* BRANCH */}
<Select
  label={language === 'ar' ? 'اختر الفرع' : 'Select Branch'}
  placeholder={
    !selectedTenantId
      ? language === 'ar' ? 'اختر الشركة أولاً' : 'Select tenant first'
      : language === 'ar' ? 'اختر الفرع' : 'Select branch'
  }
  selectedKeys={selectedBranchId ? [String(selectedBranchId)] : []}
  onChange={(e) => {
    const branchId = Number(e.target.value);
    setSelectedBranchId(branchId);
    fetchBookings();
  }}
  isDisabled={!selectedTenantId || branchesLoading || branches.length === 0}
  isLoading={branchesLoading}
  isRequired
>
  {branches.map((branch) => (
    <SelectItem key={branch.id}>{language === 'ar' ? branch.name_ar : branch.name}</SelectItem>
  ))}
</Select>



   {/* ======= Header & Action Buttons ======= */}
      <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em]">
            {language === 'ar' ? 'إدارة الحجوزات' : 'BOOKINGS MANAGEMENT'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text">
            {language === 'ar' ? 'الحجوزات' : 'Bookings'}
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

          {/* Create New Booking Button */}
          <Button
            variant="solid"
            color="primary"
            startContent={<PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />}
            onPress={openCreateBooking}
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
              {language === 'ar' ? 'حجز جديدة' : 'New Booking'}
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
            ? (language === 'ar' ? 'حذف حجوزات متعددة' : 'Bulk Delete Bookings')
            : (language === 'ar' ? 'حذف الحجز' : 'Delete Booking')
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
                      : <li>{submitError}</li>}
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
                  ? `هل أنت متأكد من حذف ${selectedKeys.size} حجوزات؟`
                  : `Are you sure you want to delete ${selectedKeys.size} bookings?`)
              : (language === 'ar'
                  ? 'هل أنت متأكد أنك تريد حذف هذا الحجز؟'
                  : 'Are you sure you want to delete this booking?')
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


      {/* ======= Bookings Table ======= */}
    <Table
  aria-label={language === 'ar' ? 'جدول الحجوزات' : 'Bookings Table'}
  classNames={{
    table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300',
  }}
  selectionMode="multiple"
  selectedKeys={selectedKeys}
  onSelectionChange={(keys) => {
    if (keys === "all") {
      setSelectedKeys(new Set(Bookings.map(v => String(v.id))));
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
      </div>

      <span className="text-sm text-foreground/60">
        {language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}
      </span>
    </div>
  }
  bottomContent={
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border-t border-border">
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="flat" className="transition-transform duration-200 hover:scale-105"
          onPress={() => setPage(prev => Math.max(prev - 1, 1))} isDisabled={page === 1}>
          {language === 'ar' ? 'السابق' : 'Previous'}
        </Button>
        <Button size="sm" variant="flat" className="transition-transform duration-200 hover:scale-105"
          onPress={() => setPage(prev => Math.min(prev + 1, totalPages))} isDisabled={page === totalPages}>
          {language === 'ar' ? 'التالي' : 'Next'}
        </Button>
      </div>
      <span className="text-xs text-foreground/50">
        {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
      </span>
      <Pagination style={{ direction: 'ltr' }} page={page} total={totalPages} onChange={setPage} showControls
        color="primary" size="sm" isDisabled={Bookings.length === 0}/>
    </div>
  }
>
  <TableHeader>
  <TableColumn>{language === 'ar' ? 'الزبون' : 'Customer'}</TableColumn>
  <TableColumn>{language === 'ar' ? 'المركبة' : 'Vehicle'}</TableColumn>
  <TableColumn>{language === 'ar' ? 'الفرع' : 'Branch'}</TableColumn>
  <TableColumn>{language === 'ar' ? 'الحالة' : 'Status'}</TableColumn>
  <TableColumn className="text-end">{language === 'ar' ? 'المجموع' : 'Total'}</TableColumn>
  <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
</TableHeader>


  {loading ? (
    <TableBody loadingContent={<TableSkeleton rows={8} columns={8}/>} isLoading={loading} emptyContent={""}>{[]}</TableBody>
  ) : (
    <TableBody emptyContent={Bookings.length === 0 ? (language==='ar'?'لا توجد حجوزات':'No bookings found') : undefined}>
      {Bookings.map(booking => (
        <TableRow key={booking.id}
          className="group bg-white/90 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:shadow-xl">
          
          <TableCell>{booking.customer_name}</TableCell>
          <TableCell>{booking.vehicle_name || '-'}</TableCell>
          <TableCell>{language === 'ar' ? booking.branch_name_ar || '-' : booking.branch_name || '-'}</TableCell>
          <TableCell>{booking.status}</TableCell>
          <TableCell className="text-right">{booking.total_amount} ₪</TableCell>

          <TableCell className="flex items-center justify-end gap-2">
            <Button isIconOnly radius="full" variant="flat" color="default" onPress={() => fetchBookingDetails(booking.id)}>
              <InformationCircleIcon className="h-5 w-5"/>
            </Button>
            <Button variant="flat" color="primary" size="sm" startContent={<PencilSquareIcon className="h-4 w-4"/>}
              onPress={() => openEditBooking(booking)}>
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
            <Button variant="flat" color="danger" size="sm" startContent={<TrashIcon className="h-4 w-4"/>}
              onPress={() => confirmDelete('single', booking.id)}>
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
            <Button
  variant="flat"
  color="success"
  size="sm"
  onPress={() => openPaymentModal(booking)}
>
  {language === 'ar' ? 'دفع' : 'Pay'}
</Button>

          </TableCell>

        </TableRow>
      ))}
    </TableBody>
  )}
</Table>


      {/* =======  Edit / Create Modal ======= */}
   <Modal
  isOpen={viewModal.isOpen}
  onOpenChange={viewModal.onOpenChange}
  size="lg"
  backdrop="blur"
>
  <ModalContent className="bg-content1/95">
    {() =>
      activeBooking && (
        <>
          {/* Header */}
          <ModalHeader className="flex items-center gap-3">
            <Avatar
              size="md"
              name={`${activeBooking.customer_name}`}
              src="" 
            />
            <div>
              <p className="text-lg font-semibold">{activeBooking.customer_name}</p>
              <p className="text-sm text-foreground/60">
                {language === 'ar' ? activeBooking.branch_name_ar || '-' : activeBooking.branch_name || '-'}
              </p>
            </div>
          </ModalHeader>

          {/* Body */}
          <ModalBody className="space-y-4">
            <Divider />

            {/* Basic Info */}
            <div>
              <p className="text-xs uppercase tracking-wide text-foreground/60">
                {language === 'ar' ? 'معلومات الحجز' : 'Booking Information'}
              </p>
              <p className="text-sm">
                {language === 'ar' ? 'المركبة:' : 'Vehicle:'}{' '}
                {activeBooking.vehicle_name || '-'}
              </p>
          
              <p className="text-sm">
                {language === 'ar' ? 'الحالة:' : 'Status:'}{' '}
                {activeBooking.status}
              </p>
            </div>

            {/* Grid Info */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  {language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                </p>
                <p className="text-sm">{activeBooking.start_date || '-'}</p>
              </div>

              {/* End Date */}
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  {language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                </p>
                <p className="text-sm">{activeBooking.end_date || '-'}</p>
              </div>

              {/* Total Amount */}
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  {language === 'ar' ? 'الإجمالي' : 'Total Amount'}
                </p>
                <p className="text-sm">{activeBooking.total_amount} ₪</p>
              </div>

              {/* Created At */}
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  {language === 'ar' ? 'تاريخ الإضافة' : 'Created At'}
                </p>
                <p className="text-sm">
                  {activeBooking.created_at
                    ? moment(activeBooking.created_at)
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

<Modal
  isDismissable={false}
  isOpen={editModal.isOpen}
  onOpenChange={editModal.onOpenChange}
  size="xl"
  scrollBehavior="inside"
  backdrop="blur"
>
  <ModalContent className="bg-content1/95">
    {(onClose) => (
      <Form
        onSubmit={(e: any) => {
          e.preventDefault();
          saveBooking();
        }}
        className="w-full"
      >
        <ModalHeader className="flex items-center gap-3 text-xl font-semibold">
          {isEditing
            ? language === 'ar'
              ? 'تعديل الحجز'
              : 'Edit Booking'
            : language === 'ar'
            ? 'إنشاء حجز جديد'
            : 'Create New Booking'}
        </ModalHeader>

        <ModalBody className="space-y-4">
          {submitError &&
            ((Array.isArray(submitError) && submitError.length > 0) ||
              (typeof submitError === 'string' && submitError.trim() !== '')) && (
              <Alert
                title={
                  isEditing
                    ? language === 'ar'
                      ? 'فشل الحفظ'
                      : 'Save Failed'
                    : language === 'ar'
                    ? 'فشل الإنشاء'
                    : 'Create Failed'
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
            {/* CUSTOMER */}
            <Select
              label={language === 'ar' ? 'العميل' : 'Customer'}
              selectedKeys={formData.customer_id ? [formData.customer_id.toString()] : []}
              onChange={e => setFormData(p => ({ ...p, customer_id: Number(e.target.value) }))}
              isRequired
            >
              {customers.map(c => (
                <SelectItem key={c.id.toString()}>{c.full_name}</SelectItem>
              ))}
            </Select>

            {/* VEHICLE */}
<Select
  label={language === 'ar' ? 'المركبة' : 'Vehicle'}
  selectedKeys={
    formData.vehicle_id
      ? new Set([formData.vehicle_id.toString()])
      : new Set()
  }
  onSelectionChange={(keys) => {
    const id = Number(Array.from(keys)[0]);
    const vehicle = vehicles.find(v => v.id === id);

    setFormData(p => ({
      ...p,
      vehicle_id: id,
      vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : ''
    }));
  }}
  isRequired
>
  {vehicles.map(v => (
    <SelectItem
      key={v.id.toString()}
      textValue={`${v.make} ${v.model}`}   
    >
      {v.make} {v.model}
    </SelectItem>
  ))}
</Select>

            {/* BRANCH */}
            <Select
              label={language === 'ar' ? 'الفرع' : 'Branch'}
              selectedKeys={formData.branch_id ? [formData.branch_id.toString()] : []}
              onChange={e => setFormData(p => ({ ...p, branch_id: Number(e.target.value) }))}
              isRequired
            >
              {branches.map(b => (
                <SelectItem key={b.id.toString()}>{language === 'ar' ? b.name_ar : b.name}</SelectItem>
              ))}
            </Select>

            {/* START DATE */}
            <Input
              label={language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
              type="date"
              value={formData.start_date}
              onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
              isRequired
            />

            {/* END DATE */}
            <Input
              label={language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
              type="date"
              value={formData.end_date}
              onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
              isRequired
            />

            {/* TOTAL AMOUNT */}
            <Input
              label={language === 'ar' ? 'المجموع' : 'Total Amount'}
              type="number"
              value={formData.total_amount.toString()}
              onChange={e =>
                setFormData(p => ({ ...p, total_amount: Number(e.target.value) }))
              }
              isRequired
            />


            {/* STATUS (EDIT ONLY) */}
            {isEditing && (
              <Select
                label={language === 'ar' ? 'الحالة' : 'Status'}
                selectedKeys={[formData.status || 'pending']}
                onChange={e => setFormData(p => ({ ...p, status: e.target.value as BookingForm['status'] }))}
              >
                <SelectItem key="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                <SelectItem key="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                <SelectItem key="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                <SelectItem key="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
              </Select>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            onPress={() => {
              onClose();
              resetBookingForm();
            }}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button color="primary" type="submit" isLoading={loadingForm}>
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </ModalFooter>
      </Form>
    )}
  </ModalContent>
</Modal>

    </div>
    <Modal
  isOpen={paymentModal.isOpen}
  onOpenChange={paymentModal.onOpenChange}
  backdrop="blur"
  size="lg"
>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader>
          {language === 'ar' ? 'الدفع' : 'Payment'}
        </ModalHeader>

        <ModalBody className="space-y-4">
          {paymentBooking && (
            <Alert
              color="primary"
              variant="flat"
              title={language === 'ar' ? 'معلومات الحجز' : 'Booking Info'}
              description={`${paymentBooking.customer_name} - ${paymentBooking.vehicle_name}`}
            />
          )}
 <Input
  type="number"
  label={language === 'ar' ? 'الحجز' : 'Booking Id'}
  value={paymentData.booking_id.toString()}
  isReadOnly
/>
          {/* Payment Method */}
          <Select
            label={language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            selectedKeys={[paymentData.payment_method]}
            onChange={(e) =>
              setPaymentData(p => ({
                ...p,
                payment_method: e.target.value as any,
              }))
            }
          >
            <SelectItem key="cash">{language === 'ar' ? 'كاش' : 'Cash'}</SelectItem>
            <SelectItem key="card">{language === 'ar' ? 'بطاقة' : 'Card'}</SelectItem>
            <SelectItem key="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
            <SelectItem key="online">{language === 'ar' ? 'أونلاين' : 'Online'}</SelectItem>
          </Select>


          {/* Amount */}
          <Input
            type="number"
            label={language === 'ar' ? 'المبلغ' : 'Amount'}
            value={paymentData.amount.toString()}
           isReadOnly
          />

          {/* Deposit */}
          <Input
            type="number"
            label={language === 'ar' ? 'دفعة جزئية' : 'Partial Amount'}
            value={paymentData.partial_amount.toString()}
            onChange={(e) =>
              setPaymentData(p => ({
                ...p,
                partial_amount: Number(e.target.value),
                is_deposit: Number(e.target.value) > 0,
              }))
            }
          />

          {/* Late Fee */}
          <Input
            type="number"
            label={language === 'ar' ? 'غرامة تأخير' : 'Late Fee'}
            value={paymentData.late_fee.toString()}
            onChange={(e) =>
              setPaymentData(p => ({
                ...p,
                late_fee: Number(e.target.value),
              }))
            }
          />

          {/* Extra Details */}
          {(paymentData.payment_method === 'bank_transfer' ||
            paymentData.payment_method === 'online') && (
            <Input
              label={language === 'ar' ? 'تفاصيل إضافية' : 'Details'}
              value={paymentData.split_details}
              onChange={(e) =>
                setPaymentData(p => ({
                  ...p,
                  split_details: e.target.value,
                }))
              }
            />
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button color="success" onPress={submitPayment}>
            {language === 'ar' ? 'دفع' : 'Pay'}
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>

  </div>
);

}
