import { apiClient } from './client';
import { AuthResponse, LoginPayload, RegisterPayload } from './types';

/**
 * All auth-related REST calls live here so screens only ever call
 * authService.xxx(...) and never touch fetch/apiClient directly.
 * Matching PHP endpoints (Phase 2): /modules/auth/*.php
 */
export const authService = {
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/auth/login.php', payload, false),

  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register.php', payload, false),

  loginWithGoogle: (idToken: string) =>
    apiClient.post<AuthResponse>('/auth/google_login.php', { id_token: idToken }, false),

  requestPasswordReset: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot_password.php', { email }, false),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>(
      '/auth/reset_password.php',
      { token, new_password: newPassword },
      false
    ),

  logout: () => apiClient.post<{ message: string }>('/auth/logout.php', {}),
};