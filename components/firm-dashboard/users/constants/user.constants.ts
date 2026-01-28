// ================= User Management Constants =================

export const PAGE_SIZE = 6;
export const API_BASE_URL = '/api/v1/admin';

export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  PENDING_VERIFICATION: 'pending_verification',
  PENDING_APPROVAL: 'pending_approval',
  DELETED: 'deleted',
} as const;