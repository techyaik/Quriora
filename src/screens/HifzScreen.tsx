import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchFallbackSurahs, fetchQuranSurah } from '../services/quranFallback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioContext } from '../context/AudioContext';
import { useThemeContext } from '../context/ThemeContext';
import { SCREEN_MAX_WIDTH, themeColors, globalStyles } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  Flame,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle,
  RotateCcw,
  ChevronRight,
  Plus,
  Play,
  Pause,
  Sliders,
  TrendingUp,
  X
} from 'lucide-react-native';

interface SurahRange {
  id: number;
  nameEnglish: string;
  ayahCount: number;
}

interface HifzItem {
  id: string; // surahId-ayahNumber
  surahId: number;
  ayahNumber: number;
  textUthmani: string;
  translation: string;
  interval: number; // days
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string; // ISO string
}

export const HifzScreen: React.FC = () => {
  const { playAyah, isPlaying, currentAyahNumber, currentSurahId, pause } = useAudioContext();
  const { fontSize, theme } = useThemeContext();
  const colors = themeColors[theme];

  const [surahs, setSurahs] = useState<SurahRange[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector state
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(7);

  // Active study session
  const [activeSession, setActiveSession] = useState<HifzItem[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [studyMode, setStudyMode] = useState<'read' | 'memorize' | 'test'>('read');
  const [isRevealed, setIsRevealed] = useState(false);

  // Test state
  const [userTestInput, setUserTestInput] = useState('');
  const [testChecked, setTestChecked] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null);

  // Hifz state
  const [hifzList, setHifzList] = useState<HifzItem[]>([]);
  const [streak, setStreak] = useState(0);

  // Picker Modal state
  const [pickerVisible, setPickerVisible] = useState(false);

  // Load Surahs list and AsyncStorage keys
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        setSurahs(await fetchFallbackSurahs());

        const storedHifz = await AsyncStorage.getItem('nurquran-hifz-items');
        if (storedHifz) {
          setHifzList(JSON.parse(storedHifz));
        }

        const storedStreak = await AsyncStorage.getItem('nurquran-hifz-streak');
        if (storedStreak) {
          setStreak(parseInt(storedStreak, 10));
        }
      } catch (err) {
        console.warn('Failed to load initial Hifz data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Save hifz state to storage
  const saveHifzList = async (newList: HifzItem[]) => {
    setHifzList(newList);
    try {
      await AsyncStorage.setItem('nurquran-hifz-items', JSON.stringify(newList));
    } catch (err) {
      console.warn('Failed to save hifz items:', err);
    }
  };

  const activeSurahDetails = surahs.find(s => s.id === selectedSurahId);
  const maxAyahs = activeSurahDetails ? activeSurahDetails.ayahCount : 7;

  useEffect(() => {
    if (startAyah > maxAyahs) setStartAyah(1);
    if (endAyah > maxAyahs || endAyah < startAyah) setEndAyah(maxAyahs);
  }, [selectedSurahId, maxAyahs]);

  // Load verses for study session
  const startStudySession = async () => {
    setLoading(true);
    try {
      const fullSurah = await fetchQuranSurah(selectedSurahId);
      {
        const selectedVerses = fullSurah.ayahs.filter(
          (a: any) => a.ayahNumber >= startAyah && a.ayahNumber <= endAyah
        );

        const items: HifzItem[] = selectedVerses.map((v: any) => {
          const existing = hifzList.find(h => h.id === `${selectedSurahId}-${v.ayahNumber}`);
          const enTranslation = v.translations.find((t: any) => t.language === 'en')?.text || '';

          return existing || {
            id: `${selectedSurahId}-${v.ayahNumber}`,
            surahId: selectedSurahId,
            ayahNumber: v.ayahNumber,
            textUthmani: v.textUthmani,
            translation: enTranslation,
            interval: 0,
            repetitions: 0,
            easeFactor: 2.5,
            nextReviewDate: new Date().toISOString()
          };
        });

        setActiveSession(items);
        setSessionIndex(0);
        setIsRevealed(false);
        setUserTestInput('');
        setTestChecked(false);
        setTestResult(null);
      }
    } catch (err) {
      console.warn('Failed to load session verses:', err);
      Alert.alert('Error', 'Failed to load study verses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SM-2 Spaced Repetition logic for learning progress
  const processSM2Rating = async (qualityRating: number) => {
    if (activeSession.length === 0 || !activeSession[sessionIndex]) return;
    
    const activeItem = activeSession[sessionIndex];
    let { repetitions, interval, easeFactor } = activeItem;

    if (qualityRating >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - qualityRating) * (0.08 + (5 - qualityRating) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const updatedItem: HifzItem = {
      ...activeItem,
      repetitions,
      interval,
      easeFactor,
      nextReviewDate: nextReview.toISOString()
    };

    const newList = hifzList.filter(h => h.id !== activeItem.id);
    newList.push(updatedItem);
    await saveHifzList(newList);

    // Increase Streak
    const today = new Date().toDateString();
    const lastSessionDate = await AsyncStorage.getItem('nurquran-hifz-last-session-date');
    if (lastSessionDate !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      await AsyncStorage.setItem('nurquran-hifz-streak', newStreak.toString());
      await AsyncStorage.setItem('nurquran-hifz-last-session-date', today);
    }

    // Go to next verse in session
    handleNextSessionVerse();
  };

  const handleNextSessionVerse = () => {
    if (sessionIndex + 1 < activeSession.length) {
      setSessionIndex(sessionIndex + 1);
      setIsRevealed(false);
      setUserTestInput('');
      setTestChecked(false);
      setTestResult(null);
    } else {
      Alert.alert('Mubarak / Congratulations!', 'You completed this memorization session.');
      setActiveSession([]);
    }
  };

  const handleAudioPlay = () => {
    if (activeSession.length === 0 || !activeSession[sessionIndex]) return;
    const item = activeSession[sessionIndex];
    if (isPlaying && currentSurahId === item.surahId && currentAyahNumber === item.ayahNumber) {
      pause();
    } else {
      playAyah(item.surahId, item.ayahNumber);
    }
  };

  const handleCheckTest = () => {
    if (activeSession.length === 0 || !activeSession[sessionIndex]) return;
    const item = activeSession[sessionIndex];

    const cleanUthmani = item.textUthmani.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').trim();
    const cleanInput = userTestInput.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').trim();

    const matched = cleanUthmani.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '') ||
                    (cleanUthmani.includes(cleanInput) && cleanInput.length > 5);

    setTestChecked(true);
    setTestResult(matched ? 'success' : 'failure');
  };

  const reviewQueue = hifzList.filter(h => new Date(h.nextReviewDate) <= new Date());

  if (loading && surahs.length === 0) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Hero Banner */}
        <LinearGradient
          colors={[colors.accent, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { backgroundColor: colors.accent }]}
        >
          <View style={styles.heroHeaderRow}>
            <View style={[styles.heroIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <Award size={24} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.heroTitle}>Hifz Memorization</Text>
              <Text style={styles.heroSubtitle}>Spaced reviews lock verses in long-term memory.</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Flame size={12} color="#F4774A" fill="#F4774A" />
              <Text style={styles.statBadgeText}>{streak} Days Streak</Text>
            </View>
            <View style={styles.statBadge}>
              <Calendar size={12} color="#FFF" />
              <Text style={styles.statBadgeText}>{reviewQueue.length} Due reviews</Text>
            </View>
          </View>
        </LinearGradient>

        {activeSession.length === 0 ? (
          /* RANGE SELECTOR PANEL */
          <View style={[styles.cardPanel, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <Sliders size={18} color={colors.accent} />
              <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>Set Memorization Range</Text>
            </View>

            <View style={styles.formRow}>
              {/* Surah custom picker trigger */}
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Surah</Text>
                <TouchableOpacity
                  style={[styles.pickerTrigger, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                  onPress={() => setPickerVisible(true)}
                >
                  <Text style={[styles.pickerTriggerText, { color: colors.textPrimary }]}>
                    {activeSurahDetails ? `Surah ${activeSurahDetails.id}: ${activeSurahDetails.nameEnglish}` : 'Choose Surah'}
                  </Text>
                  <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
              </View>

              {/* Start Ayah Input */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Start Ayah</Text>
                <TextInput
                  keyboardType="numeric"
                  value={startAyah.toString()}
                  onChangeText={(val) => {
                    const parsed = parseInt(val, 10);
                    setStartAyah(isNaN(parsed) ? 1 : Math.max(1, Math.min(maxAyahs, parsed)));
                  }}
                  style={[styles.inputField, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                />
              </View>

              {/* End Ayah Input */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>End Ayah</Text>
                <TextInput
                  keyboardType="numeric"
                  value={endAyah.toString()}
                  onChangeText={(val) => {
                    const parsed = parseInt(val, 10);
                    setEndAyah(isNaN(parsed) ? startAyah : Math.max(startAyah, Math.min(maxAyahs, parsed)));
                  }}
                  style={[styles.inputField, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={startStudySession}
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Start Session</Text>
            </TouchableOpacity>

            <View style={[styles.separatorLine, { borderTopColor: colors.border }]} />

            <View style={styles.infoRow}>
              <TrendingUp size={16} color={colors.accent} />
              <Text style={[styles.infoRowText, { color: colors.textSecondary }]}>
                Total Memorized: {hifzList.filter(h => h.repetitions > 1).length} of {hifzList.length} tracked.
              </Text>
            </View>
          </View>
        ) : (
          /* ACTIVE STUDY SESSION SANDBOX */
          activeSession[sessionIndex] && (
            <View style={[styles.cardPanel, { backgroundColor: colors.bgCard, borderColor: colors.border, padding: 0 }]}>
              {/* Session Title Bar */}
              <View style={[styles.sessionHeaderBar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionHeaderBadge, { color: colors.accent }]}>HIFZ STUDY SESSION</Text>
                  <Text style={[styles.sessionHeaderTitle, { color: colors.textPrimary }]}>
                    {activeSurahDetails?.nameEnglish} · Verse {activeSession[sessionIndex].ayahNumber} of {endAyah}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveSession([])}
                  style={styles.exitBtn}
                >
                  <Text style={styles.exitBtnText}>Exit</Text>
                </TouchableOpacity>
              </View>

              {/* Mode Tabs */}
              <View style={styles.modeTabsRow}>
                {(['read', 'memorize', 'test'] as const).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => {
                      setStudyMode(mode);
                      setIsRevealed(false);
                    }}
                    style={[
                      styles.modeTabButton,
                      studyMode === mode && { backgroundColor: colors.accent }
                    ]}
                  >
                    <Text style={[
                      styles.modeTabButtonText,
                      { color: studyMode === mode ? '#fff' : colors.textSecondary }
                    ]}>
                      {mode.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Main Content Pane */}
              <View style={styles.mainPane}>
                {/* Audio pronuncation */}
                <TouchableOpacity
                  onPress={handleAudioPlay}
                  style={[styles.audioPlayButton, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
                >
                  {isPlaying && currentSurahId === activeSession[sessionIndex].surahId && currentAyahNumber === activeSession[sessionIndex].ayahNumber ? (
                    <Pause size={20} color={colors.accent} fill={colors.accent} />
                  ) : (
                    <Play size={20} color={colors.accent} fill={colors.accent} style={{ marginLeft: 3 }} />
                  )}
                </TouchableOpacity>

                {/* Mode Screens */}
                {studyMode === 'read' && (
                  <View style={styles.paneContent}>
                    <Text style={[styles.arabicVerseText, { fontSize: fontSize, color: colors.textPrimary }]}>
                      {activeSession[sessionIndex].textUthmani}
                    </Text>
                    <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                      {activeSession[sessionIndex].translation}
                    </Text>
                  </View>
                )}

                {studyMode === 'memorize' && (
                  <View style={styles.paneContent}>
                    <View style={[styles.blurContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                      <Text style={[
                        styles.arabicVerseText,
                        { fontSize: fontSize, color: colors.textPrimary },
                        !isRevealed && styles.blurredText
                      ]}>
                        {activeSession[sessionIndex].textUthmani}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setIsRevealed(!isRevealed)}
                      style={[styles.revealToggle, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
                    >
                      {isRevealed ? <EyeOff size={16} color={colors.textPrimary} /> : <Eye size={16} color={colors.textPrimary} />}
                      <Text style={[styles.revealToggleText, { color: colors.textPrimary }]}>
                        {isRevealed ? 'Hide Text' : 'Reveal Text'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {studyMode === 'test' && (
                  <View style={styles.paneContent}>
                    <View style={[styles.hintBlock, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                      <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                        Type the Arabic text of the verse. Diacritics (harakat) are not required.
                      </Text>
                    </View>

                    <TextInput
                      multiline
                      numberOfLines={3}
                      value={userTestInput}
                      onChangeText={setUserTestInput}
                      placeholder="Type the Arabic text here..."
                      placeholderTextColor={colors.textTertiary}
                      editable={!testChecked}
                      style={[
                        styles.arabicInputField,
                        { borderColor: colors.border, backgroundColor: colors.bgSecondary, color: colors.textPrimary }
                      ]}
                    />

                    <View style={styles.testActions}>
                      {!testChecked ? (
                        <TouchableOpacity
                          onPress={handleCheckTest}
                          style={[styles.checkBtn, { backgroundColor: colors.accent }]}
                        >
                          <Text style={styles.checkBtnText}>Check Answer</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.resultFeedbackRow}>
                          {testResult === 'success' ? (
                            <View style={styles.feedbackMsg}>
                              <CheckCircle size={18} color="#2ECC71" />
                              <Text style={styles.feedbackMsgTextSuccess}>Correct!</Text>
                            </View>
                          ) : (
                            <View style={styles.feedbackMsg}>
                              <X size={18} color="#E74C3C" />
                              <Text style={styles.feedbackMsgTextError}>Incorrect</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => {
                              setTestChecked(false);
                              setTestResult(null);
                              setUserTestInput('');
                            }}
                            style={[styles.retryBtn, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
                          >
                            <RotateCcw size={14} color={colors.textPrimary} />
                            <Text style={[styles.retryBtnText, { color: colors.textPrimary }]}>Retry</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* SM-2 Footer Control buttons */}
              <View style={[styles.sessionFooterBar, { borderTopColor: colors.border, backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.sm2Label, { color: colors.textSecondary }]}>
                  RATING (SM-2 SCHEDULER)
                </Text>
                <View style={styles.sm2ButtonsRow}>
                  <TouchableOpacity
                    onPress={() => processSM2Rating(1)}
                    style={[styles.sm2Button, styles.sm2ButtonAgain]}
                  >
                    <Text style={styles.sm2AgainText}>Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => processSM2Rating(3)}
                    style={[styles.sm2Button, styles.sm2ButtonHard]}
                  >
                    <Text style={styles.sm2HardText}>Hard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => processSM2Rating(5)}
                    style={[styles.sm2Button, styles.sm2ButtonKnow]}
                  >
                    <Text style={styles.sm2KnowText}>Easy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleNextSessionVerse}
                    style={[styles.sm2Button, { borderColor: colors.border, backgroundColor: colors.bgPrimary }]}
                  >
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 11 }}>Skip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        )}
      </ScrollView>

      {/* Surah List Selector Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Surah</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.modalClose}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={surahs}
              keyExtractor={(item) => item.id.toString()}
              initialNumToRender={12}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={process.env.EXPO_OS !== 'web'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedSurahId(item.id);
                    setStartAyah(1);
                    setEndAyah(item.ayahCount);
                    setPickerVisible(false);
                  }}
                  style={[
                    styles.modalListItem,
                    { borderBottomColor: colors.border },
                    selectedSurahId === item.id && { backgroundColor: colors.accentLight }
                  ]}
                >
                  <Text style={[
                    styles.modalListItemText,
                    { color: selectedSurahId === item.id ? colors.accent : colors.textPrimary }
                  ]}>
                    Surah {item.id}: {item.nameEnglish} ({item.ayahCount} verses)
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    width: '100%',
    maxWidth: SCREEN_MAX_WIDTH,
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.10)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  statBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardPanel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'column',
    gap: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginLeft: 4,
  },
  pickerTrigger: {
    minHeight: 44,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  pickerTriggerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputField: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.10)',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  separatorLine: {
    borderTopWidth: 0.8,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoRowText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* STUDY SESSION STYLES */
  sessionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sessionHeaderBadge: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sessionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  exitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E74C3C',
    backgroundColor: 'rgba(231,76,60,0.05)',
  },
  exitBtnText: {
    color: '#E74C3C',
    fontSize: 10,
    fontWeight: '700',
  },
  modeTabsRow: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  modeTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  modeTabButtonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  mainPane: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
  },
  audioPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  paneContent: {
    width: '100%',
    alignItems: 'center',
  },
  arabicVerseText: {
    fontFamily: 'Amiri_400Regular',
    lineHeight: 46,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  translationText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 12,
  },
  blurContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: 16,
  },
  blurredText: {
    opacity: 0,
  },
  revealToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  revealToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hintBlock: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  arabicInputField: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    fontFamily: 'Amiri_400Regular',
    fontSize: 18,
    textAlign: 'right',
    minHeight: 80,
    marginBottom: 12,
  },
  testActions: {
    width: '100%',
    alignItems: 'center',
  },
  checkBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  checkBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  resultFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  feedbackMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackMsgTextSuccess: {
    color: '#2ECC71',
    fontWeight: '800',
    fontSize: 12,
  },
  feedbackMsgTextError: {
    color: '#E74C3C',
    fontWeight: '800',
    fontSize: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  retryBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  /* FOOTER BAR */
  sessionFooterBar: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  sm2Label: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  sm2ButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
  },
  sm2Button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sm2ButtonAgain: {
    backgroundColor: 'rgba(231,76,60,0.1)',
  },
  sm2AgainText: {
    color: '#E74C3C',
    fontWeight: '800',
    fontSize: 11,
  },
  sm2ButtonHard: {
    backgroundColor: 'rgba(241,196,15,0.1)',
  },
  sm2HardText: {
    color: '#D4AC0D',
    fontWeight: '800',
    fontSize: 11,
  },
  sm2ButtonKnow: {
    backgroundColor: 'rgba(46,204,113,0.1)',
  },
  sm2KnowText: {
    color: '#27AE60',
    fontWeight: '800',
    fontSize: 11,
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
    maxHeight: '80%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    overflow: 'hidden',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.20)',
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListItem: {
    minHeight: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  modalListItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
