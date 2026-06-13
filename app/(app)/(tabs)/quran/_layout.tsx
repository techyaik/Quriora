import { Stack } from 'expo-router';

import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';

export default function QuranLayout() {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '800' },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Surah Index' }} />
      <Stack.Screen name="surah/[id]" options={{ title: 'Quran Reader' }} />
    </Stack>
  );
}
