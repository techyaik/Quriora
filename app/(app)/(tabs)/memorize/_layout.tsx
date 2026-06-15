import { Stack } from 'expo-router';
import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';
import { SharedHeader } from '@/src/components/SharedHeader';

export default function MemorizeLayout() {
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
          title: 'Memorize',
        }} 
      />
    </Stack>
  );
}
