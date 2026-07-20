import * as SecureStore from 'expo-secure-store';

/**
 * Wraps expo-secure-store so the rest of the app never touches the raw API
 * directly. Keeps a single, swappable place for how/where the auth token
 * and lightweight session data are persisted.
 */

const AUTH_TOKEN_KEY = 'firesight_auth_token';
const AUTH_USER_KEY = 'firesight_auth_user';

export const secureStorage = {
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  },

  async clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  },

  async setUser(user: any): Promise<void> {
    await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
  },

  async getUser<T = any>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async clearUser(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
  },

  async clearAll(): Promise<void> {
    await Promise.all([this.clearToken(), this.clearUser()]);
  },
};