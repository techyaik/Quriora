import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bookmark,
  BookOpen,
  ChevronRight,
  Flame,
  Headphones,
  Search,
  Settings,
  Star,
  Target,
} from 'lucide-react-native';

import { MenuIcon } from '../components/MenuIcon';
import { api } from '../services/api';
import { fetchQuranAyah } from '../services/quranFallback';
import { useAuthContext } from '../context/AuthContext';
import { useDrawerContext } from '../context/DrawerContext';

const palette = {
  dark: '#0F1D1A',
  darkCard: '#162820',
  darkBorder: '#1E3530',
  cream: '#F7F4EF',
  white: '#FFFFFF',
  teal: '#1A7A5E',
  tealBright: '#2D9E7C',
  tealLight: '#E8F5F1',
  gold: '#C9963A',
  goldLight: '#FBF3E4',
  purple: '#6B5BD6',
  purpleLight: '#F0EDFB',
  rose: '#C04070',
  roseLight: '#FDE8F0',
  text: '#1A2421',
  textMuted: '#5A6B66',
  textFaint: '#9BAAA5',
  border: '#E8EDE9',
};

interface HomeAyah {
  textUthmani: string;
  surahId: number;
  ayahNumber: number;
  surah: { nameEnglish: string };
  translations: Array<{ language: string; text: string }>;
}

interface FeatureCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBackground: string;
  onPress: () => void;
}

