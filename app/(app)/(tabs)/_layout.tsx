import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Home } from 'lucide-react-native';
import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';
import { BottomAudioBar } from '@/src/components/BottomAudioBar';

const THEME_TAB_COLORS = {
  light: {
    background: '#F8F4EC',
    tint: '#1A8A4A',
    inactive: '#747673',
  },
  dark: {
    background: '#181C26',
    tint: '#2ECC71',
    inactive: '#6B6560',
  },
  sepia: {
    background: '#EFE3CC',
    tint: '#5A6E32',
    inactive: '#8A7A60',
  },
} as const;

export default function TabLayout() {
  const { theme } = useThemeContext();
  const tabColors = THEME_TAB_COLORS[theme];

  return (
    <NativeTabs
      tintColor={tabColors.tint}
      backgroundColor={tabColors.background}
      iconColor={{ default: tabColors.inactive, selected: tabColors.tint }}
      labelStyle={{
        default: { color: tabColors.inactive, fontSize: 12 },
        selected: { color: tabColors.tint, fontSize: 12, fontWeight: '700' },
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
        <NativeTabs.Trigger.Icon
          src={{
            default: <Home size={30} color={tabColors.inactive} />,
            selected: <Home size={37} color={tabColors.tint} />,
          }}
        />
        <NativeTabs.Trigger.Label
          selectedStyle={{ fontSize: 13, fontWeight: '800', color: tabColors.tint }}
        >
          Home
        </NativeTabs.Trigger.Label>
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
