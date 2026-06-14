import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, globalStyles } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import {
  BookOpen,
  Heart,
  Globe,
  Mail,
  Star,
  Shield,
  Info,
  ExternalLink,
} from 'lucide-react-native';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const IOS_URL = 'https://apps.apple.com/app/quriora/id123456789';
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.aik7.quriora';
const PRIVACY_URL = 'https://quriora.app/privacy';
const TERMS_URL = 'https://quriora.app/terms';

const openURL = (url: string) => Linking.openURL(url).catch(() => {});

export const AboutScreen: React.FC = () => {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  const infoRows = [
    { label: 'Version', value: `${APP_VERSION}` },
    { label: 'Platform', value: Platform.OS === 'ios' ? 'Apple iOS' : 'Android' },
    { label: 'Quran Source', value: 'alquran.cloud API' },
    { label: 'Audio Source', value: 'cdn.islamic.network' },
  ];

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={['#1A8A4A', '#277852', '#165a3b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={[styles.heroIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <BookOpen size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Quriora</Text>
          <Text style={styles.heroSubtitle}>Your companion for Quran reading, memorization, and reflection.</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>v{APP_VERSION}</Text>
          </View>
        </LinearGradient>

        {/* Mission */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Info size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Our Mission</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Quriora is built to make the Quran more accessible to Muslims around the world.
            Whether you are a beginner or have memorized years of Quran, our goal is to
            provide a beautiful, distraction-free, and feature-rich Quran experience.
          </Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary, marginTop: 8 }]}>
            We combine clean reading with professional audio recitations, a science-backed
            spaced repetition (SM-2) Hifz system, and personal bookmarks and notes — all
            in one app, available for free.
          </Text>
        </View>

        {/* App Info */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Shield size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>App Information</Text>
          </View>
          {infoRows.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                { borderBottomColor: colors.border },
                i === infoRows.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Links */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Globe size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Links</Text>
          </View>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
            onPress={() => openURL(PRIVACY_URL)}
            activeOpacity={0.7}
          >
            <Shield size={15} color={colors.accent} />
            <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
            <ExternalLink size={13} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
            onPress={() => openURL(TERMS_URL)}
            activeOpacity={0.7}
          >
            <BookOpen size={15} color={colors.accent} />
            <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>Terms of Use</Text>
            <ExternalLink size={13} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
            onPress={() => openURL('mailto:support@quriora.app')}
            activeOpacity={0.7}
          >
            <Mail size={15} color={colors.accent} />
            <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>Contact Support</Text>
            <ExternalLink size={13} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomWidth: 0 }]}
            onPress={() => openURL(Platform.OS === 'ios' ? IOS_URL : ANDROID_URL)}
            activeOpacity={0.7}
          >
            <Star size={15} color="#F4774A" />
            <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>Rate on App Store</Text>
            <ExternalLink size={13} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Made with love */}
        <View style={styles.footer}>
          <Heart size={12} color={colors.accent} fill={colors.accent} />
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Made with love for the Muslim community
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
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 16,
  },
  heroBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBadgeText: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
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
