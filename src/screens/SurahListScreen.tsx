import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { fetchFallbackSurahs } from '../services/quranFallback';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, globalStyles } from '../styles/theme';
import { Search, ChevronDown } from 'lucide-react-native';

interface Surah {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  nameMeaning: string;
  revelationType: string;
  ayahCount: number;
  orderRevealed: number;
}

export const SurahListScreen: React.FC = () => {
  const router = useRouter();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState<'id' | 'length' | 'revelation'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchSurahs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/surahs', { timeoutMs: 4000 });
      if (!res.data.success || !Array.isArray(res.data.data) || res.data.data.length !== 114) {
        throw new Error('Invalid Surah response');
      }
      setSurahs(res.data.data);
    } catch {
      try {
        setSurahs(await fetchFallbackSurahs());
      } catch {
        setError('Unable to load the Quran index. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurahs();
  }, []);

  const filtered = surahs.filter(s =>
    s.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nameArabic.includes(searchQuery) ||
    s.nameMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toString() === searchQuery
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'id') cmp = a.id - b.id;
    else if (sortBy === 'length') cmp = a.ayahCount - b.ayahCount;
    else if (sortBy === 'revelation') cmp = a.orderRevealed - b.orderRevealed;
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const juzStartSurahs = [1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 11, 12, 15, 17, 18, 21, 23, 25, 27, 29, 33, 36, 39, 41, 46, 51, 58, 67, 78];

  const renderSurahItem = ({ item }: { item: Surah }) => {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/quran/surah/${item.id}`)}
        style={[styles.surahItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      >
        <View style={[styles.surahNumBadge, { borderColor: colors.gold, backgroundColor: colors.goldLight }]}>
          <Text style={[styles.surahNumText, { color: colors.gold }]}>{item.id}</Text>
        </View>
        
        <View style={styles.surahDetails}>
          <Text style={[styles.surahName, { color: colors.textPrimary }]}>{item.nameEnglish}</Text>
          <Text style={[styles.surahMeaning, { color: colors.textSecondary }]}>{item.nameMeaning}</Text>
          <View style={styles.metaBadgeRow}>
            <Text style={[styles.badge, styles.revelationBadge, { color: colors.accent, backgroundColor: colors.accentLight }]}>
              {item.revelationType}
            </Text>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.ayahCount} verses</Text>
          </View>
        </View>

        <Text style={[styles.surahArabic, { color: colors.accent }]}>{item.nameArabic}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Search size={14} color={colors.textTertiary} />
          <TextInput
            placeholder="Search Surahs..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>
        
        <TouchableOpacity
          onPress={toggleSortOrder}
          style={[styles.sortBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          <Text style={[styles.sortBtnText, { color: colors.textSecondary }]}>
            {sortBy.toUpperCase()} {sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
          <ChevronDown size={12} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Juz Quick jump list */}
      <View style={styles.juzSection}>
        <Text style={[styles.juzTitle, { color: colors.textSecondary }]}>JUMP TO JUZ</Text>
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          data={Array.from({ length: 30 }, (_, i) => i + 1)}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.juzList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/quran/surah/${juzStartSurahs[item - 1]}`)}
              style={[styles.juzBadge, { borderColor: colors.border, backgroundColor: colors.bgCard }]}
            >
              <Text style={[styles.juzBadgeText, { color: colors.textSecondary }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.loadingCenter}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity onPress={fetchSurahs} style={[styles.retryBtn, { backgroundColor: colors.accent }]}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSurahItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  searchHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 99,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    padding: 0,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  juzSection: {
    marginBottom: 10,
  },
  juzTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  juzList: {
    paddingHorizontal: 16,
    gap: 6,
  },
  juzBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1.5,
  },
  juzBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  surahNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  surahNumText: {
    fontSize: 12,
    fontWeight: '800',
  },
  surahDetails: {
    flex: 1,
  },
  surahName: {
    fontSize: 14,
    fontWeight: '700',
  },
  surahMeaning: {
    fontSize: 11,
    marginTop: 1,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    fontSize: 8,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
    textTransform: 'uppercase',
  },
  revelationBadge: {
    fontSize: 8,
  },
  metaText: {
    fontSize: 9,
    fontWeight: '600',
  },
  surahArabic: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
