import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Globe, BookOpen, HelpCircle } from 'lucide-react-native';

interface TafseerPanelProps {
  isOpen: boolean;
  ayahId: number | null;
  ayahNumber: number | null;
  surahId: number | null;
  onClose: () => void;
}

interface TafseerData {
  id: number;
  ayahId: number;
  source: string;
  language: string;
  text: string;
}

export const TafseerPanel: React.FC<TafseerPanelProps> = ({
  isOpen,
  ayahId,
  ayahNumber,
  surahId,
  onClose
}) => {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();

  const [tafseer, setTafseer] = useState<TafseerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('Ibn Kathir');
  const [language] = useState('en');
  const [ayahText, setAyahText] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ayahId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Tafseer
        const res = await api.get(`/api/tafseer/${ayahId}`, {
          params: { source, lang: language }
        });
        if (res.data.success) {
          setTafseer(res.data.data);
        }

        // Fetch Ayah details for word-by-word breakdown
        const ayahRes = await api.get(`/api/ayahs/${ayahId}`);
        if (ayahRes.data.success) {
          const text = ayahRes.data.data.textUthmani;
          setAyahText(text);
          setWords(text.split(/\s+/).filter(Boolean));
        }
      } catch (err) {
        console.warn('Failed to load Tafseer/Ayah details:', err);
        setError('Unable to load commentary. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, ayahId, source, language]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.panelContainer, { backgroundColor: colors.bgPrimary }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.bgSecondary }]}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Tafseer & Grammar</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Surah {surahId} • Ayah {ayahNumber}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Selectors Bar */}
          <View style={[styles.selectorsBar, { borderBottomColor: colors.border }]}>
            <View style={styles.selectorItem}>
              <Globe size={12} color={colors.textSecondary} />
              <TouchableOpacity
                onPress={() => setSource(source === 'Ibn Kathir' ? 'Jalalayn' : 'Ibn Kathir')}
              >
                <Text style={[styles.selectorLabel, { color: colors.accent }]}>
                  {source}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
            {/* Arabic Verse text */}
            <View style={[styles.ayahTextContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.ayahText, { color: colors.textPrimary }]}>
                {ayahText}
              </Text>
            </View>

            {/* Word-by-Word Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BookOpen size={12} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Arabic word segmentation
                </Text>
              </View>

              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wordsScroll}>
                {words.map((word, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.wordCard,
                      { borderColor: colors.border, backgroundColor: colors.bgCard }
                    ]}
                  >
                    <Text style={[styles.wordArabic, { color: colors.textPrimary }]}>{word}</Text>
                  </View>
                ))}
              </ScrollView>
              <Text style={[styles.dataNote, { color: colors.textTertiary }]}>Detailed morphology is shown only when verified word data is provided by the API.</Text>
            </View>

            {/* Commentary Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <HelpCircle size={12} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Commentary ({source})
                </Text>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
              ) : error ? (
                <Text style={[styles.commentaryText, { color: '#C0392B' }]}>{error}</Text>
              ) : (
                <View style={[styles.commentaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <Text style={[styles.commentaryText, { color: colors.textPrimary }]}>
                    {tafseer?.text || 'No commentary available.'}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panelContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  closeBtn: {
    borderWidth: 1,
    padding: 6,
    borderRadius: 99,
  },
  selectorsBar: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
    padding: 18,
  },
  ayahTextContainer: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  ayahText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  wordsScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
  },
  wordCard: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  wordArabic: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dataNote: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },
  commentaryCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  commentaryText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});
