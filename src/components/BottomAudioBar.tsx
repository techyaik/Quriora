import { useRouter } from 'expo-router';
import { BookOpen, Pause, Play, SkipBack, SkipForward } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAudioContext } from '../context/AudioContext';
import { useThemeContext } from '../context/ThemeContext';
import { AUDIO_BAR_HEIGHT, themeColors } from '../styles/theme';

interface BottomAudioBarProps {
  compact?: boolean;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

export const BottomAudioBar = ({ compact = false }: BottomAudioBarProps) => {
  const router = useRouter();
  const {
    isPlaying,
    currentSurahId,
    currentSurahName,
    currentAyahNumber,
    currentTime,
    duration,
    audioProgress,
    pause,
    resume,
    nextAyah,
    prevAyah,
    currentReciterId,
    reciters,
    isLoading,
  } = useAudioContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  if (currentSurahId === null || currentAyahNumber === null) return null;
  const activeReciter = reciters.find(reciter => reciter.id === currentReciterId);

  return (
    <View
      style={[
        styles.container,
        {
          height: compact ? 44 : AUDIO_BAR_HEIGHT,
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.progressTrack, { backgroundColor: colors.bgTertiary }]}>
        <View style={[styles.progressFill, { width: `${audioProgress * 100}%`, backgroundColor: colors.accent }]} />
      </View>

      <View style={[styles.content, compact && styles.compactContent]}>
        {!compact ? (
          <TouchableOpacity
            accessibilityLabel="Open audio player"
            activeOpacity={0.76}
            onPress={() => router.navigate('/listen')}
            style={styles.trackArea}
          >
            <View style={[styles.artwork, { backgroundColor: colors.accentLight }]}>
              <BookOpen size={18} color={colors.accent} />
            </View>
            <View style={styles.details}>
              <Text selectable numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
                {currentSurahName ?? `Surah ${currentSurahId}`} · Ayah {currentAyahNumber}
              </Text>
              <Text selectable numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
                {activeReciter?.nameEnglish ?? 'Quran Reciter'} · {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.controls}>
          {!compact ? (
            <Pressable accessibilityLabel="Previous Ayah" onPress={prevAyah} style={styles.skipButton}>
              <SkipBack size={17} color={colors.textSecondary} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            disabled={isLoading}
            onPress={() => void (isPlaying ? pause() : resume())}
            style={[styles.playButton, { backgroundColor: colors.accent }]}
          >
            {isPlaying ? (
              <Pause size={15} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={15} color="#FFFFFF" fill="#FFFFFF" style={styles.playIcon} />
            )}
          </Pressable>
          {!compact ? (
            <Pressable accessibilityLabel="Next Ayah" onPress={() => void nextAyah()} style={styles.skipButton}>
              <SkipForward size={17} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', borderTopWidth: 1, boxShadow: '0 -5px 18px rgba(0,0,0,0.08)' },
  progressTrack: { height: 3, width: '100%' },
  progressFill: { height: '100%' },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  compactContent: { justifyContent: 'center', paddingHorizontal: 6 },
  trackArea: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  artwork: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, minWidth: 0 },
  title: { fontSize: 11, lineHeight: 16, fontWeight: '800' },
  subtitle: { fontSize: 9, lineHeight: 14, fontWeight: '500', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  skipButton: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  playIcon: { marginLeft: 2 },
});
