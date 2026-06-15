import { StyleSheet } from 'react-native';

export const themeColors = {
  light: {
    bgPrimary: '#F7F4EF',
    bgSecondary: '#E8EDE9',
    bgTertiary: '#F1ECE2',
    bgCard: '#FFFFFF',
    textPrimary: '#1A2421',
    textSecondary: '#5A6B66',
    textTertiary: '#9BAAA5',
    accent: '#1A7A5E',
    accentLight: '#E8F5F1',
    accentGlow: 'rgba(26, 122, 94, 0.15)',
    gold: '#C9963A',
    goldLight: '#FBF3E4',
    border: '#E8EDE9',
    borderCard: '#E8EDE9',
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

export const AUDIO_BAR_HEIGHT = 68;
export const SCREEN_MAX_WIDTH = 760;
export const SCREEN_HORIZONTAL_PADDING = 16;
export const MIN_TOUCH_TARGET = 44;

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
    boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
    borderRadius: 24,
    backgroundColor: '#FAFAF8',
  },
  liquidGlassSm: {
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    borderRadius: 18,
    backgroundColor: '#FAFAF8',
  }
});
