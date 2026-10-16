import { APP_CONFIG } from '../constants/config';

/**
 * Resolves a user's profile image path into an absolute URI usable by React Native <Image />.
 *
 * Handles:
 * - Local file picker URIs (file://...)
 * - Full HTTP / HTTPS remote URLs
 * - Relative server paths (uploads/profiles/...) prefixed with APP_CONFIG.API_BASE_URL
 */
export const getProfileImageUri = (imagePath?: string | null): string | null => {
  if (!imagePath) return null;

  if (
    imagePath.startsWith('file://') ||
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  const cleanBase = (APP_CONFIG.API_BASE_URL || '').replace(/\/+$/, '');
  const cleanPath = imagePath.replace(/^\/+/, '');

  return cleanBase ? `${cleanBase}/${cleanPath}` : null;
};
