import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchFallbackSurahs, searchQuran } from '../services/quranFallback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, globalStyles } from '../styles/theme';
import {
  Search as SearchIcon,
  Keyboard,
  Trash2,
  BookOpen,
  History,
  X,
  ChevronRight
} from 'lucide-react-native';

interface AyahSearchResult {
  id: number;
  ayahNumber: number;
  surahId: number;
  textUthmani: string;
  textSimple: string;
  translations: Array<{ language: string; text: string }>;
  surah: {
    nameEnglish: string;
    nameArabic: string;
  };
}

export const SearchScreen: React.FC = () => {
  const router = useRouter();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AyahSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Filters
  const [language, setLanguage] = useState<'ar' | 'en' | 'ur'>('en');
  const [selectedSurah, setSelectedSurah] = useState<number | ''>('');
  const [surahsList, setSurahsList] = useState<Array<{ id: number; nameEnglish: string }>>([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  // Arabic virtual keyboard keys
  const arabicKeyboardLayout = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط', 'ذ'],
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'إ', 'أ'],
    ['Space', 'Backspace', 'Clear']
  ];

  // Load Initial Data
  useEffect(() => {
    const initSearch = async () => {
      try {
        setSurahsList(await fetchFallbackSurahs());

        const storedHistory = await AsyncStorage.getItem('nurquran-search-history');
        if (storedHistory) {
          setSearchHistory(JSON.parse(storedHistory));
        }
      } catch (err) {
        console.warn('Failed to init search screen:', err);
      }
    };
    initSearch();
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, language, selectedSurah]);

  const handleSearch = async (searchVal: string) => {
    if (!searchVal.trim()) return;
    setLoading(true);
    try {
      setResults(await searchQuran(searchVal.trim(), language, selectedSurah));
      await saveToHistory(searchVal.trim());
    } catch (err) {
      console.warn('Search request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (searchVal: string) => {
    let history = [...searchHistory];
    history = history.filter(h => h.toLowerCase() !== searchVal.toLowerCase());
    history.unshift(searchVal);
    history = history.slice(0, 10);
    setSearchHistory(history);
    try {
      await AsyncStorage.setItem('nurquran-search-history', JSON.stringify(history));
    } catch (err) {
      console.warn(err);
    }
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    try {
      await AsyncStorage.removeItem('nurquran-search-history');
      Alert.alert('History Cleared', 'Search history has been cleared.');
    } catch (err) {
      console.warn(err);
    }
  };

  const handleKeyboardKeyClick = (key: string) => {
    let newQuery = query;
    if (key === 'Space') {
      newQuery += ' ';
    } else if (key === 'Backspace') {
      newQuery = newQuery.slice(0, -1);
    } else if (key === 'Clear') {
      newQuery = '';
    } else {
      newQuery += key;
    }
    setQuery(newQuery);
  };

  // Render Highlighted text in React Native
  const renderHighlightedText = (text: string, term: string, styleText: any, styleHighlight: any) => {
    if (!term || !text) return <Text style={styleText}>{text}</Text>;
    
    // Escape regex characters
    const escapedTerm = term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <Text style={styleText}>
        {parts.map((part, index) => {
          const isMatch = regex.test(part);
          return (
            <Text key={index} style={isMatch ? styleHighlight : null}>
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  const activeSurahDetails = surahsList.find(s => s.id === selectedSurah);

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <View style={styles.titleRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Full-Text Search</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Search terms across Uthmani script and translations.
          </Text>
        </View>

        {/* Search Bar Panel */}
        <View style={[styles.searchPanel, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.inputContainer}>
            <SearchIcon size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
              ref={searchInputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Type search terms..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.inputField, { color: colors.textPrimary }]}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
                <X size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => setShowKeyboard(!showKeyboard)}
              style={[styles.keyboardBtn, showKeyboard && { backgroundColor: colors.accentLight }]}
            >
              <Keyboard size={16} color={showKeyboard ? colors.accent : colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Virtual Arabic Keyboard */}
          {showKeyboard && (
            <View style={[styles.keyboardContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={styles.keyboardHeader}>
                <Text style={[styles.keyboardTitle, { color: colors.textSecondary }]}>Arabic Virtual Keyboard</Text>
                <TouchableOpacity onPress={() => setShowKeyboard(false)}>
                  <Text style={{ fontSize: 12, color: '#E74C3C', fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.keyboardGrid}>
                {arabicKeyboardLayout.map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.keyboardRow}>
                    {row.map((k) => {
                      const isCtrl = ['Space', 'Backspace', 'Clear'].includes(k);
                      return (
                        <TouchableOpacity
                          key={k}
                          onPress={() => handleKeyboardKeyClick(k)}
                          style={[
                            styles.keyButton,
                            { backgroundColor: colors.bgPrimary, borderColor: colors.border },
                            isCtrl && styles.keyCtrlButton
                          ]}
                        >
                          <Text style={[styles.keyText, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{k}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Filter Selection Tabs */}
          <View style={[styles.filtersRow, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Search In</Text>
              <View style={[styles.langTabs, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                {(['en', 'ar', 'ur'] as const).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    style={[
                      styles.langTabButton,
                      language === lang && { backgroundColor: colors.accent }
                    ]}
                  >
                    <Text style={[
                      styles.langTabButtonText,
                      { color: language === lang ? '#fff' : colors.textSecondary }
                    ]}>
                      {lang === 'en' ? 'English' : lang === 'ar' ? 'Arabic' : 'Urdu'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Surah Scope</Text>
              {/* Fake dropdown selector click modal */}
              <TouchableOpacity
                onPress={() => setPickerVisible(true)}
                style={[styles.scopePicker, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              >
                <Text style={[styles.scopePickerText, { color: colors.textPrimary }]} numberOfLines={1}>
                  {activeSurahDetails ? `Surah ${activeSurahDetails.id}` : 'All Quran'}
                </Text>
                <ChevronRight size={14} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Results Pane and History Grid split */}
        <View style={styles.resultsSplit}>
          
          {/* Results Area */}
          <View style={styles.resultsPane}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Search Results {results.length > 0 && `(${results.length})`}
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 24 }} />
            ) : results.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <BookOpen size={32} color={colors.textTertiary} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {query ? 'No matches found' : 'Ready to search'}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  {query ? 'Try refining query terms or changing languages.' : 'Enter keyword queries to quickly extract scriptures.'}
                </Text>
              </View>
            ) : (
              <View style={[styles.resultsList, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                {results.map((item) => {
                  const enTrans = item.translations.find(t => t.language === 'en')?.text || '';
                  const urTrans = item.translations.find(t => t.language === 'ur')?.text || '';

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => router.push({ pathname: '/quran/surah/[id]', params: { id: item.surahId, highlight: item.id } })}
                      style={[styles.resultCard, { borderBottomColor: colors.border }]}
                    >
                      <View style={[styles.resultCardHeader, { backgroundColor: colors.bgSecondary }]}>
                        <Text style={[styles.resultCardTitle, { color: colors.textSecondary }]}>
                          Surah {item.surah.nameEnglish} · {item.surahId}:{item.ayahNumber}
                        </Text>
                      </View>

                      {/* Arabic Verse rendering */}
                      <View style={{ marginVertical: 8 }}>
                        {language === 'ar' ? (
                          renderHighlightedText(
                            item.textUthmani,
                            query,
                            [styles.resultArabic, { color: colors.textPrimary }],
                            { color: colors.gold, fontWeight: '800' }
                          )
                        ) : (
                          <Text style={[styles.resultArabic, { color: colors.textPrimary }]}>
                            {item.textUthmani}
                          </Text>
                        )}
                      </View>

                      {/* Translations */}
                      <View style={[styles.resultTranslationBlock, { borderLeftColor: colors.border }]}>
                        {enTrans ? (
                          <View style={{ marginBottom: 6 }}>
                            {language === 'en' ? (
                              renderHighlightedText(
                                enTrans,
                                query,
                                [styles.resultTranslationText, { color: colors.textPrimary }],
                                { color: colors.gold, fontWeight: '800', backgroundColor: colors.goldLight }
                              )
                            ) : (
                              <Text style={[styles.resultTranslationText, { color: colors.textPrimary }]}>
                                {enTrans}
                              </Text>
                            )}
                          </View>
                        ) : null}

                        {urTrans ? (
                          <View>
                            {language === 'ur' ? (
                              renderHighlightedText(
                                urTrans,
                                query,
                                [styles.resultUrduText, { color: colors.textSecondary }],
                                { color: colors.gold, fontWeight: '800', backgroundColor: colors.goldLight }
                              )
                            ) : (
                              <Text style={[styles.resultUrduText, { color: colors.textSecondary }]}>
                                {urTrans}
                              </Text>
                            )}
                          </View>
                        ) : null}
                      </View>

                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* History Area */}
          <View style={styles.historyPane}>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                Search History
              </Text>
              {searchHistory.length > 0 && (
                <TouchableOpacity onPress={clearHistory} style={styles.clearHistoryBtn}>
                  <Trash2 size={12} color="#E74C3C" />
                  <Text style={styles.clearHistoryText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {searchHistory.length === 0 ? (
              <View style={[styles.emptyHistoryBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <History size={18} color={colors.textTertiary} style={{ opacity: 0.5, marginBottom: 4 }} />
                <Text style={[styles.emptyHistoryText, { color: colors.textTertiary }]}>No past searches</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {searchHistory.map((hist, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setQuery(hist);
                      handleSearch(hist);
                    }}
                    style={[styles.historyItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  >
                    <Text style={[styles.historyItemText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {hist}
                    </Text>
                    <ChevronRight size={14} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

        </View>

      </ScrollView>

      {/* Scope Surah Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Surah Scope</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.modalClose}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TouchableOpacity
                onPress={() => {
                  setSelectedSurah('');
                  setPickerVisible(false);
                }}
                style={[
                  styles.modalListItem,
                  { borderBottomColor: colors.border },
                  selectedSurah === '' && { backgroundColor: colors.accentLight }
                ]}
              >
                <Text style={[
                  styles.modalListItemText,
                  { color: selectedSurah === '' ? colors.accent : colors.textPrimary }
                ]}>
                  All Quran (114 Surahs)
                </Text>
              </TouchableOpacity>

              {surahsList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setSelectedSurah(item.id);
                    setPickerVisible(false);
                  }}
                  style={[
                    styles.modalListItem,
                    { borderBottomColor: colors.border },
                    selectedSurah === item.id && { backgroundColor: colors.accentLight }
                  ]}
                >
                  <Text style={[
                    styles.modalListItemText,
                    { color: selectedSurah === item.id ? colors.accent : colors.textPrimary }
                  ]}>
                    Surah {item.id}: {item.nameEnglish}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  titleRow: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  searchPanel: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    height: '100%',
  },
  keyboardBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    borderTopWidth: 0.8,
    paddingTop: 12,
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
    marginLeft: 4,
  },
  langTabs: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    padding: 2,
  },
  langTabButton: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTabButtonText: {
    fontSize: 9,
    fontWeight: '800',
  },
  scopePicker: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  scopePickerText: {
    fontSize: 10,
    fontWeight: '700',
    maxWidth: '80%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingLeft: 4,
  },
  resultsSplit: {
    flexDirection: 'column',
    gap: 20,
  },
  resultsPane: {
    flex: 1,
  },
  historyPane: {
    width: '100%',
  },
  emptyBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 2,
  },
  resultsList: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  resultCard: {
    borderBottomWidth: 1,
    padding: 16,
  },
  resultCardHeader: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  resultCardTitle: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  resultArabic: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'right',
  },
  resultTranslationBlock: {
    borderLeftWidth: 2,
    paddingLeft: 8,
  },
  resultTranslationText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  resultUrduText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'right',
  },
  /* KEYBOARD STYLES */
  keyboardContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginTop: 10,
  },
  keyboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  keyboardTitle: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  keyboardGrid: {
    gap: 4,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  keyButton: {
    flex: 1,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCtrlButton: {
    flex: 2,
  },
  keyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  /* HISTORY */
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearHistoryText: {
    color: '#E74C3C',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyHistoryBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyList: {
    gap: 6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyItemText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalClose: {
    padding: 4,
  },
  modalListItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  modalListItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
