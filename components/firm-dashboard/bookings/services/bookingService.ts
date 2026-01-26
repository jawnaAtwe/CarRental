import { BookingDB, BookingForm, Branch, Customer, Vehicle, Tenant, PaymentData } from '../types/bookingTypes';
import { BOOKING_CONSTANTS } from '../constants/bookingConstants';

const { API_BASE_URL, PAGE_SIZE, MAX_FETCH_SIZE } = BOOKING_CONSTANTS;

// ------------------- API Service Functions -------------------

export const bookingService = {
  // Fetch Bookings
  async fetchBookings(params: {
    tenantId: number;
    page: number;
    search?: string;
    statusFilter?: string;
    branchId?: number | null;
    language: string;
  }) {
    const { tenantId, page, search, statusFilter, branchId, language } = params;
    
    const queryParams = new URLSearchParams({
      tenant_id: tenantId.toString(),
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...(search && { search }),
      sortBy: 'created_at',
      sortOrder: 'desc',
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(branchId !== null && { branch_id: String(branchId) }),
    });

    const response = await fetch(`${API_BASE_URL}/bookings?${queryParams}`, {
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));

    return {
      data: Array.isArray(data?.data) ? data.data : [],
      totalPages: typeof data?.totalPages === 'number' ? data.totalPages : 1,
      totalCount: typeof data?.count === 'number' ? data.count : 0,
    };
  },

  // Fetch Booking Details
  async fetchBookingDetails(bookingId: number, tenantId: number, language: string): Promise<BookingDB> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}?tenant_id=${tenantId}`,
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

    return data;
  },

  // Fetch Customers
  async fetchCustomers(tenantId: number, language: string): Promise<Customer[]> {
    const params = new URLSearchParams({
      tenant_id: tenantId.toString(),
      page: '1',
      pageSize: String(MAX_FETCH_SIZE),
    });

    const response = await fetch(`${API_BASE_URL}/customers?${params}`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });

    const data = await response.json().catch(() => ({}));
    return Array.isArray(data?.data) ? data.data : [];
  },

  // Fetch Vehicles
  async fetchVehicles(tenantId: number, language: string): Promise<Vehicle[]> {
    const params = new URLSearchParams({
      tenant_id: tenantId.toString(),
      status: 'available',
      page: '1',
      pageSize: String(MAX_FETCH_SIZE),
    });

    const response = await fetch(`${API_BASE_URL}/vehicles?${params}`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });

    const data = await response.json().catch(() => ({}));
    return Array.isArray(data?.data) ? data.data : [];
  },

  // Fetch Tenants
  async fetchTenants(language: string): Promise<Tenant[]> {
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) throw new Error('Failed to fetch tenants');
    
    const data = await response.json();
    return data.data || [];
  },

  // Fetch Branches
  async fetchBranches(tenantId: number, language: string): Promise<Branch[]> {
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
    return data.data || [];
  },

  // Save Booking (Create or Update)
  async saveBooking(formData: BookingForm, isEditing: boolean, language: string) {
    const endpoint = isEditing && formData.id
      ? `${API_BASE_URL}/bookings/${formData.id}`
      : `${API_BASE_URL}/bookings`;

    const method = isEditing ? 'PUT' : 'POST';

    console.log('Saving booking:', { endpoint, method, formData });

    const response = await fetch(endpoint, {
      method,
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json().catch(() => ({}));

    console.log('Response:', { status: response.status, data });

    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Save failed');
    }

    return data;
  },

  // Delete Single Booking
  async deleteBooking(id: number, tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (!response.ok) throw new Error(await response.text());
  },

  // Bulk Delete Bookings
  async bulkDeleteBookings(bookingIds: number[], tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, booking_ids: bookingIds }),
    });

    if (!response.ok) throw new Error(await response.text());
  },

  // Submit Payment
  async submitPayment(paymentData: PaymentData & { tenant_id: number }, language: string) {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept-language': language,
      },
      body: JSON.stringify({
        tenant_id: paymentData.tenant_id,
        customer_id: paymentData.customer_id,
        booking_id: paymentData.booking_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        is_deposit: paymentData.is_deposit,
        partial_amount: paymentData.partial_amount,
        paid_amount: Number(paymentData.late_fee) + Number(
          paymentData.partial_amount > 0 ? paymentData.partial_amount : paymentData.amount
        ),
        late_fee: paymentData.late_fee,
        split_details: paymentData.split_details,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Payment failed');
    }

    return data;
  },
};