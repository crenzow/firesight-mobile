import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/api/authService';
import { secureStorage } from '../services/storage/secureStorage';
import { ApiError } from '../services/api/client';
import { AppUser, LoginPayload, RegisterPayload } from '../services/api/types';

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean; // true while we check for a saved session on app launch
  isSubmitting: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On app launch, restore session from secure storage rather than
  // forcing the resident to log in every time they open the app.
  useEffect(() => {
    (async () => {
      try {
        const [token, savedUser] = await Promise.all([secureStorage.getToken(), secureStorage.getUser<AppUser>()]);
        if (token && savedUser) setUser(savedUser);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      await secureStorage.setToken(response.token);
      await secureStorage.setUser(response.user);
      setUser(response.user);
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
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};