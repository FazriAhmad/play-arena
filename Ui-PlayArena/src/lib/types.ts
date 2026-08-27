export type Role = 'owner' | 'staff' | 'pelanggan';

export interface Venue {
  id: number;
  name: string;
  city: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role: Role;
  venue_ids: number[];
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  venues: Venue[];
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner / Admin',
  staff: 'Staff / Kasir',
  pelanggan: 'Pelanggan',
};
