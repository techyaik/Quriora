import { Redirect, Stack } from 'expo-router';

import { useAuthContext } from '@/src/context/AuthContext';

export default function AuthLayout() {
  const { token, isGuest, isLoading } = useAuthContext();

  if (!isLoading && (token || isGuest)) {
    return <Redirect href="/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
