import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  TopicCard,
} from '../components/explore-topic-components';
import { useThemeContext } from '../context/ThemeContext';
import { getHadithTopics, type HadithTopic } from '../services/hadith';
import { themeColors } from '../styles/theme';

export const ExploreTopicsScreen = () => {
  const router = useRouter();
  const { theme } = useThemeContext();
  const themePalette = themeColors[theme];
  const [topics, setTopics] = useState<HadithTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const colors = useMemo(
    () => ({
      page: themePalette.bgSecondary,
      card: theme === 'dark' ? '#202631' : theme === 'sepia' ? '#FFF8EA' : '#FFFFFF',
      border: themePalette.border,
      text: themePalette.textPrimary,
      muted: themePalette.textSecondary,
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

    getHadithTopics(controller.signal)
      .then(result => {
        if (active) setTopics(result);
      })
      .catch(requestError => {
        if (active && requestError instanceof Error && requestError.name !== 'AbortError') {
          setError('Topics could not be loaded. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [retryKey]);

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: colors.page }]}>
      <FlatList
        data={loading || error ? [] : topics}
        keyExtractor={topic => String(topic.id)}
        numColumns={2}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={[styles.banner, { backgroundColor: colors.accent }]}>
            <Text style={styles.bannerText}>Get answers from Quran &amp; Hadith</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState color={colors.accent} />
          ) : error ? (
            <ErrorState
              message={error}
              color={colors.accent}
              onRetry={() => setRetryKey(value => value + 1)}
            />
          ) : (
            <EmptyState color={colors.muted} />
          )
        }
        renderItem={({ item }) => (
          <TopicCard
            topic={item}
            colors={colors}
            onPress={() =>
              router.push({
                pathname: '/explore/topic/[id]',
                params: { id: String(item.id), title: item.english },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 112 },
  banner: {
    minHeight: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  bannerText: { color: '#FFFFFF', fontSize: 15, lineHeight: 21, fontWeight: '800', textAlign: 'center' },
  row: { gap: 10 },
  separator: { height: 10 },
});
