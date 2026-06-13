import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchFallbackSurahs, searchQuran } from '../services/quranFallback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, globalStyles } from '../styles/theme';
import { Search, X, BookOpen, Star, MessageSquare, GraduationCap, Bookmark, Settings } from 'lucide-react-native';

interface HifzItem {
  id: string;
  repetitions: number;
  nextReviewDate: string;
}

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  const [searchQuery, setSearchQuery] = useState('');
  const [hifzList, setHifzList] = useState<HifzItem[]>([]);
  const [surahs, setSurahs] = useState<Array<{ id: number; nameEnglish: string }>>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Load Hifz lists and browse surahs
  useEffect(() => {
    const loadExploreData = async () => {
      try {
        setSurahs((await fetchFallbackSurahs()).slice(0, 30));

        const storedHifz = await AsyncStorage.getItem('nurquran-hifz-items');
        if (storedHifz) {
          setHifzList(JSON.parse(storedHifz));
        }
      } catch (err) {
        console.warn('Failed to load explore data:', err);
      }
    };
    loadExploreData();
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setSearchResults((await searchQuran(searchQuery.trim(), 'en')).slice(0, 5));
      } catch (err) {
        console.warn('Explore query search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hifzDue = hifzList.filter(h => new Date(h.nextReviewDate) <= new Date());
  const hifzMemorized = hifzList.filter(h => h.repetitions > 1);
  const hifzPct = hifzList.length > 0 ? Math.round((hifzMemorized.length / hifzList.length) * 100) : 0;

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search Input Box */}
        <View style={[styles.searchContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Search size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Surahs, topics, Tafsir..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }} style={styles.clearBtn}>
              <X size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Search Results Overlay Block */}
        {(searchResults.length > 0 || searching) && (
          <View style={[styles.resultsContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {searching ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ padding: 16 }} />
            ) : (
              searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    router.push({ pathname: '/quran/surah/[id]', params: { id: item.surahId, highlight: item.id } });
                  }}
                  style={[styles.resultItem, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.resultMeta, { color: colors.accent }]}>
                    {item.surah?.nameEnglish} {item.surahId}:{item.ayahNumber}
                  </Text>
                  <Text style={[styles.resultArabicText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.textUthmani}
                  </Text>
                  <Text style={[styles.resultTranslation, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.translations?.find((t: any) => t.language === 'en')?.text}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                router.push('/explore/search');
              }}
              style={styles.moreResultsBtn}
            >
              <Text style={[styles.moreResultsText, { color: colors.accent }]}>View all results →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Explore Heading Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 14 }]}>Explore</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            onPress={() => router.navigate('/quran')}
            style={[styles.gridCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: colors.accentLight }]}>
              <BookOpen size={20} color={colors.accent} />
            </View>
            <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Tafsir</Text>
            <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>Deep commentary</Text>
          </TouchableOpacity>

          <View
            style={[styles.gridCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(107,122,222,0.12)' }]}>
              <Star size={20} color="#6B7ADE" />
            </View>
            <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Duas</Text>
            <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>Coming soon</Text>
          </View>

          <View
            style={[styles.gridCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(212,107,26,0.12)' }]}>
              <MessageSquare size={20} color="#D46B1A" />
            </View>
            <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Hadith</Text>
            <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>Coming soon</Text>
          </View>

          <View
            style={[styles.gridCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(212,75,106,0.12)' }]}>
              <GraduationCap size={20} color="#D44B6A" />
            </View>
            <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Learn</Text>
            <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>Coming soon</Text>
          </View>
        </View>

        {/* Hifz Plan Dashboard Card */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Memorization</Text>
        <TouchableOpacity
          onPress={() => router.navigate('/memorize')}
          style={[styles.hifzCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          <View style={styles.hifzHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hifzTitle, { color: colors.textPrimary }]}>Hifz Plan · Juz 30</Text>
              <Text style={[styles.hifzSubtitle, { color: colors.textSecondary }]}>
                {hifzList.length} Surahs · {hifzDue.length} due reviews
              </Text>
            </View>
            <View style={[styles.hifzPctBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.hifzPctText, { color: colors.accent }]}>{hifzPct}%</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${hifzPct}%`, backgroundColor: colors.accent }]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.navigate('/memorize')}
          style={[styles.hifzStartBtn, { backgroundColor: colors.accent }]}
        >
          <Star size={16} color="#fff" fill="#fff" />
          <Text style={styles.hifzStartBtnText}>Start Memorization Session</Text>
        </TouchableOpacity>

        {/* Horizontal Quick Scroll of Surahs */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Browse Surahs</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {surahs.map((surah) => (
            <TouchableOpacity
              key={surah.id}
              onPress={() => router.push(`/quran/surah/${surah.id}`)}
              style={[styles.pillSurah, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              <Text style={[styles.pillSurahText, { color: colors.textSecondary }]}>{surah.nameEnglish}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => router.navigate('/quran')}
            style={[styles.pillSurah, { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.pillSurahText, { color: '#fff', fontWeight: '800' }]}>View all →</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bookmarks / Settings Links Row */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            onPress={() => router.push('/explore/bookmarks')}
            style={[styles.linkCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <Bookmark size={16} color={colors.accent} fill={colors.accent} />
            <Text style={[styles.linkCardText, { color: colors.textPrimary }]}>Bookmarks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/explore/settings')}
            style={[styles.linkCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <Settings size={16} color={colors.accent} />
            <Text style={[styles.linkCardText, { color: colors.textPrimary }]}>Settings</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  resultsContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  resultMeta: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  resultArabicText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'right',
    marginBottom: 4,
  },
  resultTranslation: {
    fontSize: 11,
    lineHeight: 15,
  },
  moreResultsBtn: {
    alignItems: 'center',
    padding: 12,
  },
  moreResultsText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  gridCardDesc: {
    fontSize: 10,
    fontWeight: '500',
  },
  hifzCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  hifzHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hifzTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  hifzSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  hifzPctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hifzPctText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  hifzStartBtn: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hifzStartBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  horizontalScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  pillSurah: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillSurahText: {
    fontSize: 12,
    fontWeight: '700',
  },
  linksRow: {
    flexDirection: 'row',
    gap: 10,
  },
  linkCard: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  linkCardText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
