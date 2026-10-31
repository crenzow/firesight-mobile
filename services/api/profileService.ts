import { apiClient } from './client';
import { AppUser } from './types';

export interface UpdateProfilePayload {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  suffix?: string | null;
  contact_number?: string;
  password?: string;
  current_password?: string;
  house_no_street?: string;
  barangay_id?: number;
  photoUri?: string;
  remove_photo?: boolean;
}

export const profileService = {
  get: () => apiClient.get<AppUser>('/profile/get.php'),

  update: async (payload: UpdateProfilePayload): Promise<AppUser> => {
    // If a photo was selected locally, use multipart FormData
    if (payload.photoUri && (payload.photoUri.startsWith('file://') || payload.photoUri.startsWith('content://'))) {
      const formData = new FormData();

      const filename = payload.photoUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match?.[1]?.toLowerCase() ?? 'jpg';
      const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      formData.append('profile_image', {
        uri: payload.photoUri,
        name: filename,
        type,
      } as any);

      if (payload.first_name !== undefined) formData.append('first_name', payload.first_name);
      if (payload.middle_name !== undefined) formData.append('middle_name', payload.middle_name ?? '');
      if (payload.last_name !== undefined) formData.append('last_name', payload.last_name);
      if (payload.suffix !== undefined) formData.append('suffix', payload.suffix ?? '');
      if (payload.contact_number !== undefined) formData.append('contact_number', payload.contact_number);
      if (payload.password !== undefined && payload.password.trim() !== '') {
        formData.append('password', payload.password);
      }
      if (payload.current_password !== undefined && payload.current_password.trim() !== '') {
        formData.append('current_password', payload.current_password);
      }
      if (payload.house_no_street !== undefined) formData.append('house_no_street', payload.house_no_street);
      if (payload.barangay_id !== undefined) formData.append('barangay_id', String(payload.barangay_id));

      return apiClient.postForm<AppUser>('/profile/update.php', formData);
    }

    // Otherwise standard JSON PUT request
    const { photoUri, ...jsonPayload } = payload;
    return apiClient.put<AppUser>('/profile/update.php', jsonPayload);
  },

  uploadPhoto: async (photoUri: string): Promise<AppUser> => {
    const formData = new FormData();
    const filename = photoUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match?.[1]?.toLowerCase() ?? 'jpg';
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    formData.append('profile_image', {
      uri: photoUri,
      name: filename,
      type,
    } as any);

    return apiClient.postForm<AppUser>('/profile/upload_photo.php', formData);
  },

  deletePhoto: async (): Promise<AppUser> => {
    return apiClient.put<AppUser>('/profile/update.php', { remove_photo: true });
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/profile/delete_account.php', {});
  },
};