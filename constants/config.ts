/**
 * Centralized environment configuration.
 *
 * API_BASE_URL is read from process.env.EXPO_PUBLIC_API_BASE_URL, which
 * Expo automatically inlines from a .env file at the project root — no
 * extra package needed (built into Expo SDK 49+). See .env.example.
 *
 * Note: Expo only reads .env files when the dev server STARTS, so after
 * creating/editing .env you must restart with `npx expo start -c`.
 */

const envApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (__DEV__ && !envApiUrl) {
  console.warn('[APP_CONFIG] EXPO_PUBLIC_API_BASE_URL is missing in .env');
}

export const APP_CONFIG = {
  API_BASE_URL: envApiUrl ?? '',
  APP_NAME: 'FireSight',
  APP_VERSION: '1.0.0',
  DEFAULT_MUNICIPALITY: 'Lian',
  DEFAULT_PROVINCE: 'Batangas',
  SUPPORT_EMAIL: 'support@firesight.gov.ph',
};

/**
 * Resolves a backend storage path (e.g. 'uploads/...') to an absolute URL via the public/storage bridge.
 */
export const getStorageImageUrl = (imagePath?: string | null): string | null => {
  if (!imagePath) return null;
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('file://') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }
  const cleanBase = (APP_CONFIG.API_BASE_URL || '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');
  const cleanPath = imagePath.replace(/^\/+/, '');
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return cleanBase ? `${cleanBase}/${storagePath}` : null;
};