import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
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

  // Queue state for playing full surahs
  const [queue, setQueue] = useState<PlayQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackStatusRef = useRef<AVPlaybackStatus | null>(null);

  // Initialize Audio configurations
  useEffect(() => {
    const initAudio = async () => {
      try {
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
      }
    };
    initAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    playbackStatusRef.current = status;
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsLoading(status.isBuffering);
      if (status.durationMillis) {
        setAudioProgress(status.positionMillis / status.durationMillis);
      }
      
      if (status.didJustFinish) {
        handleAudioEnded();
      }
    } else {
      if (status.error) {
        console.error(`AVPlayer error: ${status.error}`);
      }
    }
  };

  const handleAudioEnded = () => {
    if (isRepeatAyah) {
      if (soundRef.current) {
        soundRef.current.replayAsync().catch(err => console.error(err));
      }
    } else {
      nextAyah();
    }
  };

  const playSoundUrl = async (url: string) => {
    setIsLoading(true);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
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
    } finally {
      setIsLoading(false);
    }
  };

  const playAyah = async (surahId: number, ayahNumber: number, reciterId?: number) => {
    const activeReciterId = reciterId || currentReciterId;
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/audio/${surahId}/${ayahNumber}?reciterId=${activeReciterId}`);
      if (res.data.success) {
        const { audioUrl, ayahId } = res.data.data;
        
        setQueue([{ ayahId, ayahNumber, audioUrl, timestamps: null }]);
        setQueueIndex(0);
        setCurrentSurahId(surahId);
        setCurrentAyahId(ayahId);
        setCurrentAyahNumber(ayahNumber);

        await playSoundUrl(audioUrl);
      }
    } catch (err) {
      console.error('Failed to play ayah:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playSurah = async (surahId: number, startAyahNumber: number = 1, reciterId?: number) => {
    const activeReciterId = reciterId || currentReciterId;
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/audio/surah/${surahId}?reciterId=${activeReciterId}`);
      if (res.data.success) {
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
      }
    } catch (err) {
      console.error('Failed to play surah:', err);
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
    }
  };

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
      changeReciter
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
