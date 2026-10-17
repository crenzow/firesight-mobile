import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_STORAGE_KEY = '@firesight_bookmarked_articles';

// Simple in-memory subscriber set to sync bookmark state across screens without redux
type Listener = (ids: number[]) => void;
const listeners = new Set<Listener>();

let memoryIds: number[] | null = null;

const notifyListeners = (ids: number[]) => {
  memoryIds = ids;
  listeners.forEach((listener) => listener(ids));
};

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(memoryIds ?? []);

  useEffect(() => {
    // Sync with memory if available, otherwise read from disk
    if (memoryIds !== null) {
      setBookmarkedIds(memoryIds);
    } else {
      AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY)
        .then((raw) => {
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                notifyListeners(parsed);
                return;
              }
            } catch {}
          }
          notifyListeners([]);
        })
        .catch(() => notifyListeners([]));
    }

    const listener: Listener = (ids) => {
      setBookmarkedIds(ids);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isBookmarked = useCallback(
    (contentId: number) => {
      return bookmarkedIds.includes(contentId);
    },
    [bookmarkedIds]
  );

  const toggleBookmark = useCallback(
    async (contentId: number): Promise<boolean> => {
      const exists = bookmarkedIds.includes(contentId);
      const next = exists
        ? bookmarkedIds.filter((id) => id !== contentId)
        : [...bookmarkedIds, contentId];

      notifyListeners(next);
      try {
        await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to save bookmark to storage', err);
      }
      return !exists;
    },
    [bookmarkedIds]
  );

  return {
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
  };
}
