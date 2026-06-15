import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../services/api';
import { fetchQuranSurah } from '../services/quranFallback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../context/AuthContext';
import { useAudioContext } from '../context/AudioContext';
import { useThemeContext } from '../context/ThemeContext';
import { AyahCard } from '../components/AyahCard';
import { TafseerPanel } from '../components/TafseerPanel';
import { SCREEN_MAX_WIDTH, themeColors, globalStyles } from '../styles/theme';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useReadingGoal } from '../context/ReadingGoalContext';

interface TranslationItem { id: number; language: string; translator: string; text: string; }
interface AyahItem {
  id: number; ayahNumber: number; textUthmani: string; textSimple: string;
  juzNumber: number; pageNumber: number; rukuNumber: number; translations: TranslationItem[];
}
interface SurahData {
  id: number; nameArabic: string; nameEnglish: string;
  nameMeaning: string; revelationType: string; ayahCount: number; ayahs: AyahItem[];
}

type ReadingMode = 'card' | 'continuous' | 'mushaf';

export const SurahScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; highlight?: string }>();
  
  const surahId = (() => {
    const rawId = params.id;
    if (rawId === undefined || rawId === null || rawId === 'undefined' || rawId === 'null') {
      return 1;
    }
    const parsed = parseInt(String(rawId), 10);
    return isNaN(parsed) ? 1 : parsed;
  })();

  const { user, isGuest } = useAuthContext();
  const { fontSize, theme } = useThemeContext();
  const { isPlaying, currentAyahNumber, currentSurahId, playSurah, pause, resume } = useAudioContext();
  const colors = themeColors[theme];
  const listRef = useRef<FlatList<AyahItem>>(null);
  const { markAyahRead, addReadingSeconds } = useReadingGoal();

  const [surah, setSurah] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [readingMode, setReadingMode] = useState<ReadingMode>('card');
  const [activeTafseer, setActiveTafseer] = useState<{ ayahId: number; ayahNumber: number } | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  const loadSurah = useCallback(async () => {
      setLoading(true);
      setLoadError('');
      try {
        setSurah(await fetchQuranSurah(surahId));
        if (user) {
          const bRes = await api.get('/api/user/bookmarks');
          if (bRes.data.success) {
            setBookmarks(bRes.data.data.map((b: any) => b.ayahId));
          }
        } else if (isGuest) {
          const stored = await AsyncStorage.getItem('nurquran-guest-bookmarks');
          setBookmarks(JSON.parse(stored || '[]'));
        }
      } catch (err) {
        console.warn(err);
        setLoadError('This Surah could not be loaded. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
  }, [isGuest, surahId, user]);

  useEffect(() => {
    void loadSurah();
  }, [loadSurah]);

  useEffect(() => {
    if (!surah || !params.highlight) return;
    const index = surah.ayahs.findIndex(ayah => ayah.id === Number(params.highlight));
    if (index >= 0) requestAnimationFrame(() => listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 }));
  }, [params.highlight, surah]);

  useEffect(() => {
    if (!surah) return;
    let appIsActive = AppState.currentState === 'active';
    const subscription = AppState.addEventListener('change', state => {
      appIsActive = state === 'active';
    });
    const timer = setInterval(() => {
      if (appIsActive) addReadingSeconds(10);
    }, 10000);
    const firstAyahTimer = setTimeout(() => {
      const firstAyah = surah.ayahs[0];
      if (firstAyah) markAyahRead(surah.id, firstAyah.ayahNumber, firstAyah.pageNumber, surah.ayahCount);
    }, 1500);

    return () => {
      subscription.remove();
      clearInterval(timer);
      clearTimeout(firstAyahTimer);
    };
  }, [addReadingSeconds, markAyahRead, surah]);

  const trackAyah = useCallback((ayah: AyahItem) => {
    if (!surah) return;
    markAyahRead(surah.id, ayah.ayahNumber, ayah.pageNumber, surah.ayahCount);
  }, [markAyahRead, surah]);

  const trackAyahRef = useRef(trackAyah);
  trackAyahRef.current = trackAyah;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken<AyahItem>> }) => {
      viewableItems.forEach(token => {
        if (token.isViewable && token.item) trackAyahRef.current(token.item);
      });
    }
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 65, minimumViewTime: 800 }).current;

  const handleReadingScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!surah?.ayahs.length) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollableHeight = Math.max(1, contentSize.height - layoutMeasurement.height);
    const ratio = Math.max(0, Math.min(1, contentOffset.y / scrollableHeight));
    const index = Math.min(surah.ayahs.length - 1, Math.round(ratio * (surah.ayahs.length - 1)));
    trackAyah(surah.ayahs[index]);
  }, [surah, trackAyah]);

  const isSurahPlaying = isPlaying && currentSurahId === surahId;

  const handlePlayToggle = async () => {
    if (isSurahPlaying) {
      await pause();
    } else if (currentSurahId === surahId) {
      await resume();
    } else {
      await playSurah(surahId, 1);
    }
  };

  const handlePlay = useCallback((ayahNumber: number) => {
    if (surah) {
      playSurah(surah.id, ayahNumber);
    }
  }, [surah, playSurah]);

  const handleBookmark = useCallback(async (ayahId: number) => {
    try {
      if (!user) {
        setBookmarks(prev => {
          const isBookmarked = prev.includes(ayahId);
          const next = isBookmarked ? prev.filter(id => id !== ayahId) : [...prev, ayahId];
          AsyncStorage.setItem('nurquran-guest-bookmarks', JSON.stringify(next)).catch(console.warn);
          return next;
        });
        return;
      }
      
      let isBookmarked = false;
      setBookmarks(prev => {
        isBookmarked = prev.includes(ayahId);
        return prev;
      });

      if (isBookmarked) {
        const bRes = await api.get('/api/user/bookmarks');
        const record = bRes.data.data.find((b: any) => b.ayahId === ayahId);
        if (record) {
          await api.delete(`/api/user/bookmarks/${record.id}`);
        }
        setBookmarks(prev => prev.filter(id => id !== ayahId));
      } else {
        await api.post('/api/user/bookmarks', { ayahId });
        setBookmarks(prev => [...prev, ayahId]);
      }
    } catch (err) {
      console.warn(err);
    }
  }, [user]);

  const handleOpenTafseer = useCallback((ayahId: number, ayahNumber: number) => {
    setActiveTafseer({ ayahId, ayahNumber });
  }, []);

  const mushafPages = useMemo(() => (surah?.ayahs ?? []).reduce((acc: Record<number, AyahItem[]>, ayah) => {
    if (!acc[ayah.pageNumber]) acc[ayah.pageNumber] = [];
    acc[ayah.pageNumber].push(ayah);
    return acc;
  }, {}), [surah]);

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!surah) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.bgPrimary }]}> 
        <Text style={[styles.loadErrorText, { color: colors.textSecondary }]}>
          {loadError || 'Surah not found.'}
        </Text>
        {loadError ? (
          <TouchableOpacity onPress={loadSurah} style={[styles.retryButton, { backgroundColor: colors.accent }]}> 
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const renderCardItem = useCallback(({ item }: { item: AyahItem }) => (
    <AyahCard
      ayah={item}
      surahId={surah.id}
      surahNameEnglish={surah.nameEnglish}
      isPlaying={isPlaying && currentSurahId === surah.id && currentAyahNumber === item.ayahNumber}
      isBookmarked={bookmarks.includes(item.id)}
      onPlay={handlePlay}
      onBookmark={handleBookmark}
      onOpenTafseer={handleOpenTafseer}
    />
  ), [surah, isPlaying, currentSurahId, currentAyahNumber, bookmarks, handlePlay, handleBookmark, handleOpenTafseer]);

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <Stack.Screen options={{ title: `Surah ${surah.nameEnglish}` }} />
      {/* Surah Header Card */}
      <View style={styles.headerDetails}>
        <View style={styles.navigationRow}>
          <TouchableOpacity
            disabled={surahId === 1}
            onPress={() => router.replace(`/quran/surah/${surahId - 1}`)}
            style={[styles.arrowBtn, { borderColor: colors.border, opacity: surahId === 1 ? 0.3 : 1 }]}
          >
            <ChevronLeft size={12} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={[styles.metaIndexText, { color: colors.textTertiary }]}>
            Surah {surah.id} of 114
          </Text>

          <TouchableOpacity
            disabled={surahId === 114}
            onPress={() => router.replace(`/quran/surah/${surahId + 1}`)}
            style={[styles.arrowBtn, { borderColor: colors.border, opacity: surahId === 114 ? 0.3 : 1 }]}
          >
            <ChevronRight size={12} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.arabicName, { color: colors.accent }]}>
          {surah.nameArabic}
        </Text>
        <Text style={[styles.meaningText, { color: colors.textSecondary }]}>
          {surah.nameMeaning} · {surah.revelationType} · {surah.ayahCount} Ayahs
        </Text>

        {/* Controls row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={handlePlayToggle}
            style={[styles.playButton, { backgroundColor: colors.accent }]}
          >
            {isSurahPlaying ? (
              <Pause size={12} color="#fff" />
            ) : (
              <Play size={12} color="#fff" style={{ marginLeft: 2 }} />
            )}
            <Text style={styles.playButtonText}>{isSurahPlaying ? 'Pause' : 'Listen'}</Text>
          </TouchableOpacity>

          <View style={[styles.modeTabs, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            {(['card', 'continuous', 'mushaf'] as ReadingMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                onPress={() => setReadingMode(mode)}
                style={[styles.modeTab, readingMode === mode && { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.modeTabText, { color: readingMode === mode ? '#fff' : colors.textTertiary }]}>
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Reading view area */}
      <View style={styles.scrollArea}>
        {readingMode === 'card' ? (
          <FlatList
            ref={listRef}
            contentInsetAdjustmentBehavior="automatic"
            data={surah.ayahs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCardItem}
            contentContainerStyle={styles.cardListContent}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScrollToIndexFailed={({ index }) => setTimeout(() => listRef.current?.scrollToIndex({ index, animated: true }), 250)}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={process.env.EXPO_OS !== 'web'}
          />
        ) : readingMode === 'continuous' ? (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.flowContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleReadingScroll}
            scrollEventThrottle={500}
          >
            <View style={[styles.flowCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.flowArabicContainer, { lineHeight: 52 }]}>
                {surah.ayahs.map(ayah => {
                  const playing = isPlaying && currentSurahId === surah.id && currentAyahNumber === ayah.ayahNumber;
                  return (
                    <Text
                      key={ayah.id}
                      onPress={() => playSurah(surah.id, ayah.ayahNumber)}
                      style={[
                        styles.flowArabicText,
                        {
                          fontSize: fontSize,
                          color: playing ? colors.accent : colors.textPrimary,
                          fontWeight: playing ? 'bold' : 'normal',
                          backgroundColor: playing ? colors.accentLight : 'transparent',
                        }
                      ]}
                    >
                      {ayah.textUthmani}
                      <Text style={[styles.flowMedallion, { color: colors.gold }]}>
                        {' '}{ayah.ayahNumber}{' '}
                      </Text>
                    </Text>
                  );
                })}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.flowContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleReadingScroll}
            scrollEventThrottle={500}
          >
            {Object.entries(mushafPages).map(([pageNo, pageAyahs]) => (
              <View key={pageNo} style={[styles.mushafPageCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={[styles.pageIndicator, { backgroundColor: colors.bgSecondary }]}>
                  <Text style={[styles.pageIndicatorText, { color: colors.textSecondary }]}>
                    Page {pageNo} · Juz {pageAyahs[0].juzNumber}
                  </Text>
                </View>
                <Text style={[styles.flowArabicContainer, { lineHeight: 52 }]}>
                  {pageAyahs.map(ayah => {
                    const playing = isPlaying && currentSurahId === surah.id && currentAyahNumber === ayah.ayahNumber;
                    return (
                      <Text
                        key={ayah.id}
                        onPress={() => playSurah(surah.id, ayah.ayahNumber)}
                        style={[
                          styles.flowArabicText,
                          {
                            fontSize: fontSize,
                            color: playing ? colors.accent : colors.textPrimary,
                            fontWeight: playing ? 'bold' : 'normal',
                            backgroundColor: playing ? colors.accentLight : 'transparent',
                          }
                        ]}
                      >
                        {ayah.textUthmani}
                        <Text style={[styles.flowMedallion, { color: colors.gold }]}>
                          {' '}{ayah.ayahNumber}{' '}
                        </Text>
                      </Text>
                    );
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Tafseer bottom panel */}
      <TafseerPanel
        isOpen={activeTafseer !== null}
        ayahId={activeTafseer?.ayahId || null}
        ayahNumber={activeTafseer?.ayahNumber || null}
        surahId={surah.id}
        onClose={() => setActiveTafseer(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadErrorText: {
    maxWidth: 360,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerDetails: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: SCREEN_MAX_WIDTH,
    alignSelf: 'center',
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  arrowBtn: {
    borderWidth: 1,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 99,
  },
  metaIndexText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  arabicName: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  meaningText: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 99,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeTab: {
    paddingHorizontal: 10,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  modeTabText: {
    fontSize: 9,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  cardListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    width: '100%',
    maxWidth: SCREEN_MAX_WIDTH,
    alignSelf: 'center',
  },
  flowContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    width: '100%',
    maxWidth: SCREEN_MAX_WIDTH,
    alignSelf: 'center',
  },
  flowCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
  },
  flowArabicContainer: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  flowArabicText: {
    fontFamily: 'Amiri_400Regular',
  },
  flowMedallion: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mushafPageCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
    marginBottom: 16,
  },
  pageIndicator: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 16,
  },
  pageIndicatorText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
