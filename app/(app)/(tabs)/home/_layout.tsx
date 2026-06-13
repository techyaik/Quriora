import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home Dashboard' }} />
      <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks & Notes' }} />
    </Stack>
  );
}
