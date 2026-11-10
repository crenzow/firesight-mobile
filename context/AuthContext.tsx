import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/api/authService';
import { secureStorage } from '../services/storage/secureStorage';
import { ApiError } from '../services/api/client';
import { AppUser, AuthResponse, GoogleAuthResponse, LoginPayload, RegisterPayload } from '../services/api/types';

import { profileService } from '../services/api/profileService';

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean; // true while we check for a saved session on app launch
  isSubmitting: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<AppUser>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  loginWithGoogle: (payload: {
    id_token?: string;
    access_token?: string;
    token?: string;
    google_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image?: string;
  }) => Promise<GoogleAuthResponse>;
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
      if (response.token && response.user) {
        await secureStorage.setToken(response.token);
        await secureStorage.setUser(response.user);
        setUser(response.user);
        return response.user;
      }
      throw new Error('Authentication succeeded without a user profile.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in right now. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthResponse> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      // For immediate accounts (e.g. Google or instant activation)
      if (response.token && response.user) {
        await secureStorage.setToken(response.token);
        await secureStorage.setUser(response.user);
        setUser(response.user);
      }
      // For cache-first pending email verification accounts, response.pending is true
      // and token/user are deliberately not persisted until email verification link is clicked.
      return response;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create your account right now. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const loginWithGoogle = useCallback(
    async (payload: {
      id_token?: string;
      access_token?: string;
      token?: string;
      google_id?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image?: string;
    }): Promise<GoogleAuthResponse> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const response = await authService.loginWithGoogle(payload);
        if (!response.is_new_user && response.token && response.user) {
          await secureStorage.setToken(response.token);
          await secureStorage.setUser(response.user);
          setUser(response.user);
        }
        return response;
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Google sign in failed. Please try again.';
        setError(msg);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

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
    loginWithGoogle,
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
