import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuthContext } from '@/src/context/AuthContext';
import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';

export default function AppLayout() {
  const { token, isGuest, isLoading } = useAuthContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!token && !isGuest) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
