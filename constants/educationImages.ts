import { ImageSourcePropType } from 'react-native';
import { getStorageImageUrl } from './config';

/**
 * Resolves an article's image source to fetch from the backend via the public/storage bridge.
 * E.g., 'uploads/education/fire_season_safety.jpg' -> 'http://domain/storage/uploads/education/fire_season_safety.jpg'
 */
export const getArticleImageSource = (imagePath?: string | null): ImageSourcePropType | null => {
  const uri = getStorageImageUrl(imagePath);
  return uri ? { uri } : null;
};
