/**
 * FireSight color palette
 * Brand direction: dark navy (trust/authority) + fire orange (urgency/action).
 * Each mode exports a full semantic token set so components never hardcode hex values.
 */

export type ThemeMode = 'light' | 'blackDark' | 'dimDark';

export interface ColorTokens {
  // Brand
  brandNavy: string;
  brandNavyDeep: string;
  brandOrange: string;
  brandOrangeDeep: string;

  // Surfaces
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  textMuted: string;

  // Status
  success: string;
  warning: string;
  danger: string;
  info: string;

  // Risk levels (map)
  riskLow: string;
  riskModerate: string;
  riskHigh: string;

  // Misc
  overlay: string;
  disabled: string;
  tabInactive: string;
}

const shared = {
  brandNavy: '#0F1C3F',
  brandNavyDeep: '#0A1330',
  brandOrange: '#F4622B',
  brandOrangeDeep: '#D8491A',
  success: '#1FA35C',
  warning: '#E8A33D',
  danger: '#E14245',
  info: '#3B82C4',
  riskLow: '#2FA65A',
  riskModerate: '#E8A33D',
  riskHigh: '#E14245',
};

export const lightColors: ColorTokens = {
  ...shared,
  background: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E3E6ED',
  textPrimary: '#101827',
  textSecondary: '#5B6479',
  textInverse: '#FFFFFF',
  textMuted: '#8992A6',
  overlay: 'rgba(15, 28, 63, 0.55)',
  disabled: '#C7CBD6',
  tabInactive: '#9BA3B7',
};

export const blackDarkColors: ColorTokens = {
  ...shared,
  background: '#000000',
  surface: '#111318',
  surfaceElevated: '#1A1D24',
  border: '#26292F',
  textPrimary: '#F5F6FA',
  textSecondary: '#A6ACBC',
  textInverse: '#FFFFFF',
  textMuted: '#6B7280',
  overlay: 'rgba(0, 0, 0, 0.65)',
  disabled: '#3A3D45',
  tabInactive: '#6B7280',
};

export const dimDarkColors: ColorTokens = {
  ...shared,
  background: '#151A2E',
  surface: '#1D2340',
  surfaceElevated: '#252B4D',
  border: '#323A5E',
  textPrimary: '#F5F6FA',
  textSecondary: '#AAB0C8',
  textInverse: '#FFFFFF',
  textMuted: '#7C82A0',
  overlay: 'rgba(10, 15, 40, 0.65)',
  disabled: '#3E4568',
  tabInactive: '#7C82A0',
};

export const getColorsForMode = (mode: ThemeMode): ColorTokens => {
  switch (mode) {
    case 'blackDark':
      return blackDarkColors;
    case 'dimDark':
      return dimDarkColors;
    case 'light':
    default:
      return lightColors;
  }
};