import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTokens, ThemeMode, getColorsForMode } from './colors';
import { typography } from './typography';
import { spacing, radius, shadow } from './spacing';

// User-facing preference. "system" follows the OS; the other three are explicit choices.
export type ThemePreference = 'system' | 'light' | 'blackDark' | 'dimDark';

const STORAGE_KEY = 'firesight.themePreference';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedMode: ThemeMode;
  colors: ColorTokens;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const resolveMode = (preference: ThemePreference, systemScheme: ColorSchemeName): ThemeMode => {
  if (preference === 'system') {
    // Default OS dark preference maps to the "Dim Dark" variant, the more comfortable default.
    return systemScheme === 'dark' ? 'dimDark' : 'light';
  }
  return preference;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setPreferenceState(saved as ThemePreference);
      } finally {
        setIsLoading(false);
      }
    })();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {
      // Non-fatal: preference simply won't persist across app restarts.
    });
  };

  const resolvedMode = useMemo(() => resolveMode(preference, systemScheme), [preference, systemScheme]);
  const colors = useMemo(() => getColorsForMode(resolvedMode), [resolvedMode]);

  const value: ThemeContextValue = {
    preference,
    resolvedMode,
    colors,
    typography,
    spacing,
    radius,
    shadow,
    isDark: resolvedMode !== 'light',
    setPreference,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};