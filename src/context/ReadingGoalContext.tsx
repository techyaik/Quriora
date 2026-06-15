import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ReadingGoalType = 'verses' | 'pages' | 'chapters' | 'duration';

export interface ReadingGoal {
  type: ReadingGoalType;
  target: number;
}

interface PersistedReadingState {
  date: string;
  goal: ReadingGoal;
  verseKeys: string[];
  pageKeys: number[];
  surahVerses: Record<string, number[]>;
  completedSurahs: number[];
  durationSeconds: number;
  streak: number;
  lastCompletedDate: string | null;
  lastSurahId: number | null;
  lastAyahNumber: number | null;
}

interface ReadingGoalContextValue {
  goal: ReadingGoal;
  progress: number;
  progressPercent: number;
  streak: number;
  lastSurahId: number | null;
  lastAyahNumber: number | null;
  hydrated: boolean;
  setGoal: (goal: ReadingGoal) => void;
  markAyahRead: (surahId: number, ayahNumber: number, pageNumber: number, totalAyahs: number) => void;
  addReadingSeconds: (seconds: number) => void;
}

const STORAGE_KEY = 'quriora:daily-reading-goal:v1';
const DEFAULT_GOAL: ReadingGoal = { type: 'verses', target: 5 };

const dateKey = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayKey = () => dateKey();

const emptyState = (): PersistedReadingState => ({
  date: todayKey(),
  goal: DEFAULT_GOAL,
  verseKeys: [],
  pageKeys: [],
  surahVerses: {},
  completedSurahs: [],
  durationSeconds: 0,
  streak: 0,
  lastCompletedDate: null,
  lastSurahId: null,
  lastAyahNumber: null,
});

const previousDateKey = (date: string) => {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() - 1);
  return dateKey(value);
};

const getProgress = (state: PersistedReadingState) => {
  switch (state.goal.type) {
    case 'pages':
      return state.pageKeys.length;
    case 'chapters':
      return state.completedSurahs.length;
    case 'duration':
      return state.durationSeconds / 60;
    default:
      return state.verseKeys.length;
  }
};

const applyCompletion = (state: PersistedReadingState): PersistedReadingState => {
  const date = todayKey();
  if (getProgress(state) < state.goal.target || state.lastCompletedDate === date) return state;
  const continued = state.lastCompletedDate === previousDateKey(date);
  return {
    ...state,
    streak: continued ? state.streak + 1 : 1,
    lastCompletedDate: date,
  };
};

const normalizeStoredState = (value: unknown): PersistedReadingState => {
  const fallback = emptyState();
  if (!value || typeof value !== 'object') return fallback;
  const stored = value as Partial<PersistedReadingState>;
  const validType = ['verses', 'pages', 'chapters', 'duration'].includes(stored.goal?.type ?? '');
  const goal = validType && Number(stored.goal?.target) > 0
    ? { type: stored.goal!.type, target: Math.round(Number(stored.goal!.target)) }
    : DEFAULT_GOAL;

  if (stored.date !== todayKey()) {
    const lastCompletedDate = typeof stored.lastCompletedDate === 'string' ? stored.lastCompletedDate : null;
    const activeStreak = lastCompletedDate === previousDateKey(todayKey()) ? Number(stored.streak) || 0 : 0;
    return {
      ...fallback,
      goal,
      streak: activeStreak,
      lastCompletedDate,
      lastSurahId: Number(stored.lastSurahId) || null,
      lastAyahNumber: Number(stored.lastAyahNumber) || null,
    };
  }

  return {
    ...fallback,
    ...stored,
    date: todayKey(),
    goal,
    verseKeys: Array.isArray(stored.verseKeys) ? stored.verseKeys.filter(item => typeof item === 'string') : [],
    pageKeys: Array.isArray(stored.pageKeys) ? stored.pageKeys.filter(Number.isFinite) : [],
    surahVerses: stored.surahVerses && typeof stored.surahVerses === 'object' ? stored.surahVerses : {},
    completedSurahs: Array.isArray(stored.completedSurahs)
      ? stored.completedSurahs.filter(Number.isFinite)
      : [],
    durationSeconds: Math.max(0, Number(stored.durationSeconds) || 0),
  };
};

const ReadingGoalContext = createContext<ReadingGoalContextValue | null>(null);

export const ReadingGoalProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PersistedReadingState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => setState(normalizeStoredState(value ? JSON.parse(value) : null)))
      .catch(() => setState(emptyState()))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
    }, 250);
    return () => clearTimeout(timer);
  }, [hydrated, state]);

  const setGoal = useCallback((goal: ReadingGoal) => {
    setState(current => applyCompletion({
      ...current,
      goal: {
        type: goal.type,
        target: Math.max(1, Math.round(goal.target)),
      },
    }));
  }, []);

  const markAyahRead = useCallback(
    (surahId: number, ayahNumber: number, pageNumber: number, totalAyahs: number) => {
      if (![surahId, ayahNumber, pageNumber, totalAyahs].every(Number.isFinite)) return;
      setState(current => {
        const verseKey = `${surahId}:${ayahNumber}`;
        const verseKeys = current.verseKeys.includes(verseKey)
          ? current.verseKeys
          : [...current.verseKeys, verseKey];
        const pageKeys = current.pageKeys.includes(pageNumber)
          ? current.pageKeys
          : [...current.pageKeys, pageNumber];
        const existing = current.surahVerses[String(surahId)] ?? [];
        const readVerses = existing.includes(ayahNumber) ? existing : [...existing, ayahNumber];
        const completedSurahs = readVerses.length >= totalAyahs && !current.completedSurahs.includes(surahId)
          ? [...current.completedSurahs, surahId]
          : current.completedSurahs;

        return applyCompletion({
          ...current,
          verseKeys,
          pageKeys,
          surahVerses: { ...current.surahVerses, [String(surahId)]: readVerses },
          completedSurahs,
          lastSurahId: surahId,
          lastAyahNumber: ayahNumber,
        });
      });
    },
    []
  );

  const addReadingSeconds = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setState(current => applyCompletion({
      ...current,
      durationSeconds: current.durationSeconds + seconds,
    }));
  }, []);

  const progress = getProgress(state);
  const value = useMemo<ReadingGoalContextValue>(() => ({
    goal: state.goal,
    progress,
    progressPercent: state.goal.target > 0 ? Math.min(100, Math.round((progress / state.goal.target) * 100)) : 0,
    streak: state.streak,
    lastSurahId: state.lastSurahId,
    lastAyahNumber: state.lastAyahNumber,
    hydrated,
    setGoal,
    markAyahRead,
    addReadingSeconds,
  }), [addReadingSeconds, hydrated, markAyahRead, progress, setGoal, state]);

  return <ReadingGoalContext.Provider value={value}>{children}</ReadingGoalContext.Provider>;
};

export const useReadingGoal = () => {
  const context = useContext(ReadingGoalContext);
  if (!context) throw new Error('useReadingGoal must be used within ReadingGoalProvider');
  return context;
};
