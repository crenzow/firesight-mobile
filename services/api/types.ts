export type UserRole = 'admin' | 'personnel' | 'resident';

export interface AppUser {
  user_id: number;
  role: UserRole;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  contact_number?: string | null;
  email: string;
  profile_image?: string | null;
  is_accepted: boolean;
  address?: {
    house_no_street?: string | null;
    barangay_id?: number | null;
    barangay_name?: string | null;
    municipality: string;
    province: string;
  };
  personnel_details?: {
    rank: string;
    station_assigned: string;
    employee_number: string;
  } | null;
}

export interface RegisterPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  mobile_number: string;
  house_no_street?: string;
  barangay_id: number;
  municipality: string;
  province: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AppUser;
}