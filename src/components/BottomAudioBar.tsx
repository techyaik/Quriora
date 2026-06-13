import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioContext } from '../context/AudioContext';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, TAB_BAR_BASE_HEIGHT, AUDIO_BAR_HEIGHT } from '../styles/theme';
import { Play, Pause } from 'lucide-react-native';

interface BottomAudioBarProps {
  activeRouteName?: string;
}

export const BottomAudioBar: React.FC<BottomAudioBarProps> = ({ activeRouteName }) => {
  const { isPlaying, currentSurahId, currentAyahNumber, audioProgress, pause, resume, currentReciterId, reciters } = useAudioContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();

  if (currentSurahId === null || currentAyahNumber === null) return null;

  const activeReciter = reciters.find(r => r.id === currentReciterId);

  const handlePlayToggle = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  // Determine if active route is a tab screen
  const isTabScreen = activeRouteName
    ? ['Home', 'QuranStack', 'SurahList', 'Surah', 'Listen', 'Memorize', 'Explore'].includes(activeRouteName)
    : true; // Default to true on initial startup (auth home page is Home)

  const bottomPosition = isTabScreen ? TAB_BAR_BASE_HEIGHT + insets.bottom : 0;
  const barHeight = isTabScreen ? AUDIO_BAR_HEIGHT : AUDIO_BAR_HEIGHT + insets.bottom;
  const barPaddingBottom = isTabScreen ? 0 : insets.bottom;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          bottom: bottomPosition,
          height: barHeight,
          paddingBottom: barPaddingBottom
        }
      ]}
    >
      {/* Progress Bar Track */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${audioProgress * 100}%`, backgroundColor: colors.accent }]} />
      </View>

      <View style={styles.content}>
        {/* Track Details */}
        <View style={styles.details}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Surah {currentSurahId} · Ayah {currentAyahNumber}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {activeReciter?.nameEnglish || 'Reciter'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handlePlayToggle}
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
          >
            {isPlaying ? (
              <Pause size={14} color="#fff" />
            ) : (
              <Play size={14} color="#fff" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 99,
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
});
