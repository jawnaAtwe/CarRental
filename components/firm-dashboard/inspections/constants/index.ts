// ==================== API & Config ====================
export const API_BASE_URL = '/api/v1/admin';
export const PAGE_SIZE = 6;
export const SUPER_ADMIN_ROLE_ID = 9;

// ==================== Damage Options ====================
export const DAMAGE_TYPES = {
  scratch: { ar: 'خدش', en: 'Scratch' },
  dent: { ar: 'انبعاج', en: 'Dent' },
  crack: { ar: 'تصدع', en: 'Crack' },
  broken: { ar: 'كسر', en: 'Broken' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const DAMAGE_SEVERITIES = {
  minor: { ar: 'طفيف', en: 'Minor' },
  medium: { ar: 'متوسط', en: 'Medium' },
  severe: { ar: 'شديد', en: 'Severe' },
};

export const CLAIM_STATUSES = {
  not_submitted: { ar: 'قيد الانتظار', en: 'Not Submitted' },
  submitted: { ar: 'تم الإرسال', en: 'Submitted' },
  approved: { ar: 'معتمد', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
};

// ==================== Inspection Options ====================
export const INSPECTION_TYPES = {
  pre_rental: { ar: 'قبل الإيجار', en: 'Pre Rental' },
  post_rental: { ar: 'بعد الإيجار', en: 'Post Rental' },
};

export const INSPECTION_STATUSES = {
  all: { ar: 'الكل', en: 'All' },
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  completed: { ar: 'مكتمل', en: 'Completed' },
};

// ==================== Initial States ====================
export const INITIAL_DAMAGE_FORM = {
  damage_type: '',
  damage_severity: '',
  damage_location: '',
  description: '',
  estimated_cost: 0,
  final_cost: 0,
  insurance_required: false,
  insurance_provider: '',
  claim_number: '',
  claim_amount: '',
  claim_status: 'not_submitted',
};

export const INITIAL_INSPECTION_FORM = {
  booking_id: 0,
  vehicle_id: 0,
  inspection_type: 'pre_rental' as const,
  vehicle_name: '',
  status: 'pending' as const,
};