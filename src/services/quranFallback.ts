import { fetch } from 'expo/fetch';

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

export const fallbackReciter = {
  id: 1,
  nameArabic: 'مشاري راشد العفاسي',
  nameEnglish: 'Mishary Rashid Alafasy',
  style: 'Murattal',
  audioBaseUrl: QURAN_AUDIO_URL,
};

export const fetchFallbackSurahs = async () => {
  const response = await fetch(`${QURAN_API_URL}/surah`);
  if (!response.ok) throw new Error(`Unable to load Surahs (${response.status})`);

  const payload = await response.json() as { code: number; data: PublicSurah[] };
  if (payload.code !== 200 || !Array.isArray(payload.data) || payload.data.length !== 114) {
    throw new Error('The Surah data source returned an invalid response.');
  }

  return payload.data.map((surah) => ({
    id: surah.number,
    nameArabic: surah.name,
    nameEnglish: surah.englishName,
    nameMeaning: surah.englishNameTranslation,
    revelationType: surah.revelationType,
    ayahCount: surah.numberOfAyahs,
    orderRevealed: surah.number,
  }));
};

export const getFallbackSurahAudioUrl = (surahId: number) => {
  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
    throw new Error('Invalid Surah number.');
  }
  return `${QURAN_AUDIO_URL}/${surahId}.mp3`;
};
