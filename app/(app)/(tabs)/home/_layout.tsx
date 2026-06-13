import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, View, Text } from 'react-native';
import { Menu, Settings, HandHeart } from 'lucide-react-native';
import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';
import { useDrawerContext } from '@/src/context/DrawerContext';

export default function HomeLayout() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const { openDrawer } = useDrawerContext();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '800' },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks & Notes' }} />
    </Stack>
  );
}
