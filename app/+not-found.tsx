import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundRoute() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Text selectable style={{ fontSize: 18, fontWeight: '700' }}>This page does not exist.</Text>
      <Link href="/">Return home</Link>
    </View>
  );
}
