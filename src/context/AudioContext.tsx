import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getErrorMessage } from '../services/api';
import {
  fallbackReciter,
  fetchFallbackSurahs,
  fetchQuranAyahAudio,
  fetchQuranSurahAudio,
  getFallbackSurahAudioUrl,
} from '../services/quranFallback';

export interface Reciter {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  style: string;
  audioBaseUrl: string;
}

export interface PlayQueueItem {
  ayahId: number;
  ayahNumber: number;
  audioUrl: string;
  timestamps: { startMs: number; endMs: number } | null;
}

interface AudioContextType {
  isPlaying: boolean;
  currentAyahId: number | null;
  currentAyahNumber: number | null;
  currentSurahId: number | null;
  currentReciterId: number;
  playbackSpeed: number;
  isRepeatAyah: boolean;
  isRepeatSurah: boolean;
  volume: number;
  audioProgress: number; // 0 to 1
  currentTime: number;
  duration: number;
  currentSurahName: string | null;
  isLoading: boolean;
  reciters: Reciter[];
  playAyah: (surahId: number, ayahNumber: number, reciterId?: number) => Promise<void>;
  playSurah: (surahId: number, startAyahNumber?: number, reciterId?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  nextAyah: () => Promise<void>;
  prevAyah: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleRepeatAyah: () => void;
  toggleRepeatSurah: () => void;
  changeReciter: (id: number) => Promise<void>;
  lastError?: string | null;
  clearError: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahId, setCurrentAyahId] = useState<number | null>(null);
  const [currentAyahNumber, setCurrentAyahNumber] = useState<number | null>(null);
  const [currentSurahId, setCurrentSurahId] = useState<number | null>(null);
  const [currentReciterId, setCurrentReciterId] = useState<number>(1);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.0);
  const [isRepeatAyah, setIsRepeatAyah] = useState(false);
  const [isRepeatSurah, setIsRepeatSurah] = useState(false);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [surahNames, setSurahNames] = useState<Record<number, string>>({});

  // Queue state for playing full surahs
  const [queue, setQueue] = useState<PlayQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const playerStatus = useAudioPlayerStatus(player);
  const isLoading = isPreparing || playerStatus.isBuffering;

  // Initialize Audio configurations
  useEffect(() => {
    const initAudio = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });

        const storedReciter = await AsyncStorage.getItem('nurquran-reciter-id');
        const storedSpeed = await AsyncStorage.getItem('nurquran-playback-speed');
        const storedVolume = await AsyncStorage.getItem('nurquran-volume');

        if (storedReciter) setCurrentReciterId(parseInt(storedReciter));
        if (storedSpeed) {
          const speed = parseFloat(storedSpeed);
          setPlaybackSpeedState(speed);
          player.playbackRate = speed;
        }
        if (storedVolume) {
          const storedLevel = parseFloat(storedVolume);
          setVolumeState(storedLevel);
          player.volume = storedLevel;
        }

        setReciters([fallbackReciter]);
      } catch (err) {
        setLastError(getErrorMessage(err, 'Unable to initialize audio.'));
      }

      fetchFallbackSurahs()
        .then(surahs => setSurahNames(Object.fromEntries(surahs.map(surah => [surah.id, surah.nameEnglish]))))
        .catch(() => undefined);
    };
    initAudio();

  }, []);

  useEffect(() => {
    setIsPlaying(playerStatus.playing);
    setAudioProgress(playerStatus.duration > 0 ? playerStatus.currentTime / playerStatus.duration : 0);
  }, [playerStatus.currentTime, playerStatus.duration, playerStatus.isBuffering, playerStatus.playing]);

  useEffect(() => {
    if (playerStatus.error) setLastError(playerStatus.error);
  }, [playerStatus.error]);

  const handleAudioEnded = () => {
    if (process.env.EXPO_OS === 'web') {
      setIsPlaying(false);
      return;
    }
    if (isRepeatAyah) {
      void player.seekTo(0).then(() => player.play()).catch(err => console.warn('Error replaying ayah:', err));
    } else {
      try {
        void nextAyah();
      } catch (e) {
        console.warn('Error advancing to next ayah:', e);
      }
    }
  };

  const playSoundUrl = async (url: string, surahId: number, ayahNumber: number, reciterId: number) => {
    setIsPreparing(true);
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid audio URL');
      }

      player.replace({ uri: url });
      player.playbackRate = playbackSpeed;
      player.shouldCorrectPitch = true;
      player.volume = volume;
      const reciter = reciters.find(item => item.id === reciterId);
      player.setActiveForLockScreen(true, {
        title: `${surahNames[surahId] ?? `Surah ${surahId}`} · Ayah ${ayahNumber}`,
        artist: reciter?.nameEnglish ?? 'Quriora',
        albumTitle: 'Quran Recitation',
      });
      player.play();
      setLastError(null);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Failed to create sound:', err);
      setIsPlaying(false);
      setQueue([]);
      setLastError(getErrorMessage(err, 'Unable to play this recitation.'));
    } finally {
      setIsPreparing(false);
    }
  };

  const playAyah = async (surahId: number, ayahNumber: number, reciterId?: number) => {
    const activeReciterId = reciterId || currentReciterId;
    setIsPreparing(true);
    try {
      const { audioUrl, ayahId } = await fetchQuranAyahAudio(surahId, ayahNumber);

      setQueue([{ ayahId, ayahNumber, audioUrl, timestamps: null }]);
      setQueueIndex(0);
      setCurrentSurahId(surahId);
      setCurrentAyahId(ayahId);
      setCurrentAyahNumber(ayahNumber);

      await playSoundUrl(audioUrl, surahId, ayahNumber, activeReciterId);
    } catch (err) {
      console.warn('Failed to play ayah:', err);
      setLastError(getErrorMessage(err, 'Unable to load ayah audio.'));
    } finally {
      setIsPreparing(false);
    }
  };

  const playSurah = async (surahId: number, startAyahNumber: number = 1, reciterId?: number) => {
    const activeReciterId = reciterId || currentReciterId;
    setIsPreparing(true);
    try {
      if (process.env.EXPO_OS === 'web') {
        const audioUrl = getFallbackSurahAudioUrl(surahId);
        setQueue([{ ayahId: surahId, ayahNumber: startAyahNumber, audioUrl, timestamps: null }]);
        setQueueIndex(0);
        setCurrentSurahId(surahId);
        setCurrentAyahId(surahId);
        setCurrentAyahNumber(startAyahNumber);
        await playSoundUrl(audioUrl, surahId, startAyahNumber, activeReciterId);
        return;
      }

      const surahQueue = await fetchQuranSurahAudio(surahId);
      if (surahQueue.length > 0) {
        setQueue(surahQueue);
        setCurrentSurahId(surahId);

        const startIndex = surahQueue.findIndex(item => item.ayahNumber === startAyahNumber);
        const activeIndex = startIndex !== -1 ? startIndex : 0;
        setQueueIndex(activeIndex);

        const currentItem = surahQueue[activeIndex];
        setCurrentAyahId(currentItem.ayahId);
        setCurrentAyahNumber(currentItem.ayahNumber);

        await playSoundUrl(currentItem.audioUrl, surahId, currentItem.ayahNumber, activeReciterId);
      } else throw new Error('Surah audio is unavailable.');
    } catch (err) {
      try {
        const audioUrl = getFallbackSurahAudioUrl(surahId);
        const fallbackQueue = [{
          ayahId: surahId,
          ayahNumber: startAyahNumber,
          audioUrl,
          timestamps: null,
        }];
        setQueue(fallbackQueue);
        setQueueIndex(0);
        setCurrentSurahId(surahId);
        setCurrentAyahId(surahId);
        setCurrentAyahNumber(startAyahNumber);
        await playSoundUrl(audioUrl, surahId, startAyahNumber, activeReciterId);
      } catch (fallbackError) {
        console.warn('Failed to play surah:', err, fallbackError);
        setLastError(getErrorMessage(err, 'Unable to load surah audio.'));
      }
    } finally {
      setIsPreparing(false);
    }
  };

  const pause = async () => {
    player.pause();
    setIsPlaying(false);
  };

  const resume = async () => {
    player.play();
    setIsPlaying(true);
  };

  const stop = async () => {
    player.pause();
    if (playerStatus.isLoaded) await player.seekTo(0);
    player.clearLockScreenControls();
    setQueue([]);
    setQueueIndex(-1);
    setCurrentAyahId(null);
    setCurrentAyahNumber(null);
    setCurrentSurahId(null);
    setAudioProgress(0);
    setIsPlaying(false);
  };

  const nextAyah = async () => {
    if (queue.length === 0 || queueIndex === -1) return;

    if (queueIndex + 1 < queue.length) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      const item = queue[nextIndex];
      setCurrentAyahId(item.ayahId);
      setCurrentAyahNumber(item.ayahNumber);

      await playSoundUrl(item.audioUrl, currentSurahId ?? 1, item.ayahNumber, currentReciterId);
    } else {
      if (isRepeatSurah && currentSurahId) {
        await playSurah(currentSurahId, 1);
      } else {
        await stop();
      }
    }
  };

  useEffect(() => {
    if (playerStatus.didJustFinish) {
      void handleAudioEnded();
    }
  }, [playerStatus.didJustFinish]);

  const prevAyah = async () => {
    if (queue.length === 0 || queueIndex === -1) return;

    if (queueIndex - 1 >= 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      const item = queue[prevIndex];
      setCurrentAyahId(item.ayahId);
      setCurrentAyahNumber(item.ayahNumber);

      await playSoundUrl(item.audioUrl, currentSurahId ?? 1, item.ayahNumber, currentReciterId);
    }
  };

  const seekTo = async (position: number) => {
    if (playerStatus.isLoaded && playerStatus.duration > 0) {
      await player.seekTo(position * playerStatus.duration);
      setAudioProgress(position);
    }
  };

  const setSpeed = async (speed: number) => {
    setPlaybackSpeedState(speed);
    try {
      await AsyncStorage.setItem('nurquran-playback-speed', speed.toString());
      player.playbackRate = speed;
      player.shouldCorrectPitch = true;
    } catch (e) {
      console.warn(e);
    }
  };

  const setVolume = async (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    try {
      await AsyncStorage.setItem('nurquran-volume', clamped.toString());
      player.volume = clamped;
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleRepeatAyah = () => setIsRepeatAyah(current => !current);
  const toggleRepeatSurah = () => setIsRepeatSurah(current => !current);

  const changeReciter = async (id: number) => {
    setCurrentReciterId(id);
    try {
      await AsyncStorage.setItem('nurquran-reciter-id', id.toString());
      if (isPlaying && currentSurahId && currentAyahNumber) {
        await playAyah(currentSurahId, currentAyahNumber, id);
      }
    } catch (e) {
      console.warn(e);
      setLastError(getErrorMessage(e, 'Unable to change reciter.'));
    }
  };

  const clearError = () => setLastError(null);

  return (
    <AudioContext.Provider value={{
      isPlaying,
      currentAyahId,
      currentAyahNumber,
      currentSurahId,
      currentReciterId,
      playbackSpeed,
      isRepeatAyah,
      isRepeatSurah,
      volume,
      audioProgress,
      currentTime: playerStatus.currentTime,
      duration: playerStatus.duration,
      currentSurahName: currentSurahId ? (surahNames[currentSurahId] ?? `Surah ${currentSurahId}`) : null,
      isLoading,
      reciters,
      playAyah,
      playSurah,
      pause,
      resume,
      stop,
      nextAyah,
      prevAyah,
      seekTo,
      setSpeed,
      setVolume,
      toggleRepeatAyah,
      toggleRepeatSurah,
      changeReciter,
      lastError,
      clearError
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};