const FeatureCard = ({ title, subtitle, icon, iconBackground, onPress }: FeatureCardProps) => (
  <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={styles.featureCard}>
    <View style={styles.featureTopRow}>
      <View style={[styles.featureIcon, { backgroundColor: iconBackground }]}>{icon}</View>
      <ChevronRight size={15} color={palette.textFaint} />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawerContext();
  const { user, isGuest } = useAuthContext();

  const [ayah, setAyah] = useState<HomeAyah | null>(null);
  const [streak, setStreak] = useState(0);
  const [versesToday, setVersesToday] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [lastSurahId, setLastSurahId] = useState<number | null>(null);
  const [lastAyahNumber, setLastAyahNumber] = useState<number | null>(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const day = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000
        );
        setAyah(await fetchQuranAyah((day % 6236) + 1));
      } catch {
        setAyah(null);
      }

      if (!user) return;
      try {
        const response = await api.get('/api/user/progress');
        if (response.data?.success) {
          const progress = response.data.data;
          setStreak(Number(progress.streak ?? progress.currentStreak ?? 0));
          setVersesToday(Number(progress.todayProgress ?? progress.versesReadToday ?? 0));
          setDailyGoal(Number(progress.dailyGoal ?? 5));
          setLastSurahId(Number(progress.lastSurahId) || null);
          setLastAyahNumber(Number(progress.lastAyahNumber) || null);
        }
      } catch {
        // The home screen remains usable when account progress is unavailable.
      }
    };

    loadHomeData();
  }, [user]);

  const hijriDate = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const gregorianDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
  const progressPercent = dailyGoal > 0 ? Math.min(100, Math.round((versesToday / dailyGoal) * 100)) : 0;
  const displayName = user?.displayName || (isGuest ? 'Guest' : 'Reader');
  const translation = ayah?.translations.find(item => item.language === 'en')?.text ?? '';
  const readingSurahId = lastSurahId ?? 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={palette.dark} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={openDrawer} style={styles.headerButton} activeOpacity={0.7}>
              <MenuIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandName}>Quriora</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/explore/search')} style={styles.headerButton}>
                <Search size={20} color="#9BAAA5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/explore/settings')} style={styles.headerButton}>
                <Settings size={20} color="#9BAAA5" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.welcomeEyebrow}>ASSALAMU ALAIKUM</Text>
              <Text style={styles.welcomeName}>{displayName}</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateText}>{gregorianDate}</Text>
              <Text style={styles.hijriText}>{hijriDate}</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressEyebrow}>DAILY READING GOAL</Text>
                <Text style={styles.progressTitle}>{versesToday} of {dailyGoal} verses</Text>
              </View>
              <View style={styles.progressPercentBadge}>
                <Text style={styles.progressPercentText}>{progressPercent}%</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.progressMetaRow}>
              <View style={styles.progressMetaItem}>
                <Flame size={14} color="#FF9A52" fill="#FF9A52" />
                <Text style={styles.progressMetaText}>{streak} day streak</Text>
              </View>
              <Text style={styles.progressHint}>Keep your daily rhythm</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {ayah && (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => router.push(`/quran/surah/${ayah.surahId}`)}
              style={styles.verseCard}
            >
              <View style={styles.verseStripe} />
              <Text style={styles.verseLabel}>VERSE OF THE DAY</Text>
              <Text style={styles.verseArabic}>{ayah.textUthmani}</Text>
              <Text style={styles.verseTranslation}>{translation}</Text>
              <Text style={styles.verseReference}>
                Surah {ayah.surah.nameEnglish} {ayah.surahId}:{ayah.ayahNumber}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => router.push(`/quran/surah/${readingSurahId}`)}
            style={styles.continueCard}
          >
            <View style={styles.continueGlow} />
            <View style={styles.continueIcon}>
              <BookOpen size={20} color="#FFFFFF" />
            </View>
            <View style={styles.continueInfo}>
              <Text style={styles.continueEyebrow}>{lastSurahId ? 'CONTINUE READING' : 'START READING'}</Text>
              <Text style={styles.continueTitle}>
                {lastSurahId ? `Surah ${lastSurahId}` : 'Open the Quran'}
              </Text>
              <Text style={styles.continueMeta}>
                {lastAyahNumber ? `Ayah ${lastAyahNumber}` : 'Begin with Al-Faatiha'}
              </Text>
            </View>
            <Text style={styles.continueArabic}>اقْرَأْ</Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: palette.tealLight }]}>
                <Flame size={18} color={palette.teal} />
              </View>
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statLabel}>Day streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: palette.goldLight }]}>
                <Target size={18} color={palette.gold} />
              </View>
              <Text style={styles.statNumber}>{versesToday}</Text>
              <Text style={styles.statLabel}>Verses today</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Quriora</Text>
            <TouchableOpacity onPress={() => router.navigate('/explore')}>
              <Text style={styles.sectionAction}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featureGrid}>
            <FeatureCard
              title="Read Quran"
              subtitle="114 Surahs and translations"
              icon={<BookOpen size={20} color={palette.teal} />}
              iconBackground={palette.tealLight}
              onPress={() => router.navigate('/quran')}
            />
            <FeatureCard
              title="Listen"
              subtitle="Recitations and playback"
              icon={<Headphones size={20} color={palette.gold} />}
              iconBackground={palette.goldLight}
              onPress={() => router.navigate('/listen')}
            />
            <FeatureCard
              title="Memorize"
              subtitle="Build your Hifz routine"
              icon={<Star size={20} color={palette.purple} />}
              iconBackground={palette.purpleLight}
              onPress={() => router.navigate('/memorize')}
            />
            <FeatureCard
              title="Bookmarks"
              subtitle="Saved Ayahs and notes"
              icon={<Bookmark size={20} color={palette.rose} />}
              iconBackground={palette.roseLight}
              onPress={() => router.push('/home/bookmarks')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  scrollContent: { paddingBottom: 24 },
  hero: { backgroundColor: palette.dark, paddingHorizontal: 20, paddingBottom: 34 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row' },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.tealBright },
  brandName: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 },
  welcomeEyebrow: { color: palette.tealBright, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  welcomeName: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 4 },
  dateBlock: { alignItems: 'flex-end', maxWidth: '50%' },
  dateText: { color: '#5A8070', fontSize: 10, fontWeight: '600' },
  hijriText: { color: '#9BAAA5', fontSize: 12, marginTop: 3, textAlign: 'right' },
  progressCard: { backgroundColor: palette.darkCard, borderWidth: 1, borderColor: palette.darkBorder, borderRadius: 20, padding: 18 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressEyebrow: { color: palette.tealBright, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  progressTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 4 },
  progressPercentBadge: { backgroundColor: 'rgba(45,158,124,0.15)', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 },
  progressPercentText: { color: palette.tealBright, fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 5, backgroundColor: palette.darkBorder, borderRadius: 99, overflow: 'hidden', marginTop: 16 },
  progressFill: { height: '100%', backgroundColor: palette.tealBright, borderRadius: 99 },
  progressMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 },
  progressMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressMetaText: { color: '#7A9A90', fontSize: 11, fontWeight: '600' },
  progressHint: { color: '#4F6C63', fontSize: 10 },
  body: { backgroundColor: palette.cream, paddingHorizontal: 16, paddingTop: 18 },
  verseCard: { backgroundColor: palette.white, borderRadius: 18, borderWidth: 1, borderColor: palette.border, padding: 19, marginBottom: 14, overflow: 'hidden' },
  verseStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: palette.tealBright },
  verseLabel: { color: palette.teal, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 9 },
  verseArabic: { color: palette.text, fontFamily: 'Amiri_400Regular', fontSize: 24, lineHeight: 41, textAlign: 'right', marginBottom: 7 },
  verseTranslation: { color: palette.textMuted, fontSize: 13, lineHeight: 21 },
  verseReference: { color: palette.textFaint, fontSize: 10, marginTop: 8 },
  continueCard: { backgroundColor: palette.dark, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, overflow: 'hidden', marginBottom: 14 },
  continueGlow: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: palette.teal, opacity: 0.09, right: -38, top: -48 },
  continueIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.tealBright, alignItems: 'center', justifyContent: 'center' },
  continueInfo: { flex: 1 },
  continueEyebrow: { color: '#5A8070', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  continueTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 3 },
  continueMeta: { color: '#5A8070', fontSize: 11, marginTop: 2 },
  continueArabic: { fontFamily: 'Amiri_700Bold', color: '#2D5A50', fontSize: 22 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 15 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statNumber: { color: palette.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: palette.textFaint, fontSize: 11, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: palette.text, fontSize: 15, fontWeight: '800' },
  sectionAction: { color: palette.teal, fontSize: 12, fontWeight: '700' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: { width: '48.5%', minHeight: 142, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 15 },
  featureTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  featureIcon: { width: 39, height: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: palette.text, fontSize: 14, fontWeight: '700' },
  featureSubtitle: { color: palette.textFaint, fontSize: 10, lineHeight: 15, marginTop: 4 },
});
