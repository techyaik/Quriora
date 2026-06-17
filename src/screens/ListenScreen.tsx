import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BookOpen,
  Check,
  Clock3,
  Pause,
  Play,
  Repeat2,
  SkipBack,
  SkipForward,
  Square,
} from 'lucide-react-native';

import { useAudioContext } from '../context/AudioContext';
import { useThemeContext } from '../context/ThemeContext';
import { fetchFallbackSurahs } from '../services/quranFallback';
import { themeColors } from '../styles/theme';

interface SurahOption {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  ayahCount: number;
}

interface TrackSliderProps {
  value: number;
  accessibilityLabel: string;
  trackColor: string;
  fillColor: string;
  onChange: (value: number) => void;
}

const TrackSlider = ({ value, accessibilityLabel, trackColor, fillColor, onChange }: TrackSliderProps) => {
  const [width, setWidth] = useState(1);
  const update = (position: number) => onChange(Math.max(0, Math.min(1, position / width)));

  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={event => {
        const amount = event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05;
        onChange(Math.max(0, Math.min(1, value + amount)));
      }}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      onPress={event => update(event.nativeEvent.locationX)}
      style={styles.sliderTouchArea}
    >
      <View style={[styles.sliderTrack, { backgroundColor: trackColor }]}>
        <View style={[styles.sliderFill, { width: `${value * 100}%`, backgroundColor: fillColor }]} />
        <View style={[styles.sliderThumb, { left: `${value * 100}%`, backgroundColor: fillColor }]} />
      </View>
    </Pressable>
  );
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

