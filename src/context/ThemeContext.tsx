import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark' | 'sepia';

interface ThemeContextType {
  theme: Theme;
  fontSize: number;
  showTajweed: boolean;
  showTranslation: boolean;
  showTransliteration: boolean;
  isLoading: boolean;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setShowTajweed: (show: boolean) => void;
  setShowTranslation: (show: boolean) => void;
  setShowTransliteration: (show: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [fontSize, setFontSizeState] = useState<number>(28);
  const [showTajweed, setShowTajweedState] = useState<boolean>(true);
  const [showTranslation, setShowTranslationState] = useState<boolean>(true);
  const [showTransliteration, setShowTransliterationState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('nurquran-theme');
        const storedFontSize = await AsyncStorage.getItem('nurquran-font-size');
        const storedTajweed = await AsyncStorage.getItem('nurquran-show-tajweed');
        const storedTranslation = await AsyncStorage.getItem('nurquran-show-translation');
        const storedTransliteration = await AsyncStorage.getItem('nurquran-show-transliteration');

        if (storedTheme) setThemeState(storedTheme as Theme);
        if (storedFontSize) setFontSizeState(parseInt(storedFontSize));
        if (storedTajweed) setShowTajweedState(storedTajweed !== 'false');
        if (storedTranslation) setShowTranslationState(storedTranslation !== 'false');
        if (storedTransliteration) setShowTransliterationState(storedTransliteration === 'true');
      } catch (err) {
        console.warn('Error loading theme settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadThemeSettings();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('nurquran-theme', newTheme);
    } catch (e) {
      console.warn(e);
    }
  };

  const setFontSize = async (size: number) => {
    const clampedSize = Math.max(18, Math.min(52, size));
    setFontSizeState(clampedSize);
    try {
      await AsyncStorage.setItem('nurquran-font-size', clampedSize.toString());
    } catch (e) {
      console.warn(e);
    }
  };

  const setShowTajweed = async (show: boolean) => {
    setShowTajweedState(show);
    try {
      await AsyncStorage.setItem('nurquran-show-tajweed', show.toString());
    } catch (e) {
      console.warn(e);
    }
  };

  const setShowTranslation = async (show: boolean) => {
    setShowTranslationState(show);
    try {
      await AsyncStorage.setItem('nurquran-show-translation', show.toString());
    } catch (e) {
      console.warn(e);
    }
  };

  const setShowTransliteration = async (show: boolean) => {
    setShowTransliterationState(show);
    try {
      await AsyncStorage.setItem('nurquran-show-transliteration', show.toString());
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      fontSize,
      showTajweed,
      showTranslation,
      showTransliteration,
      isLoading,
      setTheme,
      setFontSize,
      setShowTajweed,
      setShowTranslation,
      setShowTransliteration
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
