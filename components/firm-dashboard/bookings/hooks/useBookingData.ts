import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { addToast } from '@heroui/react';
import { bookingService } from '../services/bookingService';
import { 
  BookingDB, 
  SessionUser, 
  Branch, 
  Customer, 
  Vehicle, 
  Tenant 
} from '../types/bookingTypes';

export const useBookingData = (language: string) => {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;

  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const [bookings, setBookings] = useState<BookingDB[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingDB['status']>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (sessionLoaded && isSuperAdmin) {
      fetchTenants();
    }
  }, [sessionLoaded, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && user) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    if (selectedTenantId) {
      fetchCustomers();
      fetchVehicles();
    }
  }, [selectedTenantId]);

  useEffect(() => {
    const tenantIdToUse = isSuperAdmin ? selectedTenantId : user?.tenantId;

    if (!tenantIdToUse) return;

    const loadData = async () => {
      try {
        await fetchBranches(tenantIdToUse);
        await fetchBookings();
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
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

  const fetchTenants = async () => {
    setTenantsLoading(true);
    try {
      const data = await bookingService.fetchTenants(language);
      setTenants(data);
    } catch (error) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as any)?.message || 'Failed to fetch tenants',
        color: 'danger',
      });
    } finally {
      setTenantsLoading(false);
    }
  };

  const fetchBranches = async (tenantId: number) => {
    setBranchesLoading(true);
    setBranchesError(null);

    try {
      const data = await bookingService.fetchBranches(tenantId, language);
      setBranches(data);
    } catch (error: any) {
      console.error(error);
      setBranches([]);
      setBranchesError(
        language === 'ar' ? 'فشل تحميل الفروع' : 'Failed to load branches'
      );
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const data = await bookingService.fetchCustomers(selectedTenantId, language);
      setCustomers(data);
    } catch (err: any) {
      console.error(err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const data = await bookingService.fetchVehicles(selectedTenantId, language);
      setVehicles(data);
    } catch (err: any) {
      console.error(err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const result = await bookingService.fetchBookings({
        tenantId: selectedTenantId,
        page,
        search,
        statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
        branchId: selectedBranchId,
        language,
      });

      setBookings(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
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

  return {
    user,
    sessionLoaded,
    isSuperAdmin,
    selectedTenantId,
    setSelectedTenantId,
    selectedBranchId,
    setSelectedBranchId,
    bookings,
    branches,
    customers,
    vehicles,
    tenants,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    loading,
    tenantsLoading,
    branchesLoading,
    branchesError,
    fetchBookings,
    fetchBranches,
  };
};