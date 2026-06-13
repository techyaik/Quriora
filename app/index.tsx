import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuthContext } from '@/src/context/AuthContext';

export default function IndexRoute() {
  const { token, isGuest, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1A8A4A" />
      </View>
    );
  }

  return <Redirect href={token || isGuest ? '/home' : '/login'} />;
}
