import { getStorageImageUrl } from '../constants/config';

/**
 * Resolves a user's profile image path into an absolute URI usable by React Native <Image />.
 *
 * Handles:
 * - Local file picker URIs (file://...)
 * - Full HTTP / HTTPS remote URLs
 * - Relative server paths (uploads/profiles/...) prefixed with APP_CONFIG.API_BASE_URL/storage/
 */
export const getProfileImageUri = (imagePath?: string | null): string | null => {
  return getStorageImageUrl(imagePath);
};
