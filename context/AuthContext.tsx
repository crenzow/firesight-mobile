import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/api/authService';
import { secureStorage } from '../services/storage/secureStorage';
import { ApiError } from '../services/api/client';
import { AppUser, LoginPayload, RegisterPayload } from '../services/api/types';

import { profileService } from '../services/api/profileService';

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean; // true while we check for a saved session on app launch
  isSubmitting: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<AppUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: AppUser) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On app launch, restore session from secure storage.
  // Validate against the current database: if the database changed or the token
  // expired (401), automatically clear the session and return to the login screen.
  useEffect(() => {
    (async () => {
      try {
        const [token, savedUser] = await Promise.all([secureStorage.getToken(), secureStorage.getUser<AppUser>()]);
        if (token && savedUser) {
          try {
            const verified = await profileService.get();
            setUser(verified);
            await secureStorage.setUser(verified);
          } catch (err: any) {
            if (err?.status === 401 || err?.status === 403 || err?.status === 404) {
              await Promise.all([secureStorage.clearToken(), secureStorage.clearUser()]);
              setUser(null);
            } else {
              // Retain cached user if offline or network unreachable
              setUser(savedUser);
            }
          }
        }
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const updateUser = useCallback(async (updatedUser: AppUser) => {
    setUser(updatedUser);
    await secureStorage.setUser(updatedUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updated = await profileService.get();
      setUser(updated);
      await secureStorage.setUser(updated);
    } catch {
      // Ignore network errors when refreshing in background
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AppUser> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      await secureStorage.setToken(response.token);
      await secureStorage.setUser(response.user);
      setUser(response.user);
      return response.user;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in right now. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      await secureStorage.setToken(response.token);
      await secureStorage.setUser(response.user);
      setUser(response.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create your account right now. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if the server call fails (e.g. offline), we still clear the local session below.
    } finally {
      await secureStorage.clearAll();
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isBootstrapping,
    isSubmitting,
    error,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};