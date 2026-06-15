import { Stack } from 'expo-router';

import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';
import { SharedHeader } from '@/src/components/SharedHeader';

export default function QuranLayout() {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  return (
    <Stack
      screenOptions={{
        header: (props) => <SharedHeader {...props} />,
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '800' },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Quran Index',
        }} 
      />
      <Stack.Screen name="surah/[id]" options={{ title: 'Quran Reader' }} />
    </Stack>
  );
}
