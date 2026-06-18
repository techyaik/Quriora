import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, globalStyles } from '../styles/theme';
import { ExternalLink, Heart } from 'lucide-react-native';

interface Attribution {
  category: string;
  items: Array<{
    name: string;
    description: string;
    license: string;
    url: string;
  }>;
}

const ATTRIBUTIONS: Attribution[] = [
  {
    category: 'Quran Data',
    items: [
      {
        name: 'AlQuran.cloud API',
        description: 'Quranic text (Uthmani), translations, audio metadata, search',
        license: 'Free for non-commercial use',
        url: 'https://alquran.cloud',
      },
      {
        name: 'Saheeh International Translation',
        description: 'English translation of the Quran',
        license: 'Open use for non-commercial purposes',
        url: 'https://quran.com',
      },
    ],
  },
  {
    category: 'Audio',
    items: [
      {
        name: 'cdn.islamic.network',
        description: 'High-quality MP3 recitation audio files',
        license: 'Free for use with attribution',
        url: 'https://cdn.islamic.network',
      },
      {
        name: 'Mishary Rashid Al-Afasy',
        description: 'Default reciter — Murattal style',
        license: 'Recitation used with permission via API',
        url: 'https://alafasy.com',
      },
    ],
  },
  {
    category: 'Fonts',
    items: [
      {
        name: 'Amiri Font',
        description: 'Arabic Quran display font (Regular & Bold)',
        license: 'SIL Open Font License (OFL)',
        url: 'https://fonts.google.com/specimen/Amiri',
      },
      {
        name: 'Inter Font',
        description: 'UI font for all English text',
        license: 'SIL Open Font License (OFL)',
        url: 'https://fonts.google.com/specimen/Inter',
      },
    ],
  },
  {
    category: 'Icons',
    items: [
      {
        name: 'Lucide React Native',
        description: 'All UI icons throughout the app',
        license: 'ISC License',
        url: 'https://lucide.dev',
      },
    ],
  },
  {
    category: 'Open Source Libraries',
    items: [
      {
        name: 'Expo SDK 56',
        description: 'React Native application framework',
        license: 'MIT License',
        url: 'https://expo.dev',
      },
      {
        name: 'expo-router',
        description: 'File-based navigation system',
        license: 'MIT License',
        url: 'https://expo.github.io/router',
      },
      {
        name: 'expo-audio',
        description: 'Audio playback with background support',
        license: 'MIT License',
        url: 'https://docs.expo.dev/versions/latest/sdk/audio',
      },
      {
        name: 'expo-linear-gradient',
        description: 'Gradient backgrounds and cards',
        license: 'MIT License',
        url: 'https://docs.expo.dev/versions/latest/sdk/linear-gradient',
      },
      {
        name: 'react-native-safe-area-context',
        description: 'Safe area insets for all device types',
        license: 'MIT License',
        url: 'https://github.com/th3rdwave/react-native-safe-area-context',
      },
      {
        name: '@react-native-async-storage',
        description: 'Offline persistence for settings, bookmarks, Hifz data',
        license: 'MIT License',
        url: 'https://react-native-async-storage.github.io',
      },
    ],
  },
];

const openURL = (url: string) => Linking.openURL(url).catch(() => {});

export const AttributionsScreen: React.FC = () => {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.introTitle, { color: colors.textPrimary }]}>Open Source Attributions</Text>
          <Text style={[styles.introBody, { color: colors.textSecondary }]}>
            Quriora is built on the shoulders of amazing open-source projects, APIs, and creators.
            We are deeply grateful to all of the following contributors.
          </Text>
        </View>

        {/* Attribution categories */}
        {ATTRIBUTIONS.map((section) => (
          <View key={section.category} style={styles.categoryBlock}>
            <Text style={[styles.categoryTitle, { color: colors.accent }]}>
              {section.category}
            </Text>
            <View style={[styles.categoryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => openURL(item.url)}
                  activeOpacity={0.75}
                  style={[
                    styles.item,
                    { borderBottomColor: colors.border },
                    idx === section.items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                    <View style={[styles.licenseBadge, { backgroundColor: colors.accentLight }]}>
                      <Text style={[styles.licenseText, { color: colors.accent }]}>
                        {item.license}
                      </Text>
                    </View>
                  </View>
                  <ExternalLink size={14} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Heart size={12} color={colors.accent} fill={colors.accent} />
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Thank you to the open-source community
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },
  introCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  introBody: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  categoryBlock: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 4,
    marginBottom: 8,
  },
  categoryCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  licenseBadge: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  licenseText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
