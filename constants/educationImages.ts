import { ImageSourcePropType } from 'react-native';
import { APP_CONFIG } from './config';

/**
 * Resolves an article's image source to fetch directly from the backend uploads directory.
 * E.g., 'uploads/education/fire_season_safety.jpg' -> 'http://192.168.1.5/firesight-api/uploads/education/fire_season_safety.jpg'
 */
export const getArticleImageSource = (imagePath?: string | null): ImageSourcePropType | null => {
  if (!imagePath) return null;

  // 1. If it's already a full URL (http:// or https://)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return { uri: imagePath };
  }

  // 2. Fetch directly from the backend uploads directory
  if (APP_CONFIG.API_BASE_URL) {
    const cleanBase = APP_CONFIG.API_BASE_URL.replace(/\/+$/, '');
    const cleanPath = imagePath.replace(/^\/+/, '');
    return { uri: `${cleanBase}/${cleanPath}` };
  }

  return null;
};
