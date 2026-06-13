import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus } from 'expo-av';

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
  isLoading: boolean;
  reciters: Reciter[];
  playAyah: (surahId: number, ayahNumber: number, reciterId?: number) => Promise<void>;
  playSurah: (surahId: number, startAyahNumber?: number, reciterId?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  // Queue state for playing full surahs
  const [queue, setQueue] = useState<PlayQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackStatusRef = useRef<AVPlaybackStatus | null>(null);

  // Initialize Audio configurations
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Ensure axios baseURL is set when AudioProvider mounts. AuthProvider
        // sets this in a useEffect as well but that can race with audio init
        // leading to failed API calls (requests to '/api/...'). Set a
        // sensible default here if not already configured.
        const manifest = Constants.expoConfig || (Constants as any).manifest;
        const hostUri = manifest?.hostUri;
        const getBaseUrl = () => {
          if (hostUri) {
            const ip = hostUri.split(':')[0];
            return `http://${ip}:3001`;
          }
          return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
        };

        if (!axios.defaults.baseURL) {
          axios.defaults.baseURL = getBaseUrl();
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const storedReciter = await AsyncStorage.getItem('nurquran-reciter-id');
        const storedSpeed = await AsyncStorage.getItem('nurquran-playback-speed');
        const storedVolume = await AsyncStorage.getItem('nurquran-volume');

        if (storedReciter) setCurrentReciterId(parseInt(storedReciter));
        if (storedSpeed) setPlaybackSpeedState(parseFloat(storedSpeed));
        if (storedVolume) setVolumeState(parseFloat(storedVolume));

        // Fetch reciters
        const res = await axios.get('/api/reciters');
        if (res.data.success) {
          setReciters(res.data.data);
        }
      } catch (err) {
        console.error('Error initializing AudioContext:', err);
        setLastError((err as any)?.message || String(err));
      }
    };
    initAudio();

    return () => {
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
        } catch (e) {
          console.error('Error unloading sound on cleanup:', e);
        }
      })();
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    playbackStatusRef.current = status;
    try {
      if ((status as any).isLoaded) {
        setIsPlaying((status as any).isPlaying);
        setIsLoading((status as any).isBuffering);
        if ((status as any).durationMillis) {
          setAudioProgress((status as any).positionMillis / (status as any).durationMillis);
        }

        if ((status as any).didJustFinish) {
          void handleAudioEnded();
        }
      } else {
        if ((status as any).error) {
          console.error(`AVPlayer error: ${(status as any).error}`);
          setLastError((status as any).error?.message || String((status as any).error));
        }
      }
    } catch (e) {
      console.error('Error processing playback status update:', e, status);
    }
  };

  const handleAudioEnded = () => {
    if (isRepeatAyah) {
      if (soundRef.current) {
        soundRef.current.replayAsync().catch(err => console.error('Error replaying ayah:', err));
      }
    } else {
      try {
        void nextAyah();
      } catch (e) {
        console.error('Error advancing to next ayah:', e);
      }
    }
  };

  const playSoundUrl = async (url: string) => {
    setIsLoading(true);
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid audio URL');
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, rate: playbackSpeed, volume: volume, shouldCorrectPitch: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to create sound:', err);
      setIsPlaying(false);
      setQueue([]);
      setLastError((err as any)?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const playAyah = async (surahId: number, ayahNumber: number, reciterId?: number) => {
    const activeReciterId = reciterId || currentReciterId;
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/audio/${surahId}/${ayahNumber}?reciterId=${activeReciterId}`);
      if (res.data && res.data.success) {
        const { audioUrl, ayahId } = res.data.data;

        setQueue([{ ayahId, ayahNumber, audioUrl, timestamps: null }]);
        setQueueIndex(0);
        setCurrentSurahId(surahId);
        setCurrentAyahId(ayahId);
        setCurrentAyahNumber(ayahNumber);

        await playSoundUrl(audioUrl);
      } else {
        console.error('playAyah: unexpected response', res?.data);
        setLastError('Unexpected API response while fetching ayah audio');
      }
    } catch (err) {
      console.error('Failed to play ayah:', err);
      setLastError((err as any)?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const playSurah = async (surahId: number, startAyahNumber: number = 1, reciterId?: number) => {
    const activeReciterId = reciterId || currentReciterId;
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/audio/surah/${surahId}?reciterId=${activeReciterId}`);
      if (res.data && res.data.success) {
        const { queue: surahQueue } = res.data.data;
        setQueue(surahQueue);
        setCurrentSurahId(surahId);

        const startIndex = surahQueue.findIndex((item: any) => item.ayahNumber === startAyahNumber);
        const activeIndex = startIndex !== -1 ? startIndex : 0;
        setQueueIndex(activeIndex);

        const currentItem = surahQueue[activeIndex];
        setCurrentAyahId(currentItem.ayahId);
        setCurrentAyahNumber(currentItem.ayahNumber);

        await playSoundUrl(currentItem.audioUrl);
      } else {
        console.error('playSurah: unexpected response', res?.data);
        setLastError('Unexpected API response while fetching surah audio');
      }
    } catch (err) {
      console.error('Failed to play surah:', err);
      setLastError((err as any)?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const pause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resume = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const nextAyah = async () => {
    if (queue.length === 0 || queueIndex === -1) return;

    if (queueIndex + 1 < queue.length) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      const item = queue[nextIndex];
      setCurrentAyahId(item.ayahId);
      setCurrentAyahNumber(item.ayahNumber);

      await playSoundUrl(item.audioUrl);
    } else {
      if (isRepeatSurah && currentSurahId) {
        await playSurah(currentSurahId, 1);
      } else {
        setIsPlaying(false);
        setCurrentAyahId(null);
        setCurrentAyahNumber(null);
      }
    }
  };

  const prevAyah = async () => {
    if (queue.length === 0 || queueIndex === -1) return;

    if (queueIndex - 1 >= 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      const item = queue[prevIndex];
      setCurrentAyahId(item.ayahId);
      setCurrentAyahNumber(item.ayahNumber);

      await playSoundUrl(item.audioUrl);
    }
  };

  const seekTo = async (position: number) => {
    const status = playbackStatusRef.current;
    if (soundRef.current && status && status.isLoaded && status.durationMillis) {
      await soundRef.current.setPositionAsync(position * status.durationMillis);
      setAudioProgress(position);
    }
  };

  const setSpeed = async (speed: number) => {
    setPlaybackSpeedState(speed);
    try {
      await AsyncStorage.setItem('nurquran-playback-speed', speed.toString());
      if (soundRef.current) {
        await soundRef.current.setRateAsync(speed, true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setVolume = async (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    try {
      await AsyncStorage.setItem('nurquran-volume', clamped.toString());
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(clamped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRepeatAyah = () => setIsRepeatAyah(!isRepeatAyah);
  const toggleRepeatSurah = () => setIsRepeatSurah(!isRepeatSurah);

  const changeReciter = async (id: number) => {
    setCurrentReciterId(id);
    try {
      await AsyncStorage.setItem('nurquran-reciter-id', id.toString());
      if (isPlaying && currentSurahId && currentAyahNumber) {
        await playAyah(currentSurahId, currentAyahNumber, id);
      }
    } catch (e) {
      console.error(e);
      setLastError((e as any)?.message || String(e));
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
      isLoading,
      reciters,
      playAyah,
      playSurah,
      pause,
      resume,
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
