import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getErrorMessage } from '../services/api';
import {
  fallbackReciter,
  fetchFallbackSurahs,
  fetchQuranAyahAudio,
  fetchQuranFullSurahAudio,
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
  trackType?: 'ayah' | 'surah';
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
  loadingSurahId: number | null;
  loadingAyahNumber: number | null;
  sleepTimerEndsAt: number | null;
  reciters: Reciter[];
  playAyah: (surahId: number, ayahNumber: number, reciterId?: number) => Promise<void>;
  playSurah: (surahId: number, startAyahNumber?: number, reciterId?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  nextAyah: (source?: 'manual' | 'auto') => Promise<void>;
  prevAyah: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleRepeatAyah: () => void;
  toggleRepeatSurah: () => void;
  setSleepTimer: (minutes: number | null) => void;
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
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);

  const player = useAudioPlayer(null, { updateInterval: 250 });
  const playerStatus = useAudioPlayerStatus(player);
  const [loadingAyah, setLoadingAyah] = useState<{ surahId: number; ayahNumber: number } | null>(null);
  const isLoading = isPreparing || playerStatus.isBuffering;
  const loadingSurahId = loadingAyah?.surahId ?? (playerStatus.isBuffering ? currentSurahId : null);
  const loadingAyahNumber = loadingAyah?.ayahNumber ?? (playerStatus.isBuffering ? currentAyahNumber : null);
  const queueRef = useRef<PlayQueueItem[]>([]);
  const queueIndexRef = useRef(-1);
  const currentSurahIdRef = useRef<number | null>(null);
  const currentReciterIdRef = useRef(1);
  const playbackSpeedRef = useRef(1);
  const volumeRef = useRef(0.8);
  const isRepeatAyahRef = useRef(false);
  const isRepeatSurahRef = useRef(false);
  const recitersRef = useRef<Reciter[]>([]);
  const surahNamesRef = useRef<Record<number, string>>({});
  const finishHandledRef = useRef(false);
  const queueLoadingRef = useRef(false);
  const pendingAdvanceRef = useRef(false);
  const playbackTokenRef = useRef(0);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateQueue = (items: PlayQueueItem[]) => {
    queueRef.current = items;
  };

  const updateQueueIndex = (index: number) => {
    queueIndexRef.current = index;
  };

  const updateCurrentSurahId = (surahId: number | null) => {
    currentSurahIdRef.current = surahId;
    setCurrentSurahId(surahId);
  };

  const updateLoadingAyah = (value: { surahId: number; ayahNumber: number } | null) => {
    setLoadingAyah(value);
  };

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
    currentSurahIdRef.current = currentSurahId;
  }, [currentSurahId]);

  useEffect(() => {
    currentReciterIdRef.current = currentReciterId;
  }, [currentReciterId]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isRepeatAyahRef.current = isRepeatAyah;
  }, [isRepeatAyah]);

  useEffect(() => {
    isRepeatSurahRef.current = isRepeatSurah;
  }, [isRepeatSurah]);

  useEffect(() => {
    recitersRef.current = reciters;
  }, [reciters]);

  useEffect(() => {
    surahNamesRef.current = surahNames;
  }, [surahNames]);

  useEffect(() => {
    if (isPreparing && (playerStatus.playing || playerStatus.error || playerStatus.didJustFinish)) {
      setIsPreparing(false);
      updateLoadingAyah(null);
    }
  }, [isPreparing, playerStatus.didJustFinish, playerStatus.error, playerStatus.playing]);

  useEffect(() => {
    if (playerStatus.playing) {
      finishHandledRef.current = false;
    }
  }, [playerStatus.playing]);

  useEffect(() => {
    if (playerStatus.error) setLastError(playerStatus.error);
  }, [playerStatus.error]);

  const replayCurrentTrack = () => {
    void player.seekTo(0)
      .then(() => {
        setAudioProgress(0);
        player.play();
        setIsPlaying(true);
      })
      .catch(err => console.warn('Error replaying current track:', err));
  };

  const handleAudioEnded = () => {
    const activeQueue = queueRef.current;
    const activeIndex = queueIndexRef.current;
    const activeItem = activeIndex >= 0 ? activeQueue[activeIndex] : null;
    const isFullSurahTrack = activeQueue.length === 1 && activeItem?.trackType === 'surah';

    if (isRepeatAyahRef.current || (isRepeatSurahRef.current && isFullSurahTrack)) {
      replayCurrentTrack();
    } else {
      try {
        void nextAyah('auto');
      } catch (e) {
        console.warn('Error advancing to next ayah:', e);
      }
    }
  };

  const playSoundUrl = async (url: string, surahId: number, ayahNumber: number, reciterId: number) => {
    setIsPreparing(true);
    updateLoadingAyah({ surahId, ayahNumber });
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid audio URL');
      }

      finishHandledRef.current = false;
      player.replace({ uri: url });
      player.playbackRate = playbackSpeedRef.current;
      player.shouldCorrectPitch = true;
      player.volume = volumeRef.current;
      const reciter = recitersRef.current.find(item => item.id === reciterId);
      try {
        player.setActiveForLockScreen(true, {
          title: `${surahNamesRef.current[surahId] ?? `Surah ${surahId}`} · Ayah ${ayahNumber}`,
          artist: reciter?.nameEnglish ?? 'Quriora',
          albumTitle: 'Quran Recitation',
        });
      } catch (metadataError) {
        console.warn('Failed to update audio metadata:', metadataError);
      }
      player.play();
      setLastError(null);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Failed to create sound:', {
        surahId,
        ayahNumber,
        reciterId,
        url,
        error: err,
      });
      setIsPlaying(false);
      updateQueue([]);
      updateLoadingAyah(null);
      setLastError(getErrorMessage(err, 'Unable to play this recitation.'));
    } finally {
      setIsPreparing(false);
    }
  };

  const playAyah = async (surahId: number, ayahNumber: number, reciterId?: number) => {
    if (loadingSurahId === surahId && loadingAyahNumber === ayahNumber) return;

    const playbackToken = playbackTokenRef.current + 1;
    playbackTokenRef.current = playbackToken;
    queueLoadingRef.current = false;
    pendingAdvanceRef.current = false;
    const activeReciterId = reciterId || currentReciterId;
    setIsPreparing(true);
    updateLoadingAyah({ surahId, ayahNumber });
    try {
      const { audioUrl, ayahId } = await fetchQuranAyahAudio(surahId, ayahNumber);
      if (playbackToken !== playbackTokenRef.current) return;

      updateQueue([{ ayahId, ayahNumber, audioUrl, timestamps: null, trackType: 'ayah' }]);
      updateQueueIndex(0);
      updateCurrentSurahId(surahId);
      setCurrentAyahId(ayahId);
      setCurrentAyahNumber(ayahNumber);

      await playSoundUrl(audioUrl, surahId, ayahNumber, activeReciterId);
    } catch (err) {
      console.warn('Failed to play ayah:', err);
      setLastError(getErrorMessage(err, 'Unable to load ayah audio.'));
      updateLoadingAyah(null);
    } finally {
      setIsPreparing(false);
    }
  };

  const playSurah = async (surahId: number, startAyahNumber: number = 1, reciterId?: number) => {
    if (loadingSurahId === surahId && loadingAyahNumber === startAyahNumber) return;

    const playbackToken = playbackTokenRef.current + 1;
    playbackTokenRef.current = playbackToken;
    queueLoadingRef.current = true;
    pendingAdvanceRef.current = false;
    const activeReciterId = reciterId || currentReciterId;
    setIsPreparing(true);
    updateLoadingAyah({ surahId, ayahNumber: startAyahNumber });
    try {
      if (startAyahNumber === 1) {
        const fullSurahAudio = await fetchQuranFullSurahAudio(surahId);
        if (playbackToken !== playbackTokenRef.current) return;

        updateQueue([{ ...fullSurahAudio, trackType: 'surah' }]);
        updateQueueIndex(0);
        queueLoadingRef.current = false;
        updateCurrentSurahId(surahId);
        setCurrentAyahId(fullSurahAudio.ayahId);
        setCurrentAyahNumber(1);

        await playSoundUrl(fullSurahAudio.audioUrl, surahId, 1, activeReciterId);
        return;
      }

      const { audioUrl, ayahId } = await fetchQuranAyahAudio(surahId, startAyahNumber);
      if (playbackToken !== playbackTokenRef.current) return;

      updateQueue([{ ayahId, ayahNumber: startAyahNumber, audioUrl, timestamps: null, trackType: 'ayah' }]);
      updateQueueIndex(0);
      updateCurrentSurahId(surahId);
      setCurrentAyahId(ayahId);
      setCurrentAyahNumber(startAyahNumber);

      await playSoundUrl(audioUrl, surahId, startAyahNumber, activeReciterId);

      fetchQuranSurahAudio(surahId)
        .then(surahQueue => {
          if (playbackToken !== playbackTokenRef.current) return;
          if (surahQueue.length === 0) throw new Error('Surah audio is unavailable.');

          const startIndex = surahQueue.findIndex(item => item.ayahNumber === startAyahNumber);
          const activeIndex = startIndex !== -1 ? startIndex : 0;
          updateQueue(surahQueue.map(item => ({ ...item, trackType: 'ayah' })));
          updateQueueIndex(activeIndex);
          queueLoadingRef.current = false;

          if (pendingAdvanceRef.current) {
            pendingAdvanceRef.current = false;
            void nextAyah();
          }
        })
        .catch(err => {
          if (playbackToken !== playbackTokenRef.current) return;
          queueLoadingRef.current = false;
          setLastError(getErrorMessage(err, 'Unable to load the remaining Surah audio.'));
        });
    } catch (err) {
      try {
        const audioUrl = getFallbackSurahAudioUrl(surahId);
        const fallbackQueue = [{
          ayahId: surahId,
          ayahNumber: startAyahNumber,
          audioUrl,
          timestamps: null,
          trackType: startAyahNumber === 1 ? 'surah' as const : 'ayah' as const,
        }];
        updateQueue(fallbackQueue);
        updateQueueIndex(0);
        queueLoadingRef.current = false;
        updateCurrentSurahId(surahId);
        setCurrentAyahId(surahId);
        setCurrentAyahNumber(startAyahNumber);
        await playSoundUrl(audioUrl, surahId, startAyahNumber, activeReciterId);
      } catch (fallbackError) {
        console.warn('Failed to play surah:', {
          surahId,
          startAyahNumber,
          reciterId: activeReciterId,
          error: err,
          fallbackError,
        });
        setLastError(getErrorMessage(err, 'Unable to load surah audio.'));
        updateLoadingAyah(null);
        queueLoadingRef.current = false;
      }
    } finally {
      setIsPreparing(false);
    }
  };

  const pause = async () => {
    player.pause();
    updateLoadingAyah(null);
    setIsPreparing(false);
    setIsPlaying(false);
  };

  const resume = async () => {
    player.play();
    setIsPlaying(true);
  };

  const stop = async () => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimerEndsAt(null);
    player.pause();
    if (playerStatus.isLoaded) await player.seekTo(0);
    player.clearLockScreenControls();
    playbackTokenRef.current += 1;
    queueLoadingRef.current = false;
    pendingAdvanceRef.current = false;
    updateQueue([]);
    updateQueueIndex(-1);
    updateLoadingAyah(null);
    setCurrentAyahId(null);
    setCurrentAyahNumber(null);
    updateCurrentSurahId(null);
    setAudioProgress(0);
    setIsPreparing(false);
    setIsPlaying(false);
  };

  const setSleepTimer = (minutes: number | null) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (!minutes || minutes <= 0) {
      setSleepTimerEndsAt(null);
      return;
    }

    const endsAt = Date.now() + minutes * 60 * 1000;
    setSleepTimerEndsAt(endsAt);
    sleepTimerRef.current = setTimeout(() => {
      void stop();
      setSleepTimerEndsAt(null);
      sleepTimerRef.current = null;
    }, minutes * 60 * 1000);
  };

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, []);

  const nextAyah = async (source: 'manual' | 'auto' = 'manual') => {
    const activeQueue = queueRef.current;
    const activeIndex = queueIndexRef.current;
    if (activeQueue.length === 0 || activeIndex === -1) return;
    const currentSurah = currentSurahIdRef.current;
    const isFullSurahTrack = activeQueue.length === 1 && activeQueue[0]?.trackType === 'surah';

    if (activeIndex + 1 < activeQueue.length) {
      const nextIndex = activeIndex + 1;
      updateQueueIndex(nextIndex);
      const item = activeQueue[nextIndex];
      setCurrentAyahId(item.ayahId);
      setCurrentAyahNumber(item.ayahNumber);

      await playSoundUrl(item.audioUrl, currentSurahIdRef.current ?? 1, item.ayahNumber, currentReciterIdRef.current);
    } else {
      if (queueLoadingRef.current) {
        pendingAdvanceRef.current = true;
      } else if (source === 'auto' && isRepeatSurahRef.current && currentSurah) {
        await playSurah(currentSurah, 1);
      } else if (source === 'manual' && isFullSurahTrack && currentSurah && currentSurah < 114) {
        await playSurah(currentSurah + 1, 1);
      } else if (source === 'manual' && isFullSurahTrack) {
        return;
      } else {
        await stop();
      }
    }
  };

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', status => {
      if (status.didJustFinish && !finishHandledRef.current) {
        finishHandledRef.current = true;
        handleAudioEnded();
      }
    });

    return () => subscription.remove();
  }, [player]);

  const prevAyah = async () => {
    const activeQueue = queueRef.current;
    const activeIndex = queueIndexRef.current;
    if (activeQueue.length === 0 || activeIndex === -1) return;
    const currentSurah = currentSurahIdRef.current;
    const isFullSurahTrack = activeQueue.length === 1 && activeQueue[0]?.trackType === 'surah';

    if (activeIndex - 1 >= 0) {
      const prevIndex = activeIndex - 1;
      updateQueueIndex(prevIndex);
      const item = activeQueue[prevIndex];
      setCurrentAyahId(item.ayahId);
      setCurrentAyahNumber(item.ayahNumber);

      await playSoundUrl(item.audioUrl, currentSurahIdRef.current ?? 1, item.ayahNumber, currentReciterIdRef.current);
    } else if (isFullSurahTrack && currentSurah && currentSurah > 1) {
      await playSurah(currentSurah - 1, 1);
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
      loadingSurahId,
      loadingAyahNumber,
      sleepTimerEndsAt,
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
      setSleepTimer,
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
