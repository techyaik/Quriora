import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Home } from 'lucide-react-native';
import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';
import { BottomAudioBar } from '@/src/components/BottomAudioBar';

export default function TabLayout() {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  return (
    <NativeTabs
      tintColor={colors.accent}
      backgroundColor={colors.bgSecondary}
      iconColor={{ default: colors.textSecondary, selected: colors.accent }}
      labelStyle={{
        default: { color: colors.textSecondary, fontSize: 11 },
        selected: { color: colors.accent, fontSize: 11, fontWeight: '700' },
      }}
      minimizeBehavior="never"
    >
      <NativeTabs.BottomAccessory>
        <TabAudioAccessory />
      </NativeTabs.BottomAccessory>

      <NativeTabs.Trigger name="quran" disableTransparentOnScrollEdge labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Icon sf="book.closed" md="menu_book" />
        <NativeTabs.Trigger.Label>Quran</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore" disableTransparentOnScrollEdge labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="home" disableTransparentOnScrollEdge labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Icon
          src={{
            default: <Home size={24} color={colors.textSecondary} />,
            selected: <Home size={26} color={colors.accent} />,
          }}
        />
        <NativeTabs.Trigger.Label
          selectedStyle={{ fontSize: 11, fontWeight: '800', color: colors.accent }}
        >
          Home
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="listen" disableTransparentOnScrollEdge labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Icon sf="headphones" md="headphones" />
        <NativeTabs.Trigger.Label>Listen</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="memorize" disableTransparentOnScrollEdge labelVisibilityMode="labeled">
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
