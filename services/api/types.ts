export type UserRole = 'resident' | 'bfp_personnel' | 'bfp_admin';

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
    duty_group?: string | null;
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
  password?: string;
  google_id?: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
  google_id?: string;
}

export interface AuthResponse {
  token: string;
  user: AppUser;
}

export interface GoogleAuthResponse {
  is_new_user: boolean;
  requires_completion?: boolean;
  token?: string;
  user?: AppUser;
  google_user?: {
    user_id?: number;
    google_id: string;
    email: string;
    first_name: string;
    last_name: string;
    contact_number?: string | null;
    profile_image?: string | null;
  };
}