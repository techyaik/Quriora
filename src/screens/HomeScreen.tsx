import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { fetchQuranAyah } from '../services/quranFallback';
import { useAuthContext } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { useDrawerContext } from '../context/DrawerContext';
import { themeColors, globalStyles } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, BookOpen, Clock, ChevronRight, Award, Headphones, Bookmark, FileText, Menu, Settings, HandHeart } from 'lucide-react-native';

interface AyahOfTheDay {
  id: number;
  ayahNumber: number;
  surahId: number;
  textUthmani: string;
  translations: Array<{ language: string; text: string }>;
  surah: { nameEnglish: string };
}

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawerContext();

  const [ayahOfDay, setAyahOfDay] = useState<AyahOfTheDay | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dailyGoal = Number(progress?.dailyGoal ?? 5);
  const todayProgress = Number(progress?.todayProgress ?? progress?.versesReadToday ?? 0);
  const streak = Number(progress?.streak ?? progress?.currentStreak ?? 0);

  const hijriDate = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);
        const ayahId = (dayOfYear % 6236) + 1;
        const ayah = await fetchQuranAyah(ayahId);
        setAyahOfDay({ ...ayah, surah: { nameEnglish: ayah.surah.nameEnglish } });
        if (user) {
          const progressRes = await api.get('/api/user/progress');
          if (progressRes.data.success) setProgress(progressRes.data.data);
        }
      } catch (err) {
        console.warn('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const progressPct = dailyGoal > 0 ? Math.min(100, Math.round((todayProgress / dailyGoal) * 100)) : 0;

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <ScrollView style={{ backgroundColor: colors.bgSecondary }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Welcome Header Hero */}
        <LinearGradient
          colors={['#1A8A4A', '#277852', '#165a3b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { backgroundColor: colors.accent, paddingTop: insets.top + 12 }]}
        >
          {/* Top Bar / Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              onPress={openDrawer} 
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <Menu size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerRightRow}>
              <TouchableOpacity 
                onPress={openDrawer} 
                style={styles.headerBtn}
                activeOpacity={0.7}
              >
                <HandHeart size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/explore/settings')} 
                style={styles.headerBtn}
                activeOpacity={0.7}
              >
                <Settings size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.heroArabicGreeting}>السلام عليكم</Text>
          <Text style={styles.heroWelcomeTitle}>{user?.displayName || 'Welcome Back'}</Text>
          
          <View style={styles.heroMetaRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{hijriDate}</Text>
            </View>
            <View style={[styles.heroBadge, styles.heroBadgeIcon]}>
              <Clock size={10} color="#fff" />
              <Text style={styles.heroBadgeText}>Daily reflection</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.mainContentContainer, { backgroundColor: colors.bgSecondary }]}>
          {/* Continue Reading Card */}
          {progress ? (
            <TouchableOpacity
              onPress={() => router.push(`/quran/surah/${progress.lastSurahId}`)}
              style={[styles.continueCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              <LinearGradient
                colors={['#1A8A4A', '#165a3b']}
                style={styles.continueNumIcon}
              >
                <Text style={styles.continueNumText}>{progress.lastSurahId}</Text>
              </LinearGradient>
              <View style={styles.continueDetails}>
                <Text style={[styles.continueLabel, { color: colors.accent }]}>CONTINUE READING</Text>
                <Text style={[styles.continueTitle, { color: colors.textPrimary }]}>Surah {progress.lastSurahId}</Text>
                
                <View style={[styles.progressTrack, { backgroundColor: colors.border, marginTop: 8 }]}>
                  <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: colors.accent }]} />
                </View>
              </View>
              <ChevronRight size={18} color={colors.accent} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.navigate('/quran')}
              style={[styles.continueCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              <LinearGradient
                colors={['#1A8A4A', '#165a3b']}
                style={styles.continueNumIcon}
              >
                <BookOpen size={20} color="#fff" />
              </LinearGradient>
              <View style={styles.continueDetails}>
                <Text style={[styles.continueLabel, { color: colors.accent }]}>START READING</Text>
                <Text style={[styles.continueTitle, { color: colors.textPrimary }]}>Open the Quran</Text>
              </View>
              <ChevronRight size={18} color={colors.accent} />
            </TouchableOpacity>
          )}

          {/* Ayah of the Day */}
          {ayahOfDay && (
            <View style={[styles.ayahCard, { backgroundColor: colors.bgCard, borderColor: colors.goldLight }]}>
              <Text style={[styles.ayahLabel, { color: colors.accent }]}>✦ AYAH OF THE DAY</Text>
              <Text style={[styles.ayahArabic, { color: colors.textPrimary }]} numberOfLines={6}>
                {ayahOfDay.textUthmani}
              </Text>
              <View style={[styles.ayahSeparator, { borderTopColor: colors.border }]} />
              <Text style={[styles.ayahTrans, { color: colors.textSecondary }]}>
                "{ayahOfDay.translations.find(t => t.language === 'en')?.text}"
              </Text>
              <View style={styles.ayahRefRow}>
                <View style={[styles.ayahRefDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.ayahRefText, { color: colors.accent }]}>
                  {ayahOfDay.surah.nameEnglish} {ayahOfDay.surahId}:{ayahOfDay.ayahNumber}
                </Text>
              </View>
            </View>
          )}

          {/* Quick Actions Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                onPress={() => router.navigate('/quran')}
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.accentLight }]}>
                  <BookOpen size={18} color={colors.accent} />
                </View>
                <Text style={[styles.actionLabelText, { color: colors.textSecondary }]}>Read</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.navigate('/listen')}
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.accentLight }]}>
                  <Headphones size={18} color={colors.accent} />
                </View>
                <Text style={[styles.actionLabelText, { color: colors.textSecondary }]}>Listen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/home/bookmarks')}
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.accentLight }]}>
                  <Bookmark size={18} color={colors.accent} />
                </View>
                <Text style={[styles.actionLabelText, { color: colors.textSecondary }]}>Saved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/home/bookmarks')}
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.accentLight }]}>
                  <FileText size={18} color={colors.accent} />
                </View>
                <Text style={[styles.actionLabelText, { color: colors.textSecondary }]}>Notes</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Flame size={20} color="#F4774A" fill="#F4774A" />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{streak}</Text>
                <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>day streak</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Award size={20} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {todayProgress} / {dailyGoal}
                </Text>
                <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>pages today</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  mainContentContainer: {
    paddingHorizontal: 16,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -28,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 22,
    paddingBottom: 48,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: -6,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 8,
  },
  heroArabicGreeting: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontFamily: 'Amiri_400Regular',
    marginBottom: 4,
  },
  heroWelcomeTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  heroBadgeIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.90)',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  continueNumIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  continueNumText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  continueDetails: {
    flex: 1,
  },
  continueLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  continueTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 99,
    width: '90%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  ayahCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  ayahLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  ayahArabic: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'right',
  },
  ayahSeparator: {
    borderTopWidth: 0.8,
    marginTop: 12,
    paddingTop: 12,
  },
  ayahTrans: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  ayahRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ayahRefDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  ayahRefText: {
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabelText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  surahList: {
    gap: 8,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  surahNumBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  surahNumText: {
    fontSize: 11,
    fontWeight: '800',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 13,
    fontWeight: '700',
  },
  surahDetailsText: {
    fontSize: 10,
    marginTop: 1,
  },
  surahArabicText: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
