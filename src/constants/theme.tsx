import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const makeTypography = (primary: string, secondary: string) => ({
  h1: { fontSize: 28, fontWeight: 'bold' as const, fontFamily: fonts.bold, letterSpacing: -0.6, color: primary },
  h2: { fontSize: 22, fontWeight: 'bold' as const, fontFamily: fonts.bold, letterSpacing: -0.4, color: primary },
  h3: { fontSize: 18, fontWeight: '600' as const, fontFamily: fonts.semibold, letterSpacing: -0.2, color: primary },
  subtitle: { fontSize: 15, fontWeight: '500' as const, fontFamily: fonts.medium, color: secondary },
  body: { fontSize: 14, fontWeight: '400' as const, fontFamily: fonts.regular, color: primary },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, fontFamily: fonts.regular, color: secondary },
  caption: { fontSize: 11, fontWeight: '400' as const, fontFamily: fonts.regular, color: secondary },
  amount: { fontSize: 30, fontWeight: 'bold' as const, fontFamily: fonts.bold, letterSpacing: -0.8, color: primary },
  amountLarge: { fontSize: 38, fontWeight: 'bold' as const, fontFamily: fonts.bold, letterSpacing: -1.2, color: primary },
});

export const lightTheme = {
  colors: {
    background: '#F8FAF9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceCard: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.85)',
    
    // Islamic Emerald
    primary: '#059669',
    primaryMuted: '#10B981',
    primaryDark: '#064E3B',
    primaryLight: '#ECFDF5',
    primaryGradient: ['#059669', '#10B981'] as readonly [string, string],
    heroGradient: ['#064E3B', '#059669'] as readonly [string, string],
    
    // Luxury Islamic Gold
    gold: '#D97706',
    goldLight: '#FEF3C7',
    goldDark: '#B45309',
    goldGradient: ['#F59E0B', '#FBBF24'] as readonly [string, string],
    goldHeroGradient: ['#B45309', '#D97706'] as readonly [string, string],
    
    accent: '#0D9488',
    income: '#10B981',
    expense: '#F43F5E',
    
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnGold: '#78350F',
    
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    glassBorder: 'rgba(5, 150, 105, 0.15)',
    
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    success: '#10B981',
    successLight: '#ECFDF5',
    info: '#0284C7',
    infoLight: '#F0F9FF',
    
    track: '#E2E8F0',
    glass: 'rgba(255, 255, 255, 0.7)',
    overlay: 'rgba(15, 23, 42, 0.6)',
    shimmer: 'rgba(5, 150, 105, 0.06)',
    inputFocus: 'rgba(5, 150, 105, 0.25)',
    cardGlow: 'rgba(5, 150, 105, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
    round: 9999,
  },
  shadow: {
    sm: {
      shadowColor: '#064E3B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#064E3B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    lg: {
      shadowColor: '#064E3B',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 10,
    },
    glow: {
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    goldGlow: {
      shadowColor: '#D97706',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 6,
    },
  },
  typography: makeTypography('#0F172A', '#475569'),
};

export const darkTheme = {
  colors: {
    background: '#041611',
    surface: '#07241C',
    surfaceElevated: '#0B3328',
    surfaceCard: '#08291F',
    surfaceGlass: 'rgba(11, 51, 40, 0.75)',
    
    // Islamic Emerald
    primary: '#10B981',
    primaryMuted: '#059669',
    primaryDark: '#047857',
    primaryLight: 'rgba(16, 185, 129, 0.15)',
    primaryGradient: ['#059669', '#10B981'] as readonly [string, string],
    heroGradient: ['#031A14', '#064E3B'] as readonly [string, string],
    
    // Luxury Islamic Gold
    gold: '#F59E0B',
    goldLight: 'rgba(245, 158, 11, 0.15)',
    goldDark: '#D97706',
    goldGradient: ['#F59E0B', '#FBBF24'] as readonly [string, string],
    goldHeroGradient: ['#78350F', '#B45309'] as readonly [string, string],
    
    accent: '#14B8A6',
    income: '#34D399',
    expense: '#FB7185',
    
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',
    textOnGold: '#78350F',
    
    border: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(16, 185, 129, 0.2)',
    
    danger: '#F87171',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.15)',
    success: '#34D399',
    successLight: 'rgba(52, 211, 153, 0.15)',
    info: '#38BDF8',
    infoLight: 'rgba(56, 189, 248, 0.15)',
    
    track: 'rgba(255, 255, 255, 0.1)',
    glass: 'rgba(255, 255, 255, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.8)',
    shimmer: 'rgba(16, 185, 129, 0.08)',
    inputFocus: 'rgba(16, 185, 129, 0.3)',
    cardGlow: 'rgba(16, 185, 129, 0.15)',
  },
  spacing: lightTheme.spacing,
  radius: lightTheme.radius,
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 5,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 7,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.55,
      shadowRadius: 20,
      elevation: 12,
    },
    glow: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    goldGlow: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  typography: makeTypography('#F1F5F9', '#94A3B8'),
};

export type Theme = typeof lightTheme;

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themePreference: 'light',
  setThemePreference: () => {},
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('light');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'light');

  useEffect(() => {
    AsyncStorage.getItem('app_theme_pref').then((saved) => {
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        setThemePreferenceState(saved);
      }
    });

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    AsyncStorage.setItem('app_theme_pref', pref).catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (themePreference === 'system') {
      return systemScheme === 'dark';
    }
    return themePreference === 'dark';
  }, [themePreference, systemScheme]);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setThemePreference, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
