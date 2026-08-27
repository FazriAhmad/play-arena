import type { StaffRole } from './types';

export type NavKey =
  | 'dashboard'
  | 'venues'
  | 'courts'
  | 'schedule'
  | 'bookings'
  | 'payments'
  | 'reports'
  | 'customers'
  | 'broadcast'
  | 'staff';

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: 'Pemilik',
  admin: 'Admin Venue',
  kasir: 'Kasir',
  staff: 'Staff',
};

export const ROLE_PERMISSIONS: Record<StaffRole, NavKey[]> = {
  owner: [
    'dashboard',
    'venues',
    'courts',
    'schedule',
    'bookings',
    'payments',
    'reports',
    'customers',
    'broadcast',
    'staff',
  ],
  admin: [
    'dashboard',
    'venues',
    'courts',
    'schedule',
    'bookings',
    'payments',
    'reports',
    'customers',
    'broadcast',
  ],
  kasir: ['dashboard', 'bookings', 'payments', 'customers'],
  staff: ['dashboard', 'bookings', 'schedule'],
};

export const canAccess = (role: StaffRole, key: NavKey) =>
  ROLE_PERMISSIONS[role].includes(key);
