// constants/payment.constants.ts

import { PaymentStatus } from '../types/paymentTypes';

export const API_BASE_URL = '/api/v1/admin';
export const PAGE_SIZE = 10;
export const SUPER_ADMIN_ROLE_ID = 9;

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'pending',
  'completed',
  'failed',
  'refunded',
];