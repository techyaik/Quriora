import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bookmark,
  BookOpen,
  ChevronRight,
  Clock3,
  FileText,
  Flame,
  Headphones,
  Layers3,
  Minus,
  Pencil,
  Plus,
  Settings,
  Star,
  Target,
  X,
} from 'lucide-react-native';

import { MenuIcon } from '../components/MenuIcon';
import { fetchQuranAyah } from '../services/quranFallback';
import { useDrawerContext } from '../context/DrawerContext';
import { type ReadingGoalType, useReadingGoal } from '../context/ReadingGoalContext';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors } from '../styles/theme';

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

const USER_NAME_KEY = 'quriora-user-name';

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
  fullWidth?: boolean;
}

const FeatureCard = ({ title, subtitle, icon, iconBackground, onPress, fullWidth }: FeatureCardProps) => {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={[
        styles.featureCard,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        fullWidth && styles.featureCardFull
      ]}
    >
      <View style={styles.featureTopRow}>
        <View style={[styles.featureIcon, { backgroundColor: iconBackground }]}>{icon}</View>
        <ChevronRight size={15} color={colors.textTertiary} />
      </View>
      <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.featureSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawerContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  const [ayah, setAyah] = useState<HomeAyah | null>(null);
  const {
    goal,
    progress,
    progressPercent,
    streak,
    lastSurahId,
    lastAyahNumber,
    setGoal,
  } = useReadingGoal();
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);
  const [draftGoalType, setDraftGoalType] = useState<ReadingGoalType>(goal.type);
  const [draftTarget, setDraftTarget] = useState(String(goal.target));
  const [savedName, setSavedName] = useState('Reader');

  const compact = width < 360;
  const tablet = width >= 700;

  useEffect(() => {
    const loadHomeData = async () => {
      AsyncStorage.getItem(USER_NAME_KEY)
        .then(storedName => {
          if (storedName?.trim()) setSavedName(storedName.trim());
        })
        .catch(() => {});

      try {
        const day = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000
        );
        setAyah(await fetchQuranAyah((day % 6236) + 1));
      } catch {
        setAyah(null);
      }

    };

    loadHomeData();
  }, []);

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
  const displayName = savedName;
  const translation = ayah?.translations.find(item => item.language === 'en')?.text ?? '';
  const readingSurahId = lastSurahId ?? 1;
  const goalLabel = goal.type === 'duration' ? 'minutes' : goal.type;
  const displayedProgress = goal.type === 'duration' ? Math.floor(progress) : Math.round(progress);

  const goalOptions: Array<{ type: ReadingGoalType; label: string; icon: React.ReactNode; defaultTarget: number }> = [
    { type: 'verses', label: 'Verses', icon: <BookOpen size={17} color={colors.accent} />, defaultTarget: 5 },
    { type: 'pages', label: 'Pages', icon: <FileText size={17} color={colors.accent} />, defaultTarget: 2 },
    { type: 'chapters', label: 'Chapters', icon: <Layers3 size={17} color={colors.accent} />, defaultTarget: 1 },
    { type: 'duration', label: 'Minutes', icon: <Clock3 size={17} color={colors.accent} />, defaultTarget: 15 },
  ];

  const openGoalEditor = () => {
    setDraftGoalType(goal.type);
    setDraftTarget(String(goal.target));
    setGoalEditorOpen(true);
  };

  const adjustTarget = (amount: number) => {
    setDraftTarget(String(Math.max(1, (Number(draftTarget) || 1) + amount)));
  };

  const saveGoal = () => {
    setGoal({ type: draftGoalType, target: Math.max(1, Number(draftTarget) || 1) });
    setGoalEditorOpen(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.accent} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.hero, { backgroundColor: colors.accent, paddingTop: insets.top + 12 }]}>
          <View style={[styles.heroInner, tablet && styles.tabletShell]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={openDrawer} style={styles.headerButton} activeOpacity={0.7}>
              <MenuIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/explore/settings')} style={styles.headerButton}>
              <Settings size={20} color="rgba(255, 255, 255, 0.75)" />
            </TouchableOpacity>
          </View>
 
          <View style={[styles.welcomeRow, compact && styles.welcomeRowCompact]}>
            <View>
              <Text style={[styles.welcomeEyebrow, { color: 'rgba(255, 255, 255, 0.7)' }]}>ASSALAMU ALAIKUM</Text>
              <Text style={[styles.welcomeName, { color: '#FFFFFF' }]}>{displayName}</Text>
            </View>
            <View style={[styles.dateBlock, compact && styles.dateBlockCompact]}>
              <Text style={[styles.dateText, { color: 'rgba(255, 255, 255, 0.65)' }]}>{gregorianDate}</Text>
              <Text style={[styles.hijriText, { color: 'rgba(255, 255, 255, 0.85)' }]}>{hijriDate}</Text>
            </View>
          </View>
 
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={openGoalEditor}
            style={[
              styles.progressCard,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }
            ]}
          >
            <View style={styles.progressHeader}>
              <View style={styles.progressHeading}>
                <Text style={[styles.progressEyebrow, { color: 'rgba(255, 255, 255, 0.7)' }]}>DAILY READING GOAL</Text>
                <Text style={[styles.progressTitle, { color: '#FFFFFF' }, compact && styles.progressTitleCompact]}>
                  {displayedProgress} of {goal.target} {goalLabel}
                </Text>
              </View>
              <View style={styles.progressBadgeRow}>
                <View style={[styles.progressPercentBadge, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
                  <Text style={[styles.progressPercentText, { color: '#FFFFFF' }]}>{progressPercent}%</Text>
                </View>
                <Pencil size={14} color="#FFFFFF" />
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: '#FFFFFF' }]} />
            </View>
            <View style={styles.progressMetaRow}>
              <View style={styles.progressMetaItem}>
                <Flame size={14} color="#FF9A52" fill="#FF9A52" />
                <Text style={[styles.progressMetaText, { color: 'rgba(255, 255, 255, 0.85)' }]}>{streak} day streak</Text>
              </View>
              {!compact ? <Text style={[styles.progressHint, { color: 'rgba(255, 255, 255, 0.55)' }]}>Tap to adjust your goal</Text> : null}
            </View>
          </TouchableOpacity>
          </View>
        </View>
 
        <View style={[styles.body, { backgroundColor: colors.bgPrimary }, tablet && styles.tabletShell]}>
          {ayah && (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => router.push(`/quran/surah/${ayah.surahId}`)}
              style={[styles.verseCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              <View style={[styles.verseStripe, { backgroundColor: colors.accent }]} />
              <Text style={[styles.verseLabel, { color: colors.accent }]}>VERSE OF THE DAY</Text>
              <Text style={[styles.verseArabic, { color: colors.textPrimary }]}>{ayah.textUthmani}</Text>
              <Text style={[styles.verseTranslation, { color: colors.textSecondary }]}>{translation}</Text>
              <Text style={[styles.verseReference, { color: colors.textTertiary }]}>
                Surah {ayah.surah.nameEnglish} {ayah.surahId}:{ayah.ayahNumber}
              </Text>
            </TouchableOpacity>
          )}
 
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => router.push(`/quran/surah/${readingSurahId}`)}
            style={[styles.continueCard, { backgroundColor: colors.accent }]}
          >
            <View style={[styles.continueGlow, { backgroundColor: '#FFFFFF', opacity: 0.12 }]} />
            <View style={[styles.continueIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <BookOpen size={20} color="#FFFFFF" />
            </View>
            <View style={styles.continueInfo}>
              <Text style={[styles.continueEyebrow, { color: 'rgba(255, 255, 255, 0.7)' }]}>{lastSurahId ? 'CONTINUE READING' : 'START READING'}</Text>
              <Text style={[styles.continueTitle, { color: '#FFFFFF' }]}>
                {lastSurahId ? `Surah ${lastSurahId}` : 'Open the Quran'}
              </Text>
              <Text style={[styles.continueMeta, { color: 'rgba(255, 255, 255, 0.85)' }]}>
                {lastAyahNumber ? `Ayah ${lastAyahNumber}` : 'Begin with Al-Faatiha'}
              </Text>
            </View>
            <Text style={[styles.continueArabic, { color: 'rgba(255, 255, 255, 0.25)' }]}>اقْرَأْ</Text>
          </TouchableOpacity>
 
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.accentLight }]}>
                <Flame size={18} color={colors.accent} />
              </View>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Day streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.goldLight }]}>
                <Target size={18} color={colors.gold} />
              </View>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{displayedProgress}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{goalLabel[0].toUpperCase() + goalLabel.slice(1)} today</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Explore Quriora</Text>
            <TouchableOpacity onPress={() => router.navigate('/explore')}>
              <Text style={[styles.sectionAction, { color: colors.accent }]}>View all</Text>
            </TouchableOpacity>
          </View>
 
          <View style={styles.featureGrid}>
            <FeatureCard
              title="Read Quran"
              subtitle="114 Surahs and translations"
              icon={<BookOpen size={20} color={colors.accent} />}
              iconBackground={colors.accentLight}
              onPress={() => router.navigate('/quran')}
              fullWidth={compact}
            />
            <FeatureCard
              title="Listen"
              subtitle="Recitations and playback"
              icon={<Headphones size={20} color={colors.gold} />}
              iconBackground={colors.goldLight}
              onPress={() => router.navigate('/listen')}
              fullWidth={compact}
            />
            <FeatureCard
              title="Memorize"
              subtitle="Build your Hifz routine"
              icon={<Star size={20} color={colors.accent} />}
              iconBackground={colors.accentLight}
              onPress={() => router.navigate('/memorize')}
              fullWidth={compact}
            />
            <FeatureCard
              title="Bookmarks"
              subtitle="Saved Ayahs and notes"
              icon={<Bookmark size={20} color={colors.gold} />}
              iconBackground={colors.goldLight}
              onPress={() => router.push('/home/bookmarks')}
              fullWidth={compact}
            />
          </View>
        </View>
      </ScrollView>
 
      <Modal visible={goalEditorOpen} transparent animationType="fade" onRequestClose={() => setGoalEditorOpen(false)}>
        <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setGoalEditorOpen(false)} />
          <View style={[styles.goalSheet, { backgroundColor: colors.bgPrimary }, compact && styles.goalSheetCompact]}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.goalSheetHeader}>
              <View>
                <Text style={[styles.goalSheetEyebrow, { color: colors.accent }]}>DAILY QURAN GOAL</Text>
                <Text style={[styles.goalSheetTitle, { color: colors.textPrimary }]}>Choose your reading rhythm</Text>
              </View>
              <TouchableOpacity onPress={() => setGoalEditorOpen(false)} style={[styles.closeButton, { backgroundColor: colors.bgCard }]}>
                <X size={19} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
 
            <View style={styles.goalTypeGrid}>
              {goalOptions.map(option => {
                const selected = draftGoalType === option.type;
                return (
                  <TouchableOpacity
                    key={option.type}
                    onPress={() => {
                      setDraftGoalType(option.type);
                      setDraftTarget(String(option.defaultTarget));
                    }}
                    style={[
                      styles.goalTypeCard,
                      {
                        backgroundColor: colors.bgCard,
                        borderColor: selected ? colors.accent : colors.border,
                      },
                      selected && { backgroundColor: colors.accentLight }
                    ]}
                  >
                    <View style={[styles.goalTypeIcon, { backgroundColor: colors.accentLight }]}>{option.icon}</View>
                    <Text style={[styles.goalTypeLabel, { color: selected ? colors.accent : colors.textSecondary }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
 
            <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Daily target</Text>
            <View style={[styles.targetEditor, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => adjustTarget(-1)} style={styles.targetButton}>
                <Minus size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <TextInput
                value={draftTarget}
                onChangeText={value => setDraftTarget(value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                selectTextOnFocus
                style={[styles.targetInput, { color: colors.textPrimary }]}
                accessibilityLabel="Daily goal target"
              />
              <TouchableOpacity onPress={() => adjustTarget(1)} style={styles.targetButton}>
                <Plus size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
 
            <TouchableOpacity onPress={saveGoal} style={[styles.saveGoalButton, { backgroundColor: colors.accent }]}>
              <Text style={styles.saveGoalText}>Save daily goal</Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  scrollContent: { paddingBottom: 24 },
  hero: { backgroundColor: palette.dark, paddingHorizontal: 20, paddingBottom: 34 },
  heroInner: { width: '100%', alignSelf: 'center' },
  tabletShell: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 },
  welcomeRowCompact: { alignItems: 'flex-start', flexDirection: 'column', gap: 9 },
  welcomeEyebrow: { color: palette.tealBright, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  welcomeName: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 4 },
  dateBlock: { alignItems: 'flex-end', maxWidth: '50%' },
  dateBlockCompact: { alignItems: 'flex-start', maxWidth: '100%' },
  dateText: { color: '#5A8070', fontSize: 10, fontWeight: '600' },
  hijriText: { color: '#9BAAA5', fontSize: 12, marginTop: 3, textAlign: 'right' },
  progressCard: { backgroundColor: palette.darkCard, borderWidth: 1, borderColor: palette.darkBorder, borderRadius: 20, padding: 18 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressHeading: { flex: 1, paddingRight: 8 },
  progressEyebrow: { color: palette.tealBright, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  progressTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 4 },
  progressTitleCompact: { fontSize: 16 },
  progressBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
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
  featureCard: { flexGrow: 1, flexBasis: '47%', minWidth: 140, minHeight: 142, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 15 },
  featureCardFull: { flexBasis: '100%' },
  featureTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  featureIcon: { width: 39, height: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: palette.text, fontSize: 14, fontWeight: '700' },
  featureSubtitle: { color: palette.textFaint, fontSize: 10, lineHeight: 15, marginTop: 4 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(10,20,17,0.54)' },
  goalSheet: { width: '100%', maxWidth: 560, maxHeight: '90%', alignSelf: 'center', backgroundColor: palette.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 30, boxShadow: '0 -10px 30px rgba(0,0,0,0.15)' },
  goalSheetCompact: { paddingHorizontal: 14 },
  goalSheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  goalSheetEyebrow: { color: palette.teal, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  goalSheetTitle: { color: palette.text, fontSize: 20, lineHeight: 27, fontWeight: '800', marginTop: 4 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  goalTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 20 },
  goalTypeCard: { flexGrow: 1, flexBasis: '46%', minWidth: 125, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.white, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12 },
  goalTypeCardSelected: { borderColor: palette.teal, backgroundColor: palette.tealLight },
  goalTypeIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: palette.tealLight, alignItems: 'center', justifyContent: 'center' },
  goalTypeLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  goalTypeLabelSelected: { color: palette.teal },
  targetLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  targetEditor: { height: 54, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.border, borderRadius: 16, backgroundColor: palette.white, paddingHorizontal: 6 },
  targetButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  targetInput: { flex: 1, color: palette.text, fontSize: 20, fontWeight: '800', textAlign: 'center', paddingVertical: 0 },
  saveGoalButton: { height: 50, borderRadius: 16, backgroundColor: palette.teal, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveGoalText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
