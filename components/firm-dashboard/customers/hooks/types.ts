export type CustomerStatus = 'active' | 'deleted' | 'blacklisted';
export type CustomerType = 'individual' | 'corporate';
export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'vip';
export type Gender = 'male' | 'female';
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

  // نظام الولاء
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