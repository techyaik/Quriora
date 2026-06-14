import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';

export default function ExploreLayout() {
  const router = useRouter();
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
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 8 }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/explore/settings')}
              style={{ marginRight: 8, padding: 8 }}
              activeOpacity={0.7}
            >
              <Settings size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="search" options={{ title: 'Quran Search' }} />
      <Stack.Screen
        name="topics"
        options={{
          title: 'Explore By Topic',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 8 }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/explore/settings')}
              style={{ marginRight: 8, padding: 8 }}
              activeOpacity={0.7}
            >
              <Settings size={22} color={colors.accent} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="topic/[id]" options={{ title: 'Hadith Topic', headerTitleAlign: 'center' }} />
      <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks & Notes' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="about" options={{ title: 'About Quriora' }} />
      <Stack.Screen name="attributions" options={{ title: 'Attributions' }} />
    </Stack>
  );
}