export const ListenScreen = () => {
  const { width } = useWindowDimensions();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const compact = width < 360;
  const {
    isPlaying,
    currentSurahId,
    currentAyahNumber,
    currentReciterId,
    reciters,
    playSurah,
    pause,
    resume,
    stop,
    nextAyah,
    prevAyah,
    seekTo,
    changeReciter,
    isRepeatSurah,
    toggleRepeatSurah,
    sleepTimerEndsAt,
    sleepTimerMode,
    setSleepTimer,
    audioProgress,
    currentTime,
    duration,
    isLoading,
  } = useAudioContext();

  const [surahs, setSurahs] = useState<SurahOption[]>([]);
  const [surahError, setSurahError] = useState('');
  const [selectedSurahId, setSelectedSurahId] = useState(currentSurahId ?? 1);
  const [timerNow, setTimerNow] = useState(Date.now());
  const [sleepTimerOpen, setSleepTimerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchFallbackSurahs()
      .then(result => {
        if (active) setSurahs(result);
      })
      .catch(() => {
        if (active) setSurahError('Surahs could not be loaded. Check your connection and try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (currentSurahId) setSelectedSurahId(currentSurahId);
  }, [currentSurahId]);

  const selectedSurah = useMemo(
    () => surahs.find(surah => surah.id === selectedSurahId),
    [selectedSurahId, surahs]
  );
  const activeReciter = reciters.find(reciter => reciter.id === currentReciterId);
  const selectedIsCurrent = currentSurahId === selectedSurahId;
  const selectedIsPlaying = selectedIsCurrent && isPlaying;
  const displayedProgress = selectedIsCurrent ? audioProgress : 0;
  const displayedCurrentTime = selectedIsCurrent ? currentTime : 0;
  const displayedDuration = selectedIsCurrent ? duration : 0;

  const handlePlay = async () => {
    if (selectedIsPlaying) return pause();
    if (selectedIsCurrent) return resume();
    return playSurah(selectedSurahId, 1);
  };

  const handlePrevious = async () => {
    if (selectedIsCurrent) {
      await prevAyah();
    } else if (selectedSurahId > 1) {
      await playSurah(selectedSurahId - 1, 1);
    }
  };

  const handleNext = async () => {
    if (selectedIsCurrent) {
      await nextAyah();
    } else if (selectedSurahId < 114) {
      await playSurah(selectedSurahId + 1, 1);
    }
  };

  const handleStop = async () => {
    if (selectedIsCurrent) await stop();
  };

  useEffect(() => {
    if (!sleepTimerEndsAt) return undefined;

    const interval = setInterval(() => setTimerNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEndsAt]);

  const sleepTimerLabel = useMemo(() => {
    if (sleepTimerMode === 'endOfSurah') return 'Sleep timer: End of current Surah';
    if (!sleepTimerEndsAt) return null;

    const remainingSeconds = Math.max(0, Math.ceil((sleepTimerEndsAt - timerNow) / 1000));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `Sleep timer: ${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [sleepTimerEndsAt, sleepTimerMode, timerNow]);

  const chooseSleepTimer = (timer: number | 'endOfSurah' | null) => {
    setSleepTimer(timer);
    setSleepTimerOpen(false);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.bgSecondary }}
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}
    >
      <View style={styles.intro}>
        <Text selectable style={[styles.eyebrow, { color: colors.accent }]}>QURAN RECITATION</Text>
        <Text selectable style={[styles.pageTitle, { color: colors.textPrimary }]}>Listen and reflect</Text>
        <Text selectable style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Beautiful recitation with focused, uninterrupted playback.</Text>
      </View>

      <View style={[styles.playerCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.artwork, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
          <View style={[styles.artworkInner, { borderColor: colors.accent }]}>
            <BookOpen size={32} color={colors.accent} strokeWidth={1.7} />
            <Text selectable style={[styles.artworkArabic, { color: colors.accent }]}>
              {selectedSurah?.nameArabic ?? 'القرآن'}
            </Text>
          </View>
        </View>

        <Text selectable style={[styles.trackTitle, { color: colors.textPrimary }]}>
          {selectedSurah?.nameEnglish ?? `Surah ${selectedSurahId}`}
        </Text>
        <Text selectable style={[styles.trackMeta, { color: colors.textSecondary }]}>
          {activeReciter?.nameEnglish ?? 'Quran Reciter'}
          {selectedIsCurrent && currentAyahNumber ? ` · Ayah ${currentAyahNumber}` : ''}
        </Text>

        <View style={styles.progressSection}>
          <TrackSlider
            value={displayedProgress}
            accessibilityLabel="Recitation progress"
            trackColor={colors.bgTertiary}
            fillColor={colors.accent}
            onChange={value => {
              if (selectedIsCurrent) void seekTo(value);
            }}
          />
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>{formatTime(displayedCurrentTime)}</Text>
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>-{formatTime(Math.max(0, displayedDuration - displayedCurrentTime))}</Text>
          </View>
        </View>

        <View style={[styles.transportRow, compact && styles.transportRowCompact]}>
          <TouchableOpacity
            accessibilityLabel="Repeat Surah"
            onPress={() => toggleRepeatSurah()}
            style={[styles.utilityCircle, { backgroundColor: isRepeatSurah ? colors.accentLight : colors.bgTertiary }]}
          >
            <Repeat2 size={18} color={isRepeatSurah ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Previous Ayah" onPress={() => void handlePrevious()} style={styles.transportButton}>
            <SkipBack size={23} color={selectedIsCurrent ? colors.textPrimary : colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={selectedIsPlaying ? 'Pause recitation' : 'Play recitation'}
            disabled={isLoading}
            onPress={handlePlay}
            style={[styles.playButton, { backgroundColor: colors.accent }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : selectedIsPlaying ? (
              <Pause size={27} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={27} color="#FFFFFF" fill="#FFFFFF" style={styles.playIcon} />
            )}
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Next Ayah" onPress={() => void handleNext()} style={styles.transportButton}>
            <SkipForward size={23} color={selectedIsCurrent ? colors.textPrimary : colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Stop recitation" disabled={!selectedIsCurrent} onPress={() => void handleStop()} style={[styles.utilityCircle, { backgroundColor: colors.bgTertiary }]}>
            <Square size={16} color={selectedIsCurrent ? colors.textSecondary : colors.textTertiary} fill={selectedIsCurrent ? colors.textSecondary : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Sleep Timer"
            onPress={() => setSleepTimerOpen(true)}
            style={[styles.utilityCircle, { backgroundColor: sleepTimerMode ? colors.accentLight : colors.bgTertiary }]}
          >
            <Clock3 size={17} color={sleepTimerMode ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {sleepTimerLabel ? (
          <TouchableOpacity onPress={() => setSleepTimerOpen(true)} style={styles.sleepTimerStatus}>
            <Text style={[styles.sleepTimerText, { color: colors.textSecondary }]}>{sleepTimerLabel}</Text>
            <Text style={[styles.sleepTimerAction, { color: colors.accent }]}>Change</Text>
          </TouchableOpacity>
        ) : null}

      </View>

      <Modal
        transparent
        visible={sleepTimerOpen}
        animationType="fade"
        onRequestClose={() => setSleepTimerOpen(false)}
      >
        <Pressable style={styles.timerOverlay} onPress={() => setSleepTimerOpen(false)}>
          <Pressable style={[styles.timerSheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.timerTitle, { color: colors.textPrimary }]}>Sleep Timer</Text>
            <Text style={[styles.timerSubtitle, { color: colors.textSecondary }]}>Stop recitation automatically after:</Text>
            {[
              { label: '5 minutes', value: 5 },
              { label: '10 minutes', value: 10 },
              { label: '15 minutes', value: 15 },
              { label: '30 minutes', value: 30 },
              { label: '45 minutes', value: 45 },
            ].map(option => (
              <TouchableOpacity
                key={option.label}
                onPress={() => chooseSleepTimer(option.value)}
                style={[styles.timerOption, { borderColor: colors.border }]}
              >
                <Text style={[styles.timerOptionText, { color: colors.textPrimary }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => chooseSleepTimer('endOfSurah')}
              style={[styles.timerOption, { borderColor: colors.border }]}
            >
              <Text style={[styles.timerOptionText, { color: colors.textPrimary }]}>End of current Surah</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => chooseSleepTimer(null)}
              style={[styles.timerOption, { borderColor: colors.border }]}
            >
              <Text style={[styles.timerOptionText, { color: colors.accent }]}>Cancel timer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.sectionHeader}>
        <View>
          <Text selectable style={[styles.sectionEyebrow, { color: colors.accent }]}>114 SURAHS</Text>
          <Text selectable style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose a Surah</Text>
        </View>
      </View>

      {surahError ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text selectable style={[styles.emptyText, { color: colors.textSecondary }]}>{surahError}</Text>
        </View>
      ) : surahs.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={styles.surahLoader} />
      ) : (
        <FlatList
          horizontal
          data={surahs}
          keyExtractor={item => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.surahList}
          renderItem={({ item }) => {
            const selected = item.id === selectedSurahId;
            return (
              <TouchableOpacity
                onPress={() => setSelectedSurahId(item.id)}
                style={[
                  styles.surahCard,
                  {
                    backgroundColor: selected ? colors.accent : colors.bgCard,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.surahNumber, { color: selected ? '#FFFFFF' : colors.accent }]}>{item.id}</Text>
                <Text selectable numberOfLines={1} style={[styles.surahName, { color: selected ? '#FFFFFF' : colors.textPrimary }]}>{item.nameEnglish}</Text>
                <Text selectable style={[styles.surahArabic, { color: selected ? '#FFFFFF' : colors.textSecondary }]}>{item.nameArabic}</Text>
                <Text style={[styles.surahMeta, { color: selected ? '#FFFFFF' : colors.textTertiary }]}>{item.ayahCount} Ayahs</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text selectable style={[styles.sectionEyebrow, { color: colors.accent }]}>VOICE</Text>
          <Text selectable style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose a Reciter</Text>
        </View>
      </View>

      <View style={styles.reciterList}>
        {reciters.map(reciter => {
          const selected = reciter.id === currentReciterId;
          return (
            <TouchableOpacity
              key={reciter.id}
              onPress={() => void changeReciter(reciter.id)}
              style={[styles.reciterCard, { backgroundColor: colors.bgCard, borderColor: selected ? colors.accent : colors.border }]}
            >
              <View style={[styles.reciterAvatar, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.reciterInitial, { color: colors.accent }]}>{reciter.nameEnglish.slice(0, 1)}</Text>
              </View>
              <View style={styles.reciterInfo}>
                <Text selectable style={[styles.reciterName, { color: colors.textPrimary }]}>{reciter.nameEnglish}</Text>
                <Text selectable style={[styles.reciterStyle, { color: colors.textSecondary }]}>{reciter.style}</Text>
              </View>
              {selected ? <Check size={18} color={colors.accent} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130, gap: 16 },
  contentCompact: { paddingHorizontal: 12 },
  intro: { gap: 4 },
  eyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  pageTitle: { fontSize: 26, lineHeight: 33, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 11, lineHeight: 17, maxWidth: 360 },
  playerCard: { borderWidth: 1, borderRadius: 24, padding: 20, alignItems: 'center', boxShadow: '0 6px 22px rgba(0,0,0,0.06)' },
  artwork: { width: 132, height: 132, borderRadius: 28, borderWidth: 1, padding: 10, alignItems: 'center', justifyContent: 'center' },
  artworkInner: { width: '100%', height: '100%', borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  artworkArabic: { fontFamily: 'Amiri_700Bold', fontSize: 22, lineHeight: 31 },
  trackTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  trackMeta: { fontSize: 11, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  progressSection: { width: '100%', marginTop: 18 },
  sliderTouchArea: { height: 24, justifyContent: 'center', width: '100%' },
  sliderTrack: { height: 4, borderRadius: 99, overflow: 'visible' },
  sliderFill: { height: '100%', borderRadius: 99 },
  sliderThumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, top: -4, marginLeft: -6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 9, fontWeight: '700', fontVariant: ['tabular-nums'] },
  transportRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 },
  transportRowCompact: { gap: 6 },
  utilityCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  transportButton: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', boxShadow: '0 7px 18px rgba(0,0,0,0.14)' },
  playIcon: { marginLeft: 3 },
  sleepTimerStatus: { minHeight: 32, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sleepTimerText: { fontSize: 10, fontWeight: '700' },
  sleepTimerAction: { fontSize: 10, fontWeight: '900' },
  timerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'center', padding: 24 },
  timerSheet: { width: '100%', maxWidth: 360, alignSelf: 'center', borderRadius: 22, borderWidth: 1, padding: 18, gap: 8 },
  timerTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  timerSubtitle: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  timerOption: { minHeight: 44, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  timerOptionText: { fontSize: 13, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 },
  sectionEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 3 },
  surahList: { gap: 10, paddingBottom: 2 },
  surahCard: { width: 134, minHeight: 132, borderWidth: 1, borderRadius: 18, padding: 13 },
  surahNumber: { fontSize: 9, fontWeight: '800' },
  surahName: { fontSize: 13, fontWeight: '800', marginTop: 10 },
  surahArabic: { fontFamily: 'Amiri_700Bold', fontSize: 18, lineHeight: 27, marginTop: 3 },
  surahMeta: { fontSize: 9, fontWeight: '600', marginTop: 'auto' },
  surahLoader: { paddingVertical: 35 },
  emptyCard: { minHeight: 100, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
  reciterList: { gap: 9 },
  reciterCard: { minHeight: 68, borderRadius: 17, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  reciterAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reciterInitial: { fontSize: 17, fontWeight: '800' },
  reciterInfo: { flex: 1 },
  reciterName: { fontSize: 13, fontWeight: '800' },
  reciterStyle: { fontSize: 10, marginTop: 3 },
});
