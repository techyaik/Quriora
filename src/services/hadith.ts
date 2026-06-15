import AsyncStorage from '@react-native-async-storage/async-storage';

export type HadithCollectionId = 'bukhari';

export interface HadithChapter {
  id: number;
  english: string;
}

export type HadithTopic = HadithChapter;

export interface HadithMetadata {
  collectionId: HadithCollectionId;
  title: string;
  total: number;
  chapters: HadithChapter[];
}

export interface HadithRecord {
  id: number;
  text: string;
  reference: {
    book: number;
    hadith: number;
  };
}

const BUKHARI_URL =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari.min.json';
const HADITH_TOPICS_CACHE_KEY = 'quriora:hadith-topics:v1';

export const HADITH_COLLECTIONS = [
  {
    id: 'bukhari' as const,
    name: 'Sahih al Bukhari',
  },
] as const;

interface ParsedHadithPayload {
  metadata: HadithMetadata;
  hadiths: HadithRecord[];
}

interface RawHadithPayload {
  metadata: unknown;
  hadiths: unknown[];
}

let rawPayloadCache: RawHadithPayload | null = null;
let rawPayloadRequest: Promise<RawHadithPayload> | null = null;
let parsedPayloadCache: ParsedHadithPayload | null = null;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parsePayload = (payload: unknown): ParsedHadithPayload => {
  if (!isObject(payload) || !isObject(payload.metadata) || !Array.isArray(payload.hadiths)) {
    throw new Error('The Hadith API response is invalid.');
  }

  const { metadata } = payload;
  if (
    typeof metadata.name !== 'string' ||
    !isObject(metadata.sections) ||
    !isObject(metadata.section_details)
  ) {
    throw new Error('The Hadith API metadata is invalid.');
  }

  const chapters = Object.entries(metadata.sections)
    .flatMap(([id, name]) => {
      const chapterId = Number(id);
      return chapterId > 0 && typeof name === 'string' && name.length > 0
        ? [{ id: chapterId, english: name }]
        : [];
    })
    .sort((a, b) => a.id - b.id);

  const hadiths = payload.hadiths.map(item => {
    if (
      !isObject(item) ||
      typeof item.hadithnumber !== 'number' ||
      typeof item.text !== 'string' ||
      !isObject(item.reference) ||
      typeof item.reference.book !== 'number' ||
      typeof item.reference.hadith !== 'number'
    ) {
      throw new Error('A Hadith API record is invalid.');
    }

    return {
      id: item.hadithnumber,
      text: item.text,
      reference: {
        book: item.reference.book,
        hadith: item.reference.hadith,
      },
    };
  });

  return {
    metadata: {
      collectionId: 'bukhari',
      title: metadata.name,
      total: hadiths.length,
      chapters,
    },
    hadiths,
  };
};

const fetchRawPayload = async (_signal?: AbortSignal) => {
  if (rawPayloadCache) return rawPayloadCache;
  if (rawPayloadRequest) return rawPayloadRequest;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  rawPayloadRequest = fetch(BUKHARI_URL, { signal: controller.signal })
    .then(async response => {
      if (!response.ok) {
        throw new Error(`Failed to load hadiths: ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isObject(data) || !Array.isArray(data.hadiths)) {
        throw new Error('The Hadith API response is invalid.');
      }

      return { metadata: data.metadata, hadiths: data.hadiths };
    })
    .then(payload => {
      rawPayloadCache = payload;
      return payload;
    })
    .finally(() => {
      clearTimeout(timeout);
      rawPayloadRequest = null;
    });

  return rawPayloadRequest;
};

export async function getSahihBukhari() {
  const data = await fetchRawPayload();
  return data.hadiths ?? [];
}

const fetchParsedPayload = async (signal?: AbortSignal) => {
  if (parsedPayloadCache) return parsedPayloadCache;
  const payload = parsePayload(await fetchRawPayload(signal));
  parsedPayloadCache = payload;
  return payload;
};

export const fetchHadithMetadata = async (
  _collectionId: HadithCollectionId,
  signal?: AbortSignal
) => (await fetchParsedPayload(signal)).metadata;

export const fetchHadithChapter = async (
  _collectionId: HadithCollectionId,
  chapterId: number,
  signal?: AbortSignal
) => (await fetchParsedPayload(signal)).hadiths.filter(hadith => hadith.reference.book === chapterId);

const isHadithTopic = (value: unknown): value is HadithTopic =>
  isObject(value) &&
  typeof value.id === 'number' &&
  value.id > 0 &&
  typeof value.english === 'string' &&
  value.english.trim().length > 0;

export const getHadithTopics = async (signal?: AbortSignal): Promise<HadithTopic[]> => {
  try {
    const cached = await AsyncStorage.getItem(HADITH_TOPICS_CACHE_KEY);
    if (cached) {
      const parsed: unknown = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isHadithTopic)) {
        return parsed;
      }
    }
  } catch {
    // A malformed or unavailable cache should not block the network source.
  }

  const seen = new Set<string>();
  const topics = (await fetchParsedPayload(signal)).metadata.chapters.flatMap(topic => {
    const english = topic.english.replace(/\s+/g, ' ').trim();
    const key = english.toLocaleLowerCase();
    if (!english || seen.has(key)) return [];
    seen.add(key);
    return [{ ...topic, english }];
  });
  try {
    await AsyncStorage.setItem(HADITH_TOPICS_CACHE_KEY, JSON.stringify(topics));
  } catch {
    // Topic browsing remains available even when local persistence fails.
  }
  return topics;
};
