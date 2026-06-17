import { Stack } from 'expo-router';
import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';
import { SharedHeader } from '@/src/components/SharedHeader';

export default function ExploreLayout() {
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
          headerShown: false,
        }}
      />
      <Stack.Screen name="search" options={{ title: 'Quran Search' }} />
      <Stack.Screen
        name="topics"
        options={{
          title: 'Explore By Topic',
        }}
      />
      <Stack.Screen name="topic/[id]" options={{ title: 'Hadith Topic' }} />
      <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks & Notes' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="about" options={{ title: 'About Quriora' }} />
      <Stack.Screen name="attributions" options={{ title: 'Attributions' }} />
    </Stack>
  );
}
