import { Tabs } from 'expo-router';
import { BookOpen, Compass, Headphones, Home, Medal } from 'lucide-react-native';
import { View } from 'react-native';

import { BottomAudioBar } from '@/src/components/BottomAudioBar';
import { useAudioContext } from '@/src/context/AudioContext';
import { useThemeContext } from '@/src/context/ThemeContext';
import { AUDIO_BAR_HEIGHT, themeColors } from '@/src/styles/theme';

const TAB_BAR_HEIGHT = 78;
const ACTIVE_COLOR = '#087F7A';
const INACTIVE_COLOR = '#747673';
const BAR_BACKGROUND = '#F8F4EC';

export default function WebTabLayout() {
  const { theme } = useThemeContext();
  const { currentSurahId } = useAudioContext();
  const colors = themeColors[theme];

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        sceneStyle: {
          paddingBottom: TAB_BAR_HEIGHT + (currentSurahId ? AUDIO_BAR_HEIGHT : 0),
          backgroundColor: colors.bgPrimary,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: TAB_BAR_HEIGHT,
          backgroundColor: BAR_BACKGROUND,
          borderTopColor: '#DDD8CF',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarItemStyle: {
          flex: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen name="quran" options={{ title: 'Quran', tabBarIcon: ({ color }) => <BookOpen size={22} color={color} strokeWidth={1.7} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color }) => <Compass size={22} color={color} strokeWidth={1.7} /> }} />
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={23} color={color} strokeWidth={1.8} /> }} />
      <Tabs.Screen name="listen" options={{ title: 'Listen', tabBarIcon: ({ color }) => <Headphones size={22} color={color} strokeWidth={1.7} /> }} />
      <Tabs.Screen name="memorize" options={{ title: 'Memorize', tabBarIcon: ({ color }) => <Medal size={22} color={color} strokeWidth={1.7} /> }} />
    </Tabs>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: TAB_BAR_HEIGHT }}>
        <BottomAudioBar />
      </View>
    </View>
  );
}
