import { StyleSheet } from 'react-native';

export const themeColors = {
  light: {
    bgPrimary: '#FAFAF8',
    bgSecondary: '#F3EFE8',
    bgTertiary: '#EDE8DF',
    bgCard: 'rgba(255, 255, 255, 0.72)',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6560',
    textTertiary: '#9C9690',
    accent: '#1A8A4A',
    accentLight: '#E8F5EE',
    accentGlow: 'rgba(26, 138, 74, 0.15)',
    gold: '#C9A84C',
    goldLight: 'rgba(201, 168, 76, 0.12)',
    border: 'rgba(0, 0, 0, 0.08)',
    borderCard: 'rgba(255, 255, 255, 0.6)',
  },
  dark: {
    bgPrimary: '#0F1117',
    bgSecondary: '#181C26',
    bgTertiary: '#1E2333',
    bgCard: 'rgba(24, 28, 38, 0.80)',
    textPrimary: '#F0EDE8',
    textSecondary: '#8A8680',
    textTertiary: '#5A5652',
    accent: '#2ECC71',
    accentLight: 'rgba(46, 204, 113, 0.12)',
    accentGlow: 'rgba(46, 204, 113, 0.20)',
    gold: '#D4AF6A',
    goldLight: 'rgba(212, 175, 106, 0.12)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderCard: 'rgba(255, 255, 255, 0.10)',
  },
  sepia: {
    bgPrimary: '#F8F0E3',
    bgSecondary: '#EFE3CC',
    bgTertiary: '#E5D4B0',
    bgCard: 'rgba(248, 240, 227, 0.80)',
    textPrimary: '#3A2E1E',
    textSecondary: '#7A6850',
    textTertiary: '#A0886A',
    accent: '#5A6E32',
    accentLight: 'rgba(90, 110, 50, 0.12)',
    accentGlow: 'rgba(90, 110, 50, 0.15)',
    gold: '#B8862A',
    goldLight: 'rgba(184, 134, 42, 0.12)',
    border: 'rgba(90, 70, 30, 0.12)',
    borderCard: 'rgba(255, 240, 200, 0.60)',
  }
};

export type ActiveTheme = keyof typeof themeColors;

export const AUDIO_BAR_HEIGHT = 56;

export const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  fontArabic: {
    fontFamily: 'Amiri_400Regular',
    writingDirection: 'rtl',
  },
  fontArabicBold: {
    fontFamily: 'Amiri_700Bold',
    writingDirection: 'rtl',
  },
  fontUI: {
    fontFamily: 'Inter_400Regular',
  },
  fontUIMedium: {
    fontFamily: 'Inter_500Medium',
  },
  fontUIBold: {
    fontFamily: 'Inter_700Bold',
  },
  fontUIBlack: {
    fontFamily: 'Inter_900Black',
  },
  liquidGlass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderRadius: 24,
  },
  liquidGlassSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderRadius: 18,
  }
});
