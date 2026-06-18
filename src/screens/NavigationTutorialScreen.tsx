import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  Headphones,
  Home,
  Menu,
  Search,
  Settings,
  Sparkles,
  Trophy,
} from 'lucide-react-native';

import { useThemeContext } from '../context/ThemeContext';
import { SCREEN_MAX_WIDTH, themeColors } from '../styles/theme';

const NAV_TUTORIAL_COMPLETE_KEY = 'quriora-navigation-tutorial-complete';

const steps = [
  {
    key: 'quran',
    title: 'Quran',
    body: 'Open the Quran section to browse Surahs and continue reading.',
    Icon: BookOpen,
  },
  {
    key: 'explore',
    title: 'Explore',
    body: 'Use Explore to study topics, Hadith, and learning resources.',
    Icon: Search,
  },
  {
    key: 'home',
    title: 'Home',
    body: 'Return to your daily reading goal, verse of the day, and quick actions.',
    Icon: Home,
  },
  {
    key: 'listen',
    title: 'Listen',
    body: 'Play Quran recitations and control audio from the Listen section.',
    Icon: Headphones,
  },
  {
    key: 'memorize',
    title: 'Memorize',
    body: 'Track Hifz sessions and review your memorization progress.',
    Icon: Trophy,
  },
  {
    key: 'drawer',
    title: 'Navigation Drawer',
    body: 'Tap the top-left menu to reach additional app sections.',
    Icon: Menu,
  },
  {
    key: 'settings',
    title: 'Settings',
    body: 'Tap Settings in the top-right area to adjust reading, audio, and appearance.',
    Icon: Settings,
  },
];

export const NavigationTutorialScreen: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const [index, setIndex] = useState(0);
  const compact = width < 360;
  const step = steps[index];

  const complete = async () => {
    await AsyncStorage.setItem(NAV_TUTORIAL_COMPLETE_KEY, 'true');
    router.replace('/home');
  };

  const goNext = () => {
    if (index < steps.length - 1) {
      setIndex(current => current + 1);
    } else {
      void complete();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.container, { maxWidth: SCREEN_MAX_WIDTH }]}>
        <View style={styles.topRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>App Navigation</Text>
          <TouchableOpacity onPress={() => void complete()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.phoneFrame, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.mockTopBar}>
            <View style={[styles.mockIconButton, step.key === 'drawer' && { backgroundColor: colors.accentLight }]}>
              <Menu size={20} color={step.key === 'drawer' ? colors.accent : colors.textSecondary} />
            </View>
            <View style={[styles.mockTitlePill, { backgroundColor: colors.bgSecondary }]} />
            <View style={[styles.mockIconButton, step.key === 'settings' && { backgroundColor: colors.accentLight }]}>
              <Settings size={20} color={step.key === 'settings' ? colors.accent : colors.textSecondary} />
            </View>
          </View>

          <View style={[styles.featurePreview, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accentLight }]}>
              <step.Icon size={34} color={colors.accent} />
            </View>
            <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>{step.title}</Text>
            <Text style={[styles.previewBody, { color: colors.textSecondary }]}>{step.body}</Text>
          </View>

          <View style={[styles.mockBottomNav, { backgroundColor: colors.bgPrimary, borderColor: colors.border }]}>
            {steps.slice(0, 5).map(({ key, title, Icon }) => {
              const active = step.key === key;
              return (
                <View key={key} style={[styles.navItem, active && { backgroundColor: colors.accentLight }]}>
                  <Icon size={compact ? 19 : 21} color={active ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.navLabel, { color: active ? colors.accent : colors.textSecondary }]}>
                    {title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.tipCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.tipIcon, { backgroundColor: colors.accentLight }]}>
            <Sparkles size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>{step.title}</Text>
            <Text style={[styles.tipBody, { color: colors.textSecondary }]}>{step.body}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.stepCounter, { color: colors.textTertiary }]}>
            {index + 1} of {steps.length}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => setIndex(current => Math.max(0, current - 1))}
              disabled={index === 0}
              style={[
                styles.secondaryButton,
                { borderColor: colors.border, opacity: index === 0 ? 0.35 : 1 },
              ]}
            >
              <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
              <Text style={styles.primaryText}>{index === steps.length - 1 ? 'Finish' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    alignSelf: 'center',
    flex: 1,
    gap: 18,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    width: '100%',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  phoneFrame: {
    borderRadius: 34,
    borderWidth: 1.5,
    gap: 16,
    padding: 14,
  },
  mockTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mockIconButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  mockTitlePill: {
    borderRadius: 999,
    height: 14,
    width: 104,
  },
  featurePreview: {
    alignItems: 'center',
    borderRadius: 28,
    minHeight: 230,
    justifyContent: 'center',
    padding: 24,
  },
  featureIcon: {
    alignItems: 'center',
    borderRadius: 24,
    height: 74,
    justifyContent: 'center',
    marginBottom: 16,
    width: 74,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  previewBody: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  mockBottomNav: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    minHeight: 78,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 2,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  tipCard: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  tipIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  tipBody: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
  footer: {
    gap: 10,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    flex: 0.42,
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 22,
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
