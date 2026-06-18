import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Headphones, Route } from 'lucide-react-native';

import { useThemeContext } from '../context/ThemeContext';
import { SCREEN_MAX_WIDTH, themeColors } from '../styles/theme';

const ONBOARDING_COMPLETE_KEY = 'quriora-onboarding-complete';

const slides = [
  {
    eyebrow: 'Quran Companion',
    title: 'Read with clarity and calm.',
    body: 'A focused Quran experience for daily reading, reflection, bookmarks, and notes.',
    Icon: BookOpen,
  },
  {
    eyebrow: 'Recitation',
    title: 'Listen without distraction.',
    body: 'Keep recitation controls close while you move gently from Ayah to Ayah.',
    Icon: Headphones,
  },
  {
    eyebrow: 'Guided Start',
    title: 'Know your way around.',
    body: 'A short tutorial will introduce Quran, Explore, Home, Listen, Memorize, the drawer, and Settings.',
    Icon: Route,
  },
];

export const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const [index, setIndex] = useState(0);
  const transition = useRef(new Animated.Value(1)).current;

  const slide = slides[index];
  const SlideIcon = slide.Icon;
  const compactWidth = width < 360;
  const compactHeight = height < 720;
  const heroSize = Math.min(width * (compactWidth ? 0.54 : 0.62), compactHeight ? 210 : 270);
  const titleSize = compactWidth ? 30 : compactHeight ? 32 : 36;

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, transition]);

  const animatedContentStyle = {
    opacity: transition,
    transform: [
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  const complete = async (skipTutorial = false) => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace(skipTutorial ? '/home' : '/tutorial');
  };

  const goNext = () => {
    if (index < slides.length - 1) {
      setIndex(current => current + 1);
    } else {
      void complete(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.container, { maxWidth: SCREEN_MAX_WIDTH }]}>
        <View style={styles.topBar}>
          <View style={[styles.brandMark, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Image source={require('../../assets/icon.png')} style={styles.brandIcon} resizeMode="contain" />
          </View>
          <Pressable onPress={() => complete(true)} hitSlop={14} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </Pressable>
        </View>

        <Animated.View style={[styles.stage, animatedContentStyle]}>
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
                width: heroSize,
                height: heroSize,
              },
            ]}
          >
            <View style={[styles.glowLarge, { backgroundColor: colors.accentGlow }]} />
            <View style={[styles.glowSmall, { backgroundColor: colors.goldLight }]} />
            <View style={[styles.iconGlass, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
              <Image source={require('../../assets/icon.png')} style={styles.heroIconImage} resizeMode="contain" />
            </View>
            <View style={[styles.iconPlate, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <SlideIcon size={compactHeight ? 38 : 46} color={colors.accent} strokeWidth={1.8} />
            </View>
          </View>

          <View style={styles.copyBlock}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>{slide.eyebrow}</Text>
            <Text style={[styles.title, { color: colors.textPrimary, fontSize: titleSize }]}>
              {slide.title}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {slide.body}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.dotsRow} accessibilityRole="adjustable">
            {slides.map((item, itemIndex) => {
              const active = itemIndex === index;
              return (
                <View
                  key={item.title}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: active ? colors.accent : colors.border,
                      opacity: active ? 1 : 0.8,
                      width: active ? 26 : 8,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => setIndex(current => Math.max(0, current - 1))}
              disabled={index === 0}
              style={[
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.bgCard,
                  opacity: index === 0 ? 0.45 : 1,
                },
              ]}
              activeOpacity={0.76}
            >
              <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goNext}
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              activeOpacity={0.86}
            >
              <Text style={styles.primaryText}>{index === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    width: '100%',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
  },
  brandIcon: {
    height: 34,
    width: 34,
  },
  skipButton: {
    alignItems: 'center',
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  stage: {
    alignItems: 'center',
    gap: 30,
    justifyContent: 'center',
    paddingBottom: 6,
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.12)',
  },
  glowLarge: {
    borderRadius: 999,
    height: '86%',
    opacity: 0.82,
    position: 'absolute',
    right: '-30%',
    top: '-24%',
    width: '86%',
  },
  glowSmall: {
    borderRadius: 999,
    bottom: '-22%',
    height: '58%',
    left: '-18%',
    opacity: 0.72,
    position: 'absolute',
    width: '58%',
  },
  iconGlass: {
    alignItems: 'center',
    borderRadius: 34,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    width: 104,
    boxShadow: '0 14px 32px rgba(0, 0, 0, 0.10)',
  },
  heroIconImage: {
    height: 72,
    width: 72,
  },
  iconPlate: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    bottom: 24,
    height: 72,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    width: 72,
  },
  copyBlock: {
    alignItems: 'center',
    maxWidth: 460,
    paddingHorizontal: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 42,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 23,
    marginTop: 14,
    maxWidth: 390,
    textAlign: 'center',
  },
  footer: {
    gap: 18,
    paddingBottom: 4,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 999,
    height: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flex: 0.42,
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 24,
    flex: 1,
    justifyContent: 'center',
    minHeight: 54,
    boxShadow: '0 14px 24px rgba(0, 0, 0, 0.10)',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
