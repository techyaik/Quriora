import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAudioContext } from '../context/AudioContext';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, globalStyles, AUDIO_BAR_HEIGHT } from '../styles/theme';
import { Play, Pause, Headphones, Check } from 'lucide-react-native';

export const ListenScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    isPlaying, currentSurahId, currentAyahNumber, currentReciterId,
    reciters, playSurah, pause, resume, changeReciter,
    playbackSpeed, setSpeed, isRepeatSurah, toggleRepeatSurah, audioProgress,
  } = useAudioContext();

  const [selectedSurahId, setSelectedSurahId] = useState(currentSurahId || 1);
  const colors = themeColors[useThemeContext().theme];

  const SPEEDS = [0.75, 1, 1.25, 1.5];
  const POPULAR_SURAHS = [
    { id: 1, name: 'Al-Fatiha', arabic: 'الفاتحة' },
    { id: 2, name: 'Al-Baqarah', arabic: 'البقرة' },
    { id: 18, name: 'Al-Kahf', arabic: 'الكهف' },
    { id: 36, name: 'Ya-Sin', arabic: 'يس' },
    { id: 55, name: 'Ar-Rahman', arabic: 'الرحمن' },
    { id: 67, name: 'Al-Mulk', arabic: 'الملك' },
    { id: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص' },
    { id: 114, name: 'An-Nas', arabic: 'الناس' },
  ];

  const activeReciter = reciters.find(r => r.id === currentReciterId);
  const isCurrentPlaying = isPlaying && currentSurahId === selectedSurahId;

  const handlePlay = async () => {
    if (isCurrentPlaying) {
      await pause();
      return;
    }
    if (currentSurahId === selectedSurahId) {
      await resume();
      return;
    }
    await playSurah(selectedSurahId, 1);
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: AUDIO_BAR_HEIGHT + 24 }]} showsVerticalScrollIndicator={false}>
        
        {/* Hero Player Card */}
        <View style={[styles.playerCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.artworkFrame, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
            <Headphones size={42} color={colors.accent} />
          </View>

          <Text style={[styles.trackName, { color: colors.textPrimary }]}>
            {POPULAR_SURAHS.find(s => s.id === selectedSurahId)?.name || `Surah ${selectedSurahId}`}
          </Text>
          <Text style={[styles.trackArtist, { color: colors.textSecondary }]}>
            {activeReciter?.nameEnglish || 'Select a Reciter'}
            {currentAyahNumber && currentSurahId === selectedSurahId && ` · Ayah ${currentAyahNumber}`}
          </Text>

          {/* Progress bar */}
          {currentSurahId === selectedSurahId && (
            <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { width: `${audioProgress * 100}%`, backgroundColor: colors.accent }]} />
            </View>
          )}

          {/* Player controls */}
          <View style={styles.playerControls}>
            <TouchableOpacity
              onPress={handlePlay}
              style={[styles.primaryPlayBtn, { backgroundColor: colors.accent }]}
            >
              {isCurrentPlaying ? (
                <Pause size={20} color="#fff" />
              ) : (
                <Play size={20} color="#fff" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Speed & loop selectors */}
          <View style={styles.selectorsRow}>
            <TouchableOpacity
              onPress={async () => {
                const idx = SPEEDS.indexOf(playbackSpeed);
                await setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
              }}
              style={[styles.smallSelectorBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            >
              <Text style={[styles.smallSelectorText, { color: colors.textSecondary }]}>
                {playbackSpeed}× speed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleRepeatSurah}
              style={[
                styles.smallSelectorBtn,
                {
                  backgroundColor: isRepeatSurah ? colors.accentLight : colors.bgSecondary,
                  borderColor: isRepeatSurah ? colors.accent : colors.border
                }
              ]}
            >
              <Text style={[styles.smallSelectorText, { color: isRepeatSurah ? colors.accent : colors.textSecondary }]}>
                Loop Surah
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Recitations Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Popular Recitations</Text>
          <View style={styles.grid}>
            {POPULAR_SURAHS.map(surah => {
              const selected = selectedSurahId === surah.id;
              return (
                <TouchableOpacity
                  key={surah.id}
                  onPress={async () => {
                    setSelectedSurahId(surah.id);
                    await playSurah(surah.id, 1);
                  }}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: selected ? colors.accent : colors.border,
                      borderWidth: selected ? 1.5 : 1
                    }
                  ]}
                >
                  <Text style={[styles.gridName, { color: selected ? colors.accent : colors.textPrimary }]}>
                    {surah.name}
                  </Text>
                  <Text style={styles.gridArabic}>{surah.arabic}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reciter Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Reciter</Text>
          <View style={styles.list}>
            {reciters.map(r => (
              <TouchableOpacity
                key={r.id}
                onPress={() => changeReciter(r.id)}
                style={[
                  styles.listItem,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: r.id === currentReciterId ? colors.accent : colors.border,
                    borderWidth: r.id === currentReciterId ? 1.5 : 1
                  }
                ]}
              >
                <View>
                  <Text style={[styles.listName, { color: r.id === currentReciterId ? colors.accent : colors.textPrimary }]}>
                    {r.nameEnglish}
                  </Text>
                  <Text style={[styles.listSub, { color: colors.textSecondary }]}>{r.style}</Text>
                </View>
                {r.id === currentReciterId && (
                  <Check size={16} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
  playerCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 22,
  },
  artworkFrame: {
    width: 110,
    height: 110,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  trackName: {
    fontSize: 18,
    fontWeight: '800',
  },
  trackArtist: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  progressBarTrack: {
    height: 4,
    width: '90%',
    borderRadius: 99,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 18,
  },
  primaryPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  smallSelectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  smallSelectorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  gridName: {
    fontSize: 12,
    fontWeight: '700',
  },
  gridArabic: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 14,
    textAlign: 'right',
    color: '#9C9690',
  },
  list: {
    gap: 6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  listName: {
    fontSize: 13,
    fontWeight: '700',
  },
  listSub: {
    fontSize: 10,
    marginTop: 1,
  },
});
