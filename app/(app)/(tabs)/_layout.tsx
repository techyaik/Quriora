import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { BottomAudioBar } from '@/src/components/BottomAudioBar';
import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';

export default function TabLayout() {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  return (
    <NativeTabs
      tintColor={colors.accent}
      backgroundColor={colors.bgSecondary}
      iconColor={{ default: colors.textTertiary, selected: colors.accent }}
      labelStyle={{ default: { color: colors.textTertiary }, selected: { color: colors.accent } }}
      minimizeBehavior="never"
    >
      <NativeTabs.BottomAccessory>
        <TabAudioAccessory />
      </NativeTabs.BottomAccessory>
      <NativeTabs.Trigger name="home" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quran" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf={{ default: 'book.closed', selected: 'book.closed.fill' }} md="menu_book" />
        <NativeTabs.Trigger.Label>Quran</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="listen" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf="headphones" md="headphones" />
        <NativeTabs.Trigger.Label>Listen</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="memorize" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf="rosette" md="workspace_premium" />
        <NativeTabs.Trigger.Label>Memorize</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} md="explore" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function TabAudioAccessory() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <BottomAudioBar compact={placement === 'inline'} />;
}
