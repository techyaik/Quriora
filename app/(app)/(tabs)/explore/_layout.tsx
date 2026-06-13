import { Stack } from 'expo-router';

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Explore Hub' }} />
      <Stack.Screen name="search" options={{ title: 'Quran Search' }} />
      <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks & Notes' }} />
      <Stack.Screen name="settings" options={{ title: 'Preferences' }} />
    </Stack>
  );
}
