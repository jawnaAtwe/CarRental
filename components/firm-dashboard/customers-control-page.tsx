'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import moment from 'moment';

import {
  Button,
  Chip,
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
  Form,
  Tooltip,
  User
} from '@heroui/react';

import { 
  PencilSquareIcon, 
  PlusIcon, 
  TrashIcon, 
  InformationCircleIcon,
  NoSymbolIcon, 
  ShieldCheckIcon, 
  ShieldExclamationIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';

import { useLanguage } from '../context/LanguageContext';
import { TableSkeleton } from "@/lib/Skeletons";

// ------------------- Types -------------------

export type CustomerStatus = 'active' | 'deleted' | 'blacklisted';
export type CustomerType = 'individual' | 'corporate';
export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'vip';
export type Gender = 'male' | 'female' | 'other';
export type IDType = 'id_card' | 'passport';

export interface CustomerDB {
  id: number;
  customer_type: CustomerType;
  status: CustomerStatus;

  // الأسماء
  first_name: string | null;
  last_name: string | null;
  full_name: string | null; 
  profile_image?: string | null;

  // الاتصال
  email: string | null;
  phone: string | null;
  whatsapp: string | null;

  // الشخصية
  nationality: string | null;
  date_of_birth: string | null; 
  gender: Gender | null;

  // الهوية
  id_type: IDType | null;
  id_number: string | null;

  // رخصة القيادة
  driving_license_number: string | null;
  license_country: string | null;
  license_expiry_date: string | null;

  // العنوان
  address: string | null;
  city: string | null;
  country: string | null;

  // الإعدادات والملاحظات
  preferred_language: string;
  notes: string | null;

  // نظام الولاء (Read Only غالباً)
  loyalty_points: number;
  loyalty_level: LoyaltyLevel;

  // الإحصائيات
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;

  last_booking_date: string | null;
  average_rental_days: number | null;

  // إدارة المخاطر
  risk_score: number;
  late_returns_count: number;
  damage_incidents_count: number;
  fraud_flag: boolean;

  created_at: string;
  updated_at: string;
}

export interface CustomerForm extends Partial<Omit<CustomerDB, 'id' | 'created_at' | 'updated_at'>> {
  id?: number; 
  full_name: string; 
  password?: string; 
}


// ------------------- Constants -------------------

const pageSize = 6;
const API_BASE_URL = '/api/v1/admin';

// ------------------- Component -------------------

export default function CustomersPage() {
  const { language } = useLanguage();

  // ------------------- States -------------------

  const [customers, setCustomers] = useState<CustomerDB[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerDB['status'] | 'all'>('all');

  const [isEditing, setIsEditing] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<CustomerDB | null>(null);
  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [formData, setFormData] = useState<CustomerForm>({
    customer_type: 'individual',
    status: 'active',
    full_name: '',
    profile_image: ''
  });
  const [submitError, setSubmitError] = useState<string | string[]>([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);
  const updateForm = <K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) =>
  setFormData(prev => ({ ...prev, [key]: value }));

  // ------------------- Effects -------------------

  useEffect(() => {
    fetchCustomers();
  }, [page, search, statusFilter]);

  // ------------------- Functions -------------------

  const fetchCustomers = async () => {
    setLoading(true);
    try {
    const params = new URLSearchParams({
  page: String(page),
  pageSize: String(pageSize),
  ...(search && { search }),
  ...(statusFilter !== 'all' && { status: statusFilter }), 
});

      const response = await fetch(`${API_BASE_URL}/customers?${params}`, {
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setCustomers(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.count ?? (data.data ? data.data.length : 0));
    } catch (error: any) {
      console.error(error);
      addToast({ 
        title: language === 'ar' ? 'خطأ في جلب العملاء' : 'Error fetching customers', 
        description: error?.message || 'Error', 
        color: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
  setFormData({
    // ===== Core =====
    customer_type: 'individual',
    status: 'active',

    // ===== Names =====
    first_name: '',
    last_name: '',
    full_name: '',

    // ===== Profile =====
    profile_image: null,

    // ===== Contact =====
    email: '',
    phone: '',
    whatsapp: '',

    // ===== Personal =====
    nationality: '',
    date_of_birth: '',
    gender: undefined,

    // ===== Identity =====
    id_type: undefined,
    id_number: '',

    // ===== Driving License =====
    driving_license_number: '',
    license_country: '',
    license_expiry_date: '',

    // ===== Address =====
    address: '',
    city: '',
    country: '',

    // ===== Preferences =====
    preferred_language: language || 'en',

    // ===== Notes =====
    notes: '',

    // ===== Auth =====
    password: '',
  });

  setSubmitError([]);
  setIsEditing(false);
  setActiveCustomer(null);
  };
  const openEditCustomer = (customer: CustomerDB) => {
  setIsEditing(true);

  setFormData({
    id: customer.id,

    // ===== Core =====
    customer_type: customer.customer_type,
    status: customer.status,
    profile_image: customer.profile_image ?? '',
    // ===== Names =====
    first_name: customer.first_name ?? '',
    last_name: customer.last_name ?? '',
    full_name: customer.full_name ?? '',

    // ===== Contact =====
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    whatsapp: (customer as any).whatsapp ?? '',

    // ===== Personal Info =====
    nationality: (customer as any).nationality ?? '',
    date_of_birth: (customer as any).date_of_birth ?? '',
    gender: (customer as any).gender ?? undefined,

    // ===== Identity =====
    id_type: (customer as any).id_type ?? undefined,
    id_number: (customer as any).id_number ?? '',

    // ===== Driving License =====
    driving_license_number: (customer as any).driving_license_number ?? '',
    license_country: (customer as any).license_country ?? '',
    license_expiry_date: (customer as any).license_expiry_date ?? '',

    // ===== Address =====
    address: (customer as any).address ?? '',
    city: (customer as any).city ?? '',
    country: (customer as any).country ?? '',

    // ===== Preferences =====
    preferred_language: (customer as any).preferred_language ?? 'en',

    // ===== Notes =====
    notes: (customer as any).notes ?? '',

    // ===== Auth =====
    password: '', // دايمًا فاضي في التعديل
  });

  setSubmitError([]);
  editModal.onOpen();
  };
 const openCreateUser = () => {
    setIsEditing(false);
    resetForm();
    editModal.onOpen();
  };
 const saveCustomer = async () => {
  setLoadingForm(true);

  try {
    const payload = {
      ...formData
    };

    const method = formData.id ? 'PUT' : 'POST';
    const endpoint = formData.id 
      ? `${API_BASE_URL}/customers/${formData.id}` 
      : `${API_BASE_URL}/customers`;

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
      description: data?.message || (language === 'ar' ? 'تم حفظ العميل بنجاح' : 'Customer saved successfully'),
      color: 'success',
    });

    editModal.onClose();
    fetchCustomers();
  } catch (error) {
    console.error(error);
    setSubmitError(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
  } finally {
    setLoadingForm(false);
  }
};

  const confirmDelete = (type: 'single' | 'bulk', id?: number) => {
    setDeleteTarget({ type, id });
    deleteModal.onOpen();
  };
  const handleDeleteCustomer = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Failed to delete');
      addToast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: data?.message || '',
        color: 'success'
      });
      fetchCustomers();
    } catch (error: any) {
      console.error(error);
      addToast({ 
        title: language === 'ar' ? 'خطأ' : 'Error', 
        description: error?.message || (language === 'ar' ? 'فشل الحذف' : 'Delete failed'), 
        color: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };
  const handleBulkDelete = async () => {
    const selectedUserIds = Array.from(selectedKeys).map(key => Number(key));
    if (selectedUserIds.length === 0) return;
  
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_ids: selectedUserIds }),
      });
      let msg = '';
      try {
        const data = await response.json();
        msg = data?.message || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }
  
      if (!response.ok) throw new Error(msg);
  
      setSelectedKeys(new Set());
      await fetchCustomers();
  
      addToast({ 
        title: language === 'ar' ? 'تم الحذف' : 'Deleted', 
        description: msg,
        color: 'success' 
      });
    } catch (error: any) {
      console.error(error);
      addToast({ 
        title: language === 'ar' ? 'خطأ' : 'Error', 
        description: error?.message || (language === 'ar' ? 'خطأ في حذف المستخدمين' : 'Error deleting users'), 
        color: 'danger' 
      });
    } finally { 
      setLoading(false); 
    }
  };
 const fetchCustomerDetails = async (customerId: number) => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
      headers: { 'accept-language': language },
    });

    let msg = '';
    let data: any = null;
    try {
      data = await response.json();
      msg = data?.message || '';
    } catch {
      msg = await response.text();
    }

    if (!response.ok) throw new Error(msg || response.statusText);

    setActiveCustomer(data);
    viewModal.onOpen();
  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    addToast({ 
      title: language === 'ar' ? 'خطأ' : 'Error', 
      description: error?.message || (language === 'ar' ? 'خطأ في جلب بيانات العميل' : 'Error fetching customer details'), 
      color: 'danger' 
    });
  } finally {
    setLoading(false);
  }
  };
 const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    if (deleteTarget.type === 'single' && deleteTarget.id) await handleDeleteCustomer(deleteTarget.id);
    if (deleteTarget.type === 'bulk') await handleBulkDelete();
    setDeleteTarget(null);
  };
  const statusChip = (status: CustomerDB['status']) => {
    const statusText =
      status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
      status === 'deleted' ? (language === 'ar' ? 'محذوف' : 'Deleted') :
      status === 'blacklisted' ? (language === 'ar' ? 'محظور' : 'Blacklisted') : status;

    return (
      <Tooltip showArrow content={statusText}>
        <Chip
          size="sm"
          color={status === 'active' ? 'success' : status === 'deleted' ? 'default' : 'danger'}
          variant="flat"
        >
          {status === 'active' ? <ShieldCheckIcon className="h-4 w-4" /> :
           status === 'deleted' ? <NoSymbolIcon className="h-4 w-4" /> :
           <ShieldExclamationIcon className="h-4 w-4" />}
        </Chip>
      </Tooltip>
    );
  };
 return (
    <div className="min-h-screen bg-gradient-to-b from-content2 via-content2 to-background px-4 py-8 md:px-8">
    <div className="mx-auto w-full space-y-8">
 {/* ======= Header & Action Buttons ======= */}
      <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em]">
            {language === 'ar' ? 'إدارة المستخدمين' : 'CUSTOMERS MANAGEMENT'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text">
            {language === 'ar' ? 'المستخدمون' : 'Customers'}
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

          {/* Create New Customer Button */}
          <Button
            variant="solid"
            color="primary"
            startContent={
              <PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />
            }
            onPress={openCreateUser}
            className="
              relative overflow-hidden
              text-white font-extrabold tracking-wide
              rounded-3xl
              px-6 py-3
              bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500
              shadow-xl
              transition-all duration-500
              transform hover:scale-110 hover:shadow-2xl
              before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full
              before:bg-white/30 before:rotate-12 before:transition-all before:duration-500
              hover:before:w-[200%]
            "
          >
            <span className="relative animate-gradient-text bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
              {language === 'ar' ? 'مستخدم جديد' : 'New User'}
            </span>
          </Button>
        </div>
      </section>

        <Modal
  isDismissable={false}
  isOpen={editModal.isOpen}
  onOpenChange={editModal.onOpenChange}
  size="3xl"
  scrollBehavior="inside"
  backdrop="blur"
>
          <ModalContent className="bg-content1/95 max-h-[90vh]">
            {(onClose) => (
              <>
                <ModalHeader className="relative overflow-hidden px-6 py-5 flex items-center gap-3 border-b border-divider">
                  {deleteTarget?.type === 'bulk' 
                    ? (language === 'ar' ? 'حذف متعدد' : 'Bulk Delete')
                    : (language === 'ar' ? 'حذف المستخدم' : 'Delete User')
                  }
                </ModalHeader>
                <ModalBody>
                  <p className="text-foreground/80 text-md leading-relaxed">
                    {deleteTarget?.type === 'bulk'
                      ? (language === 'ar' 
                          ? `هل أنت متأكد من حذف ${selectedKeys.size} مستخدم؟`
                          : `Are you sure you want to delete ${selectedKeys.size} users?`)
                      : (language === 'ar' 
                          ? 'هل أنت متأكد أنك تريد حذف هذا المستخدم؟'
                          : 'Are you sure you want to delete this user?')
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
<Table
  aria-label={language === 'ar' ? 'جدول المستخدمين' : 'Customers table'}
  classNames={{
    table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300',
  }}
  selectionMode="multiple"
  selectedKeys={selectedKeys}
  onSelectionChange={(keys) => {
    if (keys === "all") {
      setSelectedKeys(new Set(customers.map(u => String(u.id))));
    } else {
      setSelectedKeys(keys as Set<string>);
    }
  }}

  /* ======= Top Content: Search & Filter ======= */
  topContent={
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
      
      {/* Search Input & Status Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <Input
          startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />}
          placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
          variant="faded"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[240px] transition-all duration-200 focus:shadow-md focus:border-primary"
        />

        {/* Status Filter */}
        <Select
          startContent={<CheckBadgeIcon className="h-5 w-5 text-foreground/50" />}
          variant="faded"
          placeholder={language === 'ar' ? 'الحالة' : 'Status'}
          className="min-w-[160px] transition-all duration-200 focus:shadow-md focus:border-primary"
          selectedKeys={[statusFilter]}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setPage(1);
          }}
        >
          <SelectItem key="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
          <SelectItem key="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
        <SelectItem key="blacklisted">
  {language === 'ar' ? 'القائمة السوداء' : 'Blacklisted'}
</SelectItem>

        </Select>
      </div>

      {/* Total Count */}
      <span className="text-sm text-foreground/60">
        {language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}
      </span>
    </div>
  }

  /* ======= Bottom Content: Pagination & Navigation ======= */
  bottomContent={
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border-t border-border">
      
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
        isDisabled={customers.length === 0}
      />
    </div>
  }
>
<TableHeader>
  <TableColumn>{language === 'ar' ? 'المستخدم' : 'User'}</TableColumn>
  <TableColumn>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</TableColumn>
  <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
</TableHeader>

  {loading ? (
    <TableBody loadingContent={<TableSkeleton rows={8} columns={8} />} isLoading={loading} emptyContent={""}>{[]}</TableBody>
  ) : (
    <TableBody emptyContent={language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}>
      {customers.map((customer) => (
        <TableRow 
          key={String(customer.id)} 
           className="
    group
    bg-white/90
    rounded-xl
    shadow-md
    transition-all duration-300
    hover:scale-[1.02]
    hover:bg-white
    hover:shadow-xl
  "
        >
          <TableCell>
            <div className="flex items-center gap-2">
              <User
                aria-label={language === 'ar' ? `عرض المستخدم ${customer.full_name}` : `View user ${customer.full_name}`}
                avatarProps={{ src: '', size: 'md' }}
                name={
                  <div className="flex items-center gap-1">
                    {statusChip(customer.status)} {/* true يعني مع تأثير hover */}
                    <span>{language === 'ar' ? (customer.full_name || customer.full_name) : customer.full_name}</span>
                  </div>
                }
                description={
                  <div className="text-xs text-foreground/50">
                    <p>{customer.phone || customer.email}</p>
                  </div>
                }
              />
            </div>
          </TableCell>

         
          <TableCell>
            <div className="flex items-center gap-3">
              {moment(customer.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
            </div>
          </TableCell>
          
          <TableCell className="flex items-center justify-end gap-2">
            <Button 
              isIconOnly radius="full" variant="flat" color="default" 
              className="transition-transform duration-200 hover:scale-110 hover:bg-background/30"
              onPress={() => fetchCustomerDetails(customer.id)}
            >
              <InformationCircleIcon className="h-5 w-5" />
            </Button>
           <Button variant="flat" color="primary" size="sm" startContent={<PencilSquareIcon className="h-4 w-4" />}
              onPress={() => openEditCustomer(customer)}
            >
                {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
           <Button variant="flat" color="danger" size="sm" startContent={<TrashIcon className="h-4 w-4" />} 
              onPress={() => confirmDelete('single', customer.id)}
            >  {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )}
</Table>
      </div>

    <Modal
  isOpen={viewModal.isOpen}
  onOpenChange={viewModal.onOpenChange}
  size="xl"
  backdrop="blur"
>
  <ModalContent className="bg-content1/95">
    {() =>
      activeCustomer && (
        <>
          {/* ===== Header ===== */}
          <ModalHeader className="flex items-center gap-4">
         
            <div className="flex flex-col">
              <p className="text-xl font-semibold">
                {activeCustomer.full_name}
              </p>
              <p className="text-sm text-foreground/60">
                {language === 'ar' ? 'نوع العميل:' : 'Customer Type:'}{' '}
                <span className="font-medium">
                  {activeCustomer.customer_type === 'individual'
                    ? language === 'ar' ? 'فرد' : 'Individual'
                    : language === 'ar' ? 'شركة' : 'Corporate'}
                </span>
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="space-y-6">
            <Divider />

            {/* ===== Contact Info ===== */}
            <section>
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
                {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><strong>Email:</strong> {activeCustomer.email || '-'}</p>
                <p><strong>Phone:</strong> {activeCustomer.phone || '-'}</p>
                <p><strong>WhatsApp:</strong> {(activeCustomer as any).whatsapp || '-'}</p>
                <p><strong>Language:</strong> {(activeCustomer as any).preferred_language || '-'}</p>
              </div>
            </section>

            <Divider />

            {/* ===== Personal Info ===== */}
            <section>
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
                {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><strong>{language === 'ar' ? 'الجنسية' : 'Nationality'}:</strong> {(activeCustomer as any).nationality || '-'}</p>
                <p><strong>{language === 'ar' ? 'الجنس' : 'Gender'}:</strong> {(activeCustomer as any).gender || '-'}</p>
              <p>
  <strong>{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}:</strong> 
  {activeCustomer.date_of_birth
    ? (activeCustomer.date_of_birth as string).split("T")[0]
    : '-'}
</p>
 </div>
            </section>

            <Divider />

            {/* ===== Identity ===== */}
            <section>
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
                {language === 'ar' ? 'بيانات الهوية' : 'Identity'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><strong>ID Type:</strong> {(activeCustomer as any).id_type || '-'}</p>
                <p><strong>ID Number:</strong> {(activeCustomer as any).id_number || '-'}</p>
              </div>
            </section>

            <Divider />

            {/* ===== Driving License ===== */}
            <section>
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
                {language === 'ar' ? 'رخصة القيادة' : 'Driving License'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><strong>{language === 'ar' ? 'رقم الرخصة' : 'License Number'}:</strong> {(activeCustomer as any).driving_license_number || '-'}</p>
                <p><strong>{language === 'ar' ? 'الدولة' : 'Country'}:</strong> {(activeCustomer as any).license_country || '-'}</p>
               <p>
  <strong>{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}:</strong> 
  {activeCustomer.license_expiry_date
    ? (activeCustomer.license_expiry_date as string).split("T")[0]
    : '-'}
</p>
   </div>
            </section>

            <Divider />

            {/* ===== Address ===== */}
            <section>
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
                {language === 'ar' ? 'العنوان' : 'Address'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><strong>{language === 'ar' ? 'المدينة' : 'City'}:</strong> {(activeCustomer as any).city || '-'}</p>
                <p><strong>{language === 'ar' ? 'الدولة' : 'Country'}:</strong> {(activeCustomer as any).country || '-'}</p>
                <p className="col-span-2">
                  <strong>{language === 'ar' ? 'العنوان الكامل' : 'Address'}:</strong>{' '}
                  {(activeCustomer as any).address || '-'}
                </p>
              </div>
            </section>

            <Divider />

            {/* ===== Meta ===== */}
            <section>
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
                {language === 'ar' ? 'معلومات النظام' : 'System Info'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><strong>Status:</strong> {activeCustomer.status}</p>
                <p><strong>Created At:</strong> {activeCustomer.created_at || '-'}</p>
              </div>
            </section>
          </ModalBody>

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
            <>
            <ModalHeader
  className="
    relative overflow-hidden
    px-6 py-5
    rounded-t-2xl
    bg-gradient-to-br from-primary/15 via-primary/5 to-background
    backdrop-blur-md
    flex items-center gap-3
    text-xl font-semibold
    animate-in fade-in slide-in-from-top-3
  "
>
  <span
    className="
      absolute -top-10 -right-10
      h-24 w-24
      rounded-full
      bg-primary/20
      blur-3xl
      pointer-events-none
    "
  />

  {/* Icon */}
  <div
    className="
      flex h-10 w-10 items-center justify-center
      rounded-full
      bg-primary/15
      text-primary
      shadow-sm
      animate-in zoom-in-50
    "
  >
    {isEditing ? "✏️" : "➕"}
  </div>

  {/* Title */}
  <div className="flex flex-col leading-tight">
  <span>
  {isEditing
    ? language === "ar"
      ? "تعديل العميل"
      : "Edit Customer"
    : language === "ar"
      ? "إنشاء عميل جديد"
      : "Create New Customer"}
</span>

<span className="text-xs font-normal text-foreground/60">
  {language === "ar"
    ? "إدارة بيانات العميل"
    : "Manage customer information"}
</span>

  </div>
</ModalHeader>
              <Form
                onSubmit={(e: any) => {
                  e.preventDefault();
                  saveCustomer();
                }}
                className="w-full"
              >
                <ModalBody className="space-y-2">
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

           

                <div className="grid gap-4 md:grid-cols-3">
                    <Input
  label="First Name"
  value={formData.first_name || ''}
  onChange={e => updateForm('first_name', e.target.value)}

/>

<Input
  label="Last Name"
  value={formData.last_name || ''}
  onChange={e => updateForm('last_name', e.target.value)}

/>

<Input
  label="Full Name"
  value={formData.full_name || ''}
   onChange={e => updateForm('full_name', e.target.value)}
/>

  <Select
    label={language === 'ar' ? 'الجنس' : 'Gender'}
    selectedKeys={formData.gender ? [formData.gender] : []}
     onChange={(e) => updateForm('gender', e.target.value as Gender)}
    variant="faded"
  >
    <SelectItem key="male">{language === 'ar' ? 'ذكر' : 'Male'}</SelectItem>
    <SelectItem key="female">{language === 'ar' ? 'أنثى' : 'Female'}</SelectItem>
    <SelectItem key="other">{language === 'ar' ? 'آخر' : 'Other'}</SelectItem>
  </Select>
{!isEditing && (
  <Input
    type="password"
    label={language === 'ar' ? 'كلمة المرور' : 'Password'}
    value={formData.password || ''}
    onChange={e => updateForm('password', e.target.value)}
  />
)}

<Input
  type="date"
  label={language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
  className="border p-2 rounded-lg w-full"
  value={formData.date_of_birth ? formData.date_of_birth.split("T")[0] : ""}
  onChange={e => updateForm('date_of_birth', e.target.value)}
/>


</div> <div className="grid gap-4 md:grid-cols-3">
  <Select
    label={language === 'ar' ? 'نوع الهوية' : 'ID Type'}
    selectedKeys={formData.id_type ? [formData.id_type] : []}
    onChange={(e) => updateForm('id_type', e.target.value as IDType)}
    variant="faded"
  >
    <SelectItem key="id_card">
      {language === 'ar' ? 'بطاقة شخصية' : 'ID Card'}
    </SelectItem>
    <SelectItem key="passport">
      {language === 'ar' ? 'جواز سفر' : 'Passport'}
    </SelectItem>
  </Select>

  <Input
    label={language === 'ar' ? 'رقم الهوية' : 'ID Number'}
    value={formData.id_number || ''}
    onChange={e => updateForm('id_number', e.target.value)}
  />

  <Input
    label={language === 'ar' ? 'الجنسية' : 'Nationality'}
    value={formData.nationality || ''}
    onChange={e => updateForm('nationality', e.target.value)}
  />
</div>


             {formData.customer_type === 'individual' && (
  <div className="grid gap-4 md:grid-cols-3">
    <Input
      label={language === 'ar' ? 'رقم رخصة القيادة' : 'Driving License Number'}
      value={formData.driving_license_number || ''}
      onChange={e => updateForm('driving_license_number', e.target.value)}
    />

    <Input
      label={language === 'ar' ? 'بلد الرخصة' : 'License Country'}
      value={formData.license_country || ''}
      onChange={e => updateForm('license_country', e.target.value)}
    />

 <Input
  type="date"
  label={language === 'ar' ? 'تاريخ انتهاء الرخصة' : 'License Expiry Date'}
  className="border p-2 rounded-lg w-full"
  value={formData.license_expiry_date ? formData.license_expiry_date.split("T")[0] : ""}
  onChange={e => updateForm('license_expiry_date', e.target.value)}
/>


  </div>
)}
<div className="grid gap-4 md:grid-cols-2">
  <Input
    label={language === 'ar' ? 'العنوان' : 'Address'}
    value={formData.address || ''}
    onChange={e => updateForm('address', e.target.value)}
  />

  <Input
    label={language === 'ar' ? 'المدينة' : 'City'}
    value={formData.city || ''}
    onChange={e => updateForm('city', e.target.value)}
  />
</div>

<div className="grid gap-4 md:grid-cols-2">
  <Input
    label={language === 'ar' ? 'الدولة' : 'Country'}
    value={formData.country || ''}
    onChange={e => updateForm('country', e.target.value)}
  />

  <Input
    label="WhatsApp"
    value={formData.whatsapp || ''}
    onChange={e => updateForm('whatsapp', e.target.value)}
  />
</div>
<div className="grid gap-4 md:grid-cols-2">
  
{/* ===== CUSTOMER PROFILE IMAGE ===== */}
<div className="sm:col-span-2 lg:col-span-3">
  <label className="block text-sm font-medium text-foreground/70">
    {language === "ar" ? "صورة العميل" : "Customer Image"}
  </label>

  {/* FILE INPUT (hidden) */}
  <input
    id="customer-image-input"
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
          profile_image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);

      e.target.value = "";
    }}
  />

  {/* PREVIEW + ACTIONS */}
  <div className="mt-2 flex items-center gap-4">
    {/* IMAGE PREVIEW */}
    {formData?.profile_image ? (
      <img
        src={formData.profile_image as string}
        alt="Profile"
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
          document.getElementById("customer-image-input")?.click()
        }
      >
        {language === "ar" ? "اختيار صورة" : "Choose Image"}
      </Button>

      {formData?.profile_image && (
        <Button
          size="sm"
          color="danger"
          variant="flat"
          onPress={() =>
            setFormData(p => ({ ...p, profile_image: null }))
          }
        >
          {language === "ar" ? "حذف الصورة" : "Remove"}
        </Button>
      )}
    </div>
  </div>
</div>



</div>


                  {isEditing && (
                    <div className="grid gap-4 md:grid-cols-1">
                  <Select
  label={language === 'ar' ? 'الحالة' : 'Status'}
selectedKeys={formData.status ? [formData.status] : []}

  onChange={(e) =>
    setFormData((prev) => ({ ...prev, status: e.target.value as any }))
  }
  variant="faded"
  isRequired
>
  <SelectItem key="active">
    {language === 'ar' ? 'نشط' : 'Active'}
  </SelectItem>
  <SelectItem key="blacklisted">
    {language === 'ar' ? 'قائمة سوداء' : 'Blacklisted'}
  </SelectItem>
  <SelectItem key="deleted">
    {language === 'ar' ? 'محذوف' : 'Deleted'}
  </SelectItem>
</Select>

                    </div>
                  )}
                </ModalBody>

                <ModalFooter>
                  <Button
                    variant="light"
                    onPress={() => {
                      onClose();
                      resetForm();
                    }}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button 
                    color="primary" 
                    type="submit" 
                    isLoading={loadingForm}
                 
                  >
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                </ModalFooter>
              </Form>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
