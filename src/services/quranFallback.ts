const QURAN_API_URL = 'https://api.alquran.cloud/v1';
const QURAN_AUDIO_URL = 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy';

interface PublicSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface PublicAyah {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  ruku: number;
  audio?: string;
  surah?: PublicSurah;
}

const requestQuran = async <T>(path: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await globalThis.fetch(`${QURAN_API_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Quran API request failed (${response.status})`);
    const payload = await response.json() as { code: number; data: T };
    if (payload.code !== 200 || payload.data == null) throw new Error('Invalid Quran API response.');
    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
};

const mapSurah = (surah: PublicSurah) => ({
  id: surah.number,
  nameArabic: surah.name,
  nameEnglish: surah.englishName,
  nameMeaning: surah.englishNameTranslation,
  revelationType: surah.revelationType,
  ayahCount: surah.numberOfAyahs,
  orderRevealed: surah.number,
});

export const fallbackReciter = {
  id: 1,
  nameArabic: 'مشاري راشد العفاسي',
  nameEnglish: 'Mishary Rashid Alafasy',
  style: 'Murattal',
  audioBaseUrl: QURAN_AUDIO_URL,
};

export const fetchFallbackSurahs = async () => {
  const surahs = await requestQuran<PublicSurah[]>('/surah');
  if (!Array.isArray(surahs) || surahs.length !== 114) throw new Error('Invalid Surah list.');
  return surahs.map(mapSurah);
};

export const fetchQuranSurah = async (surahId: number) => {
  const editions = await requestQuran<Array<PublicSurah & { ayahs: PublicAyah[] }>>(
    `/surah/${surahId}/editions/quran-uthmani,en.sahih`
  );
  const arabic = editions[0];
  const english = editions[1];
  if (!arabic?.ayahs || !english?.ayahs) throw new Error('Invalid Surah response.');

  return {
    ...mapSurah(arabic),
    ayahs: arabic.ayahs.map((ayah, index) => ({
      id: ayah.number,
      ayahNumber: ayah.numberInSurah,
      textUthmani: ayah.text.replace(/^\uFEFF/, ''),
      textSimple: ayah.text.replace(/^\uFEFF/, ''),
      juzNumber: ayah.juz,
      pageNumber: ayah.page,
      rukuNumber: ayah.ruku,
      translations: [{
        id: ayah.number,
        language: 'en',
        translator: 'Saheeh International',
        text: english.ayahs[index]?.text ?? '',
      }],
    })),
  };
};

export const fetchQuranAyah = async (ayahId: number) => {
  const editions = await requestQuran<PublicAyah[]>(`/ayah/${ayahId}/editions/quran-uthmani,en.sahih`);
  const arabic = editions[0];
  const english = editions[1];
  if (!arabic?.surah) throw new Error('Invalid Ayah response.');

  return {
    id: arabic.number,
    ayahNumber: arabic.numberInSurah,
    surahId: arabic.surah.number,
    textUthmani: arabic.text.replace(/^\uFEFF/, ''),
    textSimple: arabic.text.replace(/^\uFEFF/, ''),
    juzNumber: arabic.juz,
    pageNumber: arabic.page,
    rukuNumber: arabic.ruku,
    surah: { nameEnglish: arabic.surah.englishName, nameArabic: arabic.surah.name },
    translations: [{ language: 'en', translator: 'Saheeh International', text: english?.text ?? '' }],
  };
};

const searchEdition: Record<string, string> = {
  ar: 'quran-simple',
  en: 'en.sahih',
  ur: 'ur.jalandhry',
};

export const searchQuran = async (query: string, language = 'en', surah?: number | '') => {
  const edition = searchEdition[language] ?? 'en.sahih';
  const data = await requestQuran<{ matches: Array<PublicAyah & { edition: { language: string } }> }>(
    `/search/${encodeURIComponent(query)}/${surah || 'all'}/${edition}`
  );

  return data.matches.map((match) => ({
    id: match.number,
    ayahNumber: match.numberInSurah,
    surahId: match.surah?.number ?? 0,
    textUthmani: match.text,
    textSimple: match.text,
    translations: [{ language: match.edition.language, text: match.text }],
    surah: {
      nameEnglish: match.surah?.englishName ?? '',
      nameArabic: match.surah?.name ?? '',
    },
  }));
};

export const fetchQuranCommentary = async (ayahId: number) => {
  const ayah = await requestQuran<PublicAyah & { edition: { englishName: string } }>(`/ayah/${ayahId}/en.asad`);
  return { id: ayah.number, ayahId, source: ayah.edition.englishName, language: 'en', text: ayah.text };
};

export const fetchQuranAyahAudio = async (surahId: number, ayahNumber: number) => {
  const ayah = await requestQuran<PublicAyah>(`/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
  if (!ayah.audio) throw new Error('Ayah audio is unavailable.');
  return { ayahId: ayah.number, audioUrl: ayah.audio };
};

export const fetchQuranSurahAudio = async (surahId: number) => {
  const surah = await requestQuran<PublicSurah & { ayahs: PublicAyah[] }>(`/surah/${surahId}/ar.alafasy`);
  return surah.ayahs.map((ayah) => ({
    ayahId: ayah.number,
    ayahNumber: ayah.numberInSurah,
    audioUrl: ayah.audio ?? '',
    timestamps: null,
  })).filter((ayah) => ayah.audioUrl);
};

export const getFallbackSurahAudioUrl = (surahId: number) => `${QURAN_AUDIO_URL}/${surahId}.mp3`;
