// constants/vehicle.constants.ts

export const API_BASE_URL = '/api/v1/admin';
export const PAGE_SIZE = 6;

export const VEHICLE_CATEGORIES = [
  { key: 'Economy', ar: 'اقتصادي', en: 'Economy' },
  { key: 'SUV', ar: 'دفع رباعي', en: 'SUV' },
  { key: 'Luxury', ar: 'فاخر', en: 'Luxury' },
  { key: 'Convertible', ar: 'قابل للتحويل', en: 'Convertible' },
  { key: 'Van', ar: 'فان', en: 'Van' },
] as const;

export const VEHICLE_STATUSES = [
  { key: 'all', ar: 'الكل', en: 'All' },
  { key: 'available', ar: 'متاحة', en: 'Available' },
  { key: 'maintenance', ar: 'صيانة', en: 'Maintenance' },
  { key: 'rented', ar: 'مستأجرة', en: 'Rented' },
] as const;