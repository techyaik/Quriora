import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Search,
  X,
} from 'lucide-react-native';

import { useThemeContext } from '../context/ThemeContext';
import {
  fetchHadithChapter,
  fetchHadithMetadata,
  type HadithCollectionId,
  type HadithMetadata,
  type HadithRecord,
} from '../services/hadith';
import { searchQuran } from '../services/quranFallback';
import { themeColors } from '../styles/theme';

interface ExplorePalette {
  page: string;
  card: string;
  cardMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
}

const getPalette = (theme: 'light' | 'dark' | 'sepia'): ExplorePalette => {
  const colors = themeColors[theme];
  return {
    page: colors.bgSecondary,
    card: theme === 'dark' ? '#202631' : theme === 'sepia' ? '#FFF8EA' : '#FFFFFF',
    cardMuted: theme === 'dark' ? '#252C38' : theme === 'sepia' ? '#F5EBD8' : '#F2F6F3',
    border: colors.border,
    text: colors.textPrimary,
    textMuted: colors.textSecondary,
    textFaint: colors.textTertiary,
    accent: colors.accent,
    accentSoft: colors.accentLight,
  };
};

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const { theme } = useThemeContext();
  const palette = getPalette(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const collectionId: HadithCollectionId = 'bukhari';
  const [metadata, setMetadata] = useState<HadithMetadata | null>(null);
  const [chapterId, setChapterId] = useState(1);
  const [hadiths, setHadiths] = useState<HadithRecord[]>([]);
  const [hadithIndex, setHadithIndex] = useState(0);
  const [hadithLoading, setHadithLoading] = useState(true);
  const [hadithError, setHadithError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setSearchResults((await searchQuran(searchQuery.trim(), 'en')).slice(0, 5));
      } catch (error) {
        console.warn('Explore Quran search failed:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setMetadata(null);
    fetchHadithMetadata(collectionId, controller.signal)
      .then(result => {
        if (!active) return;
        setMetadata(result);
        setChapterId(current =>
          result.chapters.some(chapter => chapter.id === current)
            ? current
            : (result.chapters[0]?.id ?? 1)
        );
      })
      .catch(error => {
        if (active && error instanceof Error && error.name !== 'AbortError') {
          setHadithError('Collection details could not be loaded.');
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [collectionId, retryKey]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setHadithLoading(true);
    setHadithError('');
    setHadiths([]);

    fetchHadithChapter(collectionId, chapterId, controller.signal)
      .then(records => {
        if (!active) return;
        setHadiths(records);
        const day = Math.floor(Date.now() / 86400000);
        setHadithIndex(records.length > 0 ? day % records.length : 0);
      })
      .catch(error => {
        if (active && error instanceof Error && error.name !== 'AbortError') {
          setHadithError('Hadith content is unavailable right now. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (active) setHadithLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [collectionId, chapterId, retryKey]);

  const selectedHadith = hadiths[hadithIndex];
  const selectedChapter = metadata?.chapters.find(chapter => chapter.id === chapterId);
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const showPreviousHadith = () => {
    setHadithIndex(index => (index === 0 ? hadiths.length - 1 : index - 1));
  };

  const showNextHadith = () => {
    setHadithIndex(index => (index + 1) % hadiths.length);
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.page }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>DISCOVER AND REFLECT</Text>
          <Text style={styles.heroTitle}>Explore</Text>
          <Text style={styles.heroSubtitle}>
            Search the Quran, study authentic Hadith, and continue your learning journey.
          </Text>

          <View style={styles.searchContainer}>
            <Search size={18} color="#789089" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Surahs, topics, Tafsir..."
              placeholderTextColor="#789089"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <X size={16} color="#789089" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          {(searchResults.length > 0 || searching) && (
            <View style={[styles.resultsCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              {searching ? (
                <ActivityIndicator size="small" color={palette.accent} style={styles.resultLoader} />
              ) : (
                searchResults.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      clearSearch();
                      router.push({
                        pathname: '/quran/surah/[id]',
                        params: { id: item.surahId, highlight: item.id },
                      });
                    }}
                    style={[styles.resultItem, { borderBottomColor: palette.border }]}
                  >
                    <Text style={[styles.resultMeta, { color: palette.accent }]}>
                      {item.surah?.nameEnglish} {item.surahId}:{item.ayahNumber}
                    </Text>
                    <Text
                      style={[styles.resultArabic, { color: palette.text }]}
                      numberOfLines={1}
                    >
                      {item.textUthmani}
                    </Text>
                    <Text
                      style={[styles.resultTranslation, { color: palette.textMuted }]}
                      numberOfLines={2}
                    >
                      {item.translations?.find((translation: any) => translation.language === 'en')?.text}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                onPress={() => {
                  clearSearch();
                  router.push('/explore/search');
                }}
                style={styles.viewResultsButton}
              >
                <Text style={[styles.viewResultsText, { color: palette.accent }]}>View all results</Text>
                <ChevronRight size={15} color={palette.accent} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/explore/topics')}
            style={[styles.topicEntry, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <View style={[styles.topicEntryIcon, { backgroundColor: palette.accentSoft }]}>
              <MessageSquareText size={21} color={palette.accent} />
            </View>
            <View style={styles.topicEntryText}>
              <Text style={[styles.topicEntryTitle, { color: palette.text }]}>Explore By Topic</Text>
              <Text style={[styles.topicEntrySubtitle, { color: palette.textMuted }]}>
                Browse Sahih al Bukhari by book and subject
              </Text>
            </View>
            <ChevronRight size={18} color={palette.accent} />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>HADITH LIBRARY</Text>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Sahih al Bukhari</Text>
            </View>
            <View style={[styles.sourceBadge, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.sourceBadgeText, { color: palette.accent }]}>jsDelivr</Text>
            </View>
          </View>

          {metadata && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chapterList}
            >
              {metadata.chapters.map(chapter => {
                const selected = chapter.id === chapterId;
                return (
                  <TouchableOpacity
                    key={chapter.id}
                    onPress={() => setChapterId(chapter.id)}
                    style={[
                      styles.chapterPill,
                      {
                        backgroundColor: selected ? palette.accent : palette.card,
                        borderColor: selected ? palette.accent : palette.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chapterNumber, { color: selected ? '#FFFFFF' : palette.textFaint }]}>
                      {chapter.id}
                    </Text>
                    <Text
                      style={[styles.chapterName, { color: selected ? '#FFFFFF' : palette.text }]}
                      numberOfLines={1}
                    >
                      {chapter.english}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={[styles.hadithCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {hadithLoading ? (
              <View style={styles.hadithState}>
                <ActivityIndicator size="small" color={palette.accent} />
                <Text style={[styles.stateText, { color: palette.textMuted }]}>Loading Hadith...</Text>
              </View>
            ) : hadithError ? (
              <View style={styles.hadithState}>
                <MessageSquareText size={24} color={palette.textFaint} />
                <Text selectable style={[styles.errorText, { color: palette.textMuted }]}>{hadithError}</Text>
                <TouchableOpacity
                  onPress={() => setRetryKey(value => value + 1)}
                  style={[styles.retryButton, { backgroundColor: palette.accent }]}
                >
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : !selectedHadith ? (
              <View style={styles.hadithState}>
                <Text selectable style={[styles.stateText, { color: palette.textMuted }]}>No Hadith found in this book.</Text>
              </View>
            ) : (
              <>
                <View style={styles.hadithHeader}>
                  <View style={styles.hadithHeaderText}>
                    <Text style={[styles.hadithEyebrow, { color: palette.accent }]}>HADITH OF THE DAY</Text>
                    <Text selectable style={[styles.hadithReference, { color: palette.text }]}>
                      {metadata?.title} · Hadith {selectedHadith.id}
                    </Text>
                  </View>
                  <View style={[styles.hadithNumber, { backgroundColor: palette.accentSoft }]}>
                    <Text style={[styles.hadithNumberText, { color: palette.accent }]}>{selectedHadith.id}</Text>
                  </View>
                </View>

                {selectedChapter && (
                  <View style={[styles.chapterBanner, { backgroundColor: palette.cardMuted }]}>
                    <View style={styles.chapterBannerText}>
                      <Text selectable style={[styles.bookName, { color: palette.text }]}>{selectedChapter.english}</Text>
                    </View>
                    <Text style={[styles.bookNumber, { color: palette.textFaint }]}>BOOK {selectedChapter.id}</Text>
                  </View>
                )}

                <Text selectable style={[styles.hadithEnglish, { color: palette.textMuted }]}>
                  {selectedHadith.text}
                </Text>
                <Text selectable style={[styles.apiReference, { color: palette.accent }]}>
                  Reference: Book {selectedHadith.reference.book}, Hadith {selectedHadith.reference.hadith}
                </Text>

                <View style={[styles.hadithFooter, { borderTopColor: palette.border }]}>
                  <TouchableOpacity
                    disabled={hadiths.length < 2}
                    onPress={showPreviousHadith}
                    style={[styles.browseButton, { backgroundColor: palette.cardMuted }]}
                  >
                    <ChevronLeft size={17} color={palette.textMuted} />
                    <Text style={[styles.browseButtonText, { color: palette.textMuted }]}>Previous</Text>
                  </TouchableOpacity>
                  <Text style={[styles.hadithPosition, { color: palette.textFaint }]}>
                    {hadithIndex + 1} of {hadiths.length}
                  </Text>
                  <TouchableOpacity
                    disabled={hadiths.length < 2}
                    onPress={showNextHadith}
                    style={[styles.browseButton, { backgroundColor: palette.accent }]}
                  >
                    <Text style={styles.nextButtonText}>Next</Text>
                    <ChevronRight size={17} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  hero: { backgroundColor: '#0F1D1A', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 26, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#1A7A5E', opacity: 0.09, right: -70, top: -100 },
  heroEyebrow: { color: '#49B994', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.7, marginTop: 5 },
  heroSubtitle: { color: '#789089', fontSize: 12, lineHeight: 19, maxWidth: 330, marginTop: 6 },
  searchContainer: { height: 48, backgroundColor: '#162820', borderWidth: 1, borderColor: '#1E3530', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, marginTop: 18 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 13, paddingVertical: 0 },
  clearButton: { padding: 5 },
  body: { paddingHorizontal: 16, paddingTop: 19, gap: 14 },
  resultsCard: { borderWidth: 1, borderRadius: 18, padding: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
  resultLoader: { padding: 18 },
  resultItem: { padding: 12, borderBottomWidth: 1 },
  resultMeta: { fontSize: 10, fontWeight: '800', marginBottom: 4 },
  resultArabic: { fontFamily: 'Amiri_400Regular', fontSize: 18, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl' },
  resultTranslation: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  viewResultsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 11 },
  viewResultsText: { fontSize: 12, fontWeight: '700' },
  topicEntry: { minHeight: 82, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' },
  topicEntryIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  topicEntryText: { flex: 1 },
  topicEntryTitle: { fontSize: 14, fontWeight: '800' },
  topicEntrySubtitle: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  sectionEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.05, marginBottom: 3 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sourceBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  sourceBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  chapterList: { gap: 8, paddingBottom: 2 },
  chapterPill: { maxWidth: 190, borderWidth: 1, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 8, paddingRight: 13, paddingVertical: 7 },
  chapterNumber: { minWidth: 22, fontSize: 10, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] },
  chapterName: { flexShrink: 1, fontSize: 10, fontWeight: '700' },
  hadithCard: { borderWidth: 1, borderRadius: 20, padding: 18, boxShadow: '0 4px 18px rgba(0,0,0,0.055)' },
  hadithState: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  stateText: { fontSize: 12, textAlign: 'center' },
  errorText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: { borderRadius: 99, paddingHorizontal: 17, paddingVertical: 9 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  hadithHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  hadithHeaderText: { flex: 1 },
  hadithEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.05 },
  hadithReference: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  hadithNumber: { minWidth: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  hadithNumberText: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  chapterBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderRadius: 13, padding: 12, marginTop: 15 },
  chapterBannerText: { flex: 1 },
  bookName: { fontSize: 11, fontWeight: '700' },
  bookNumber: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  hadithEnglish: { fontSize: 13, lineHeight: 21, marginTop: 18 },
  apiReference: { fontSize: 10, fontWeight: '800', lineHeight: 16, marginTop: 14 },
  hadithFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 15, marginTop: 18 },
  browseButton: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 8 },
  browseButtonText: { fontSize: 10, fontWeight: '700' },
  nextButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  hadithPosition: { fontSize: 9, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
