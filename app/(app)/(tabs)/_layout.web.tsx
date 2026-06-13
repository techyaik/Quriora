import { Tabs } from 'expo-router';
import { BookOpen, Compass, Headphones, Home, Medal } from 'lucide-react-native';

import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';

const TAB_BAR_HEIGHT = 64;

export default function WebTabLayout() {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        sceneStyle: {
          paddingBottom: TAB_BAR_HEIGHT,
          backgroundColor: colors.bgPrimary,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: TAB_BAR_HEIGHT,
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={20} color={color} /> }} />
      <Tabs.Screen name="quran" options={{ title: 'Quran', tabBarIcon: ({ color }) => <BookOpen size={20} color={color} /> }} />
      <Tabs.Screen name="listen" options={{ title: 'Listen', tabBarIcon: ({ color }) => <Headphones size={20} color={color} /> }} />
      <Tabs.Screen name="memorize" options={{ title: 'Memorize', tabBarIcon: ({ color }) => <Medal size={20} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color }) => <Compass size={20} color={color} /> }} />
    </Tabs>
  );
}
