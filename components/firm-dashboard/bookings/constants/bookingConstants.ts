// ------------------- Booking Constants -------------------

export const BOOKING_CONSTANTS = {
  PAGE_SIZE: 6,
  API_BASE_URL: '/api/v1/admin',
  MAX_FETCH_SIZE: 1000,
  DEBOUNCE_DELAY: 300,
} as const;

export const BOOKING_STATUS_OPTIONS = [
  { key: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending' },
  { key: 'confirmed', labelAr: 'مؤكد', labelEn: 'Confirmed' },
  { key: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled' },
  { key: 'completed', labelAr: 'مكتمل', labelEn: 'Completed' },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { key: 'cash', labelAr: 'كاش', labelEn: 'Cash' },
  { key: 'card', labelAr: 'بطاقة', labelEn: 'Card' },
  { key: 'bank_transfer', labelAr: 'تحويل بنكي', labelEn: 'Bank Transfer' },
  { key: 'online', labelAr: 'أونلاين', labelEn: 'Online' },
] as const;