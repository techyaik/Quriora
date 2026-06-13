import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
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

interface WordBreakdown {
  word: string;
  transliteration: string;
  meaning: string;
  root: string;
  grammar: string;
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
  const [words, setWords] = useState<WordBreakdown[]>([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !ayahId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch Tafseer
        const res = await axios.get(`/api/tafseer/${ayahId}`, {
          params: { source, lang: language }
        });
        if (res.data.success) {
          setTafseer(res.data.data);
        }

        // Fetch Ayah details for word-by-word breakdown
        const ayahRes = await axios.get(`/api/ayahs/${ayahId}`);
        if (ayahRes.data.success) {
          const text = ayahRes.data.data.textUthmani;
          setAyahText(text);
          generateWordBreakdown(text);
        }
      } catch (err) {
        console.error('Failed to load Tafseer/Ayah details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    setSelectedWordIndex(null); // Reset word selection
  }, [isOpen, ayahId, source, language]);

  const generateWordBreakdown = (text: string) => {
    let cleanText = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
    if (!cleanText) cleanText = text;

    const rawWords = cleanText.split(/\s+/).filter(w => w.length > 0);
    
    const breakdowns: WordBreakdown[] = rawWords.map((word) => {
      const cleanWord = word.replace(/[\u064B-\u065F\u0670]/g, '');
      
      let transliteration = 'wal';
      let meaning = 'and';
      let root = 'w-l-y';
      let grammar = 'Conjunction particles';

      if (cleanWord.includes('بِسْمِ')) {
        transliteration = 'Bismi'; meaning = 'In the name of'; root = 's-m-w'; grammar = 'Preposition + Noun (genitive)';
      } else if (cleanWord.includes('اللَّهِ') || cleanWord.includes('ٱللَّهِ')) {
        transliteration = 'Allahi'; meaning = 'Allah'; root = 'a-l-h'; grammar = 'Proper Noun (genitive)';
      } else if (cleanWord.includes('الرَّحْمَٰنِ') || cleanWord.includes('ٱلرَّحْمَٰنِ')) {
        transliteration = 'Ar-Rahmaan'; meaning = 'the Entirely Merciful'; root = 'r-h-m'; grammar = 'Adjective (genitive)';
      } else if (cleanWord.includes('الرَّحِيمِ') || cleanWord.includes('ٱلرَّحِيمِ')) {
        transliteration = 'Ar-Rahim'; meaning = 'the Especially Merciful'; root = 'r-h-m'; grammar = 'Adjective (genitive)';
      } else if (cleanWord.includes('الْحَمْدُ') || cleanWord.includes('ٱلْحَمْدُ')) {
        transliteration = 'Al-Hamdu'; meaning = 'All praise'; root = 'h-m-d'; grammar = 'Noun (nominative)';
      } else if (cleanWord.includes('رَبِّ')) {
        transliteration = 'Rabbi'; meaning = 'Lord'; root = 'r-b-b'; grammar = 'Noun (genitive)';
      } else if (cleanWord.includes('الْعَالَمِينَ') || cleanWord.includes('ٱلْعَالَمِينَ')) {
        transliteration = 'Al-Aalameen'; meaning = 'of the worlds'; root = 'a-l-m'; grammar = 'Noun (genitive plural)';
      } else if (cleanWord.includes('مَالِكِ')) {
        transliteration = 'Maaliki'; meaning = 'Master/Owner'; root = 'm-l-k'; grammar = 'Active participle';
      } else if (cleanWord.includes('يَوْمِ')) {
        transliteration = 'Yawmi'; meaning = 'Day'; root = 'y-w-m'; grammar = 'Noun (genitive)';
      } else if (cleanWord.includes('الدِّينِ') || cleanWord.includes('ٱلدِّينِ')) {
        transliteration = 'Ad-Deen'; meaning = 'of Judgment'; root = 'd-y-n'; grammar = 'Noun (genitive)';
      } else if (cleanWord.includes('إِيَّاكَ')) {
        transliteration = 'Iyyaaka'; meaning = 'You alone'; root = 'a-y-y'; grammar = 'Personal pronoun';
      } else if (cleanWord.includes('نَعْبُدُ')) {
        transliteration = 'Na\'budu'; meaning = 'we worship'; root = 'a-b-d'; grammar = 'Verb (imperfect, 1st person plural)';
      } else if (cleanWord.includes('نَسْتَعِينُ')) {
        transliteration = 'Nasta\'een'; meaning = 'we ask for help'; root = 'a-w-n'; grammar = 'Form X Verb (imperfect)';
      } else if (cleanWord.includes('اهْدِنَا') || cleanWord.includes('ٱهْدِنَا')) {
        transliteration = 'Ihudinaa'; meaning = 'Guide us'; root = 'h-d-y'; grammar = 'Imperative Verb + Object Pronoun';
      } else if (cleanWord.includes('الصِّرَاطَ') || cleanWord.includes('ٱلصِّرَاطَ')) {
        transliteration = 'As-Siraat'; meaning = 'the Path'; root = 's-r-t'; grammar = 'Noun (accusative)';
      } else if (cleanWord.includes('الْمُسْتَقِيمَ') || cleanWord.includes('ٱلْمُسْتَقِيمَ')) {
        transliteration = 'Al-Mustaqeem'; meaning = 'the Straight'; root = 'q-w-m'; grammar = 'Active participle (Form X)';
      } else {
        if (cleanWord.startsWith('ال') || cleanWord.startsWith('ٱل')) {
          transliteration = 'al-' + cleanWord.slice(2, 6);
          meaning = 'the (defined)';
          root = cleanWord.slice(2, 5) || 'n/a';
          grammar = 'Definite Noun';
        } else if (cleanWord.startsWith('و')) {
          transliteration = 'wa-' + cleanWord.slice(1, 5);
          meaning = 'and ...';
          root = cleanWord.slice(1, 4) || 'n/a';
          grammar = 'Conjunction particle + Noun';
        } else {
          transliteration = cleanWord.slice(0, 5);
          meaning = 'Word reference';
          root = cleanWord.slice(0, 3) || 'n/a';
          grammar = 'General particle/noun';
        }
      }

      return {
        word,
        transliteration,
        meaning,
        root: root.split('').join('-'),
        grammar
      };
    });

    setWords(breakdowns);
  };

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
                  Word-by-word breakdown
                </Text>
              </View>

              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wordsScroll}>
                {words.map((w, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedWordIndex(selectedWordIndex === idx ? null : idx)}
                    style={[
                      styles.wordCard,
                      {
                        borderColor: colors.border,
                        backgroundColor: selectedWordIndex === idx ? colors.accentLight : colors.bgCard
                      },
                      selectedWordIndex === idx && { borderColor: colors.accent, borderWidth: 1.5 }
                    ]}
                  >
                    <Text style={[styles.wordArabic, { color: colors.textPrimary }]}>{w.word}</Text>
                    <Text style={[styles.wordTrans, { color: colors.textSecondary }]}>{w.transliteration}</Text>
                    <Text style={[styles.wordMean, { color: colors.textPrimary }]}>{w.meaning}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedWordIndex !== null && words[selectedWordIndex] && (
                <View style={[styles.grammarCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
                  <View style={styles.grammarHeader}>
                    <Text style={[styles.grammarBadge, { color: colors.accent }]}>WORD GRAMMAR</Text>
                    <TouchableOpacity onPress={() => setSelectedWordIndex(null)}>
                      <Text style={{ fontSize: 10, color: colors.accent, fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.grammarWord, { color: colors.textPrimary }]}>
                    {words[selectedWordIndex].word}
                  </Text>
                  <View style={styles.grammarRow}>
                    <View>
                      <Text style={[styles.grammarLabel, { color: colors.textSecondary }]}>TRANSLITERATION</Text>
                      <Text style={[styles.grammarVal, { color: colors.textPrimary }]}>{words[selectedWordIndex].transliteration}</Text>
                    </View>
                    <View>
                      <Text style={[styles.grammarLabel, { color: colors.textSecondary, textAlign: 'right' }]}>ROOT</Text>
                      <Text style={[styles.grammarVal, { color: colors.textPrimary, textAlign: 'right', fontFamily: 'Amiri_700Bold' }]}>
                        {words[selectedWordIndex].root}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.grammarFull}>
                    <Text style={[styles.grammarLabel, { color: colors.textSecondary }]}>MORPHOLOGY & GRAMMAR</Text>
                    <Text style={[styles.grammarVal, { color: colors.textPrimary }]}>{words[selectedWordIndex].grammar}</Text>
                  </View>
                </View>
              )}
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
  wordTrans: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  wordMean: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
  },
  grammarCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  grammarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grammarBadge: {
    fontSize: 9,
    fontWeight: '800',
  },
  grammarWord: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  grammarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  grammarLabel: {
    fontSize: 8,
    fontWeight: '800',
  },
  grammarVal: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  grammarFull: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
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
