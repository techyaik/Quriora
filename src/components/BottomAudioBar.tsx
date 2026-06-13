import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAudioContext } from '../context/AudioContext';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, AUDIO_BAR_HEIGHT } from '../styles/theme';
import { Play, Pause } from 'lucide-react-native';

interface BottomAudioBarProps {
  compact?: boolean;
}

export const BottomAudioBar: React.FC<BottomAudioBarProps> = ({
  compact = false,
}) => {
  const {
    isPlaying,
    currentSurahId,
    currentAyahNumber,
    audioProgress,
    pause,
    resume,
    currentReciterId,
    reciters,
    lastError,
  } = useAudioContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  if (currentSurahId === null || currentAyahNumber === null) return null;

  const activeReciter = reciters.find(r => r.id === currentReciterId);

  const handlePlayToggle = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          height: compact ? 44 : AUDIO_BAR_HEIGHT,
        }
      ]}
    >
      {/* Progress Bar Track */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${audioProgress * 100}%`, backgroundColor: colors.accent }]} />
      </View>

      <View style={[styles.content, compact && styles.compactContent]}>
        {lastError ? (
          <View style={styles.errorRow}>
            <Text numberOfLines={1} style={[styles.errorText, { color: colors.accent }]}>
              Audio error: {lastError}
            </Text>
          </View>
        ) : null}
        {/* Track Details */}
        {!compact ? <View style={styles.details}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Surah {currentSurahId} · Ayah {currentAyahNumber}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {activeReciter?.nameEnglish || 'Reciter'}
          </Text>
        </View> : null}

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            onPress={handlePlayToggle}
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
          >
            {isPlaying ? (
              <Pause size={14} color="#fff" />
            ) : (
              <Play size={14} color="#fff" style={{ marginLeft: 2 }} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  compactContent: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
