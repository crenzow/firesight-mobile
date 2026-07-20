import { apiClient } from './client';
import { AppUser } from './types';

export interface UpdateProfilePayload {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  contact_number?: string;
  house_no_street?: string;
  barangay_id?: number;
}

export const profileService = {
  get: () => apiClient.get<AppUser>('/profile/get.php'),
  update: (payload: UpdateProfilePayload) => apiClient.put<AppUser>('/profile/update.php', payload),
};