import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeContext } from '../context/ThemeContext';
import { fetchHadithChapter, type HadithRecord } from '../services/hadith';
import { SCREEN_MAX_WIDTH, themeColors } from '../styles/theme';

export const HadithTopicScreen = () => {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { theme } = useThemeContext();
  const themePalette = themeColors[theme];
  const chapterId = Number(id);
  const screenTitle = typeof title === 'string' && title.trim() ? title : 'Hadith Topic';
  const [hadiths, setHadiths] = useState<HadithRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const colors = useMemo(
    () => ({
      page: themePalette.bgSecondary,
      card: themePalette.bgCard,
      border: themePalette.border,
      text: themePalette.textPrimary,
      muted: themePalette.textSecondary,
      faint: themePalette.textTertiary,
      accent: themePalette.accent,
      accentSoft: themePalette.accentLight,
    }),
    [theme, themePalette]
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError('');

    if (!Number.isInteger(chapterId) || chapterId < 1) {
      setError('This Hadith topic is invalid.');
      setLoading(false);
      return () => controller.abort();
    }

    fetchHadithChapter('bukhari', chapterId, controller.signal)
      .then(result => {
        if (active) setHadiths(result);
      })
      .catch(requestError => {
        if (active && requestError instanceof Error && requestError.name !== 'AbortError') {
          setError('Hadiths could not be loaded. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [chapterId, retryKey]);

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: colors.page }]}>
      <Stack.Screen options={{ title: screenTitle }} />
      <FlatList
        data={loading || error ? [] : hadiths}
        keyExtractor={item => String(item.id)}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.heading}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>SAHIH AL BUKHARI</Text>
            <Text selectable style={[styles.title, { color: colors.text }]}>{screenTitle}</Text>
            {!loading && !error ? (
              <Text style={[styles.count, { color: colors.muted }]}>{hadiths.length} Hadiths</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.state}>
            {loading ? <ActivityIndicator color={colors.accent} /> : null}
            <Text selectable style={[styles.stateText, { color: colors.muted }]}>
              {loading ? 'Loading Hadiths...' : error || 'No Hadiths are available for this topic.'}
            </Text>
            {error ? (
              <TouchableOpacity
                onPress={() => setRetryKey(value => value + 1)}
                style={[styles.retryButton, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.hadithCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.hadithLabel, { color: colors.accent }]}>HADITH {item.id}</Text>
              <View style={[styles.numberBadge, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.numberText, { color: colors.accent }]}>{item.reference.hadith}</Text>
              </View>
            </View>
            <Text selectable style={[styles.hadithText, { color: colors.text }]}>{item.text}</Text>
            <Text selectable style={[styles.reference, { color: colors.faint }]}>
              Reference: Book {item.reference.book}, Hadith {item.reference.hadith}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: SCREEN_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 112 },
  heading: { marginBottom: 16 },
  eyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.05 },
  title: { fontSize: 23, lineHeight: 30, fontWeight: '800', letterSpacing: -0.35, marginTop: 4 },
  count: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  separator: { height: 11 },
  state: { minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 13, paddingHorizontal: 26 },
  stateText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: { minHeight: 44, borderRadius: 99, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  hadithCard: { borderWidth: 1, borderRadius: 18, padding: 17, boxShadow: '0 3px 12px rgba(0,0,0,0.045)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  hadithLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  numberBadge: { minWidth: 36, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  numberText: { fontSize: 10, fontWeight: '800', fontVariant: ['tabular-nums'] },
  hadithText: { fontSize: 13, lineHeight: 21, marginTop: 13 },
  reference: { fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 13 },
});
