import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { BottomAudioBar } from '@/src/components/BottomAudioBar';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor="#087F7A"
      backgroundColor="#F8F4EC"
      iconColor={{ default: '#747673', selected: '#087F7A' }}
      labelStyle={{
        default: { color: '#747673', fontSize: 12 },
        selected: { color: '#087F7A', fontSize: 12, fontWeight: '700' },
      }}
      minimizeBehavior="never"
    >
      <NativeTabs.BottomAccessory>
        <TabAudioAccessory />
      </NativeTabs.BottomAccessory>
      <NativeTabs.Trigger name="quran" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf="book.closed" md="menu_book" />
        <NativeTabs.Trigger.Label>Quran</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="home" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="listen" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf="headphones" md="headphones" />
        <NativeTabs.Trigger.Label>Listen</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="memorize" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf="rosette" md="workspace_premium" />
        <NativeTabs.Trigger.Label>Memorize</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function TabAudioAccessory() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <BottomAudioBar compact={placement === 'inline'} />;
}
