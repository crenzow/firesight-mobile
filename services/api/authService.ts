import { apiClient } from './client';
import { AuthResponse, GoogleAuthResponse, LoginPayload, RegisterPayload } from './types';

/**
 * All auth-related REST calls live here so screens only ever call
 * authService.xxx(...) and never touch fetch/apiClient directly.
 * Matching PHP endpoints (Phase 2): /modules/auth/*.php
 */
export const authService = {
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/auth/login.php', payload, false),

  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register.php', payload, false),

  loginWithGoogle: (payload: { id_token?: string; access_token?: string; token?: string; google_id?: string; email?: string; first_name?: string; last_name?: string; profile_image?: string }) =>
    apiClient.post<GoogleAuthResponse>('/auth/google_login.php', payload, false),

  requestPasswordReset: (email: string) =>
    apiClient.post<{ message: string; email?: string; dev_otp?: string }>(
      '/auth/forgot_password.php',
      { email },
      false
    ),

  verifyOtp: (email: string, otp: string) =>
    apiClient.post<{ valid: boolean; message: string }>(
      '/auth/verify_otp.php',
      { email, otp },
      false
    ),

  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) =>
    apiClient.post<{ message: string }>(
      '/auth/reset_password.php',
      { email, otp, new_password: newPassword },
      false
    ),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>(
      '/auth/reset_password.php',
      { token, new_password: newPassword },
      false
    ),

  logout: () => apiClient.post<{ message: string }>('/auth/logout.php', {}),
};
