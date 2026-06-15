import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useThemeContext } from '../context/ThemeContext';
import { formatTajweed } from '../utils/tajweed';
import { themeColors } from '../styles/theme';
import { Play, Pause, Bookmark, BookOpen, Copy, Share2 } from 'lucide-react-native';

interface TranslationItem { id: number; language: string; translator: string; text: string; }
interface AyahItem {
  id: number; ayahNumber: number; textUthmani: string; textSimple: string;
  juzNumber: number; pageNumber: number; rukuNumber: number; translations: TranslationItem[];
}
interface AyahCardProps {
  ayah: AyahItem; surahId: number; surahNameEnglish: string;
  isPlaying: boolean; isBookmarked: boolean;
  onPlay: (ayahNumber: number) => void;
  onBookmark: (ayahId: number) => void;
  onOpenTafseer: (ayahId: number, ayahNumber: number) => void;
}

const toArabicDigits = (num: number) =>
  num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);

export const AyahCard = React.memo(({
  ayah, surahId, surahNameEnglish, isPlaying, isBookmarked,
  onPlay, onBookmark, onOpenTafseer
}: AyahCardProps) => {
  const { fontSize, showTajweed, showTranslation, theme } = useThemeContext();
  const colors = themeColors[theme];
  const [copied, setCopied] = useState(false);

  const enTrans = ayah.translations.find(t => t.language === 'en')?.text || '';
  const urTrans = ayah.translations.find(t => t.language === 'ur')?.text || '';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`${ayah.textUthmani}\n\n[${surahNameEnglish} ${surahId}:${ayah.ayahNumber}] — ${enTrans}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${ayah.textUthmani}\n\n[${surahNameEnglish} ${surahId}:${ayah.ayahNumber}] — ${enTrans}`,
      });
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: isPlaying ? colors.accent : colors.border,
          borderWidth: isPlaying ? 1.5 : 1,
        },
        isPlaying && styles.playingShadow
      ]}
    >
      {/* ── Metadata row ─────────────────────────────────── */}
      <View style={styles.metadataRow}>
        <View style={styles.badgeContainer}>
          <Text style={[styles.badgeText, { color: colors.accent, backgroundColor: colors.accentLight }]}>
            {surahId}:{ayah.ayahNumber}
          </Text>
          <Text style={[styles.metadataText, { color: colors.textTertiary }]}>
            Juz {ayah.juzNumber} · Page {ayah.pageNumber}
          </Text>
        </View>
        
        {isPlaying && (
          <View style={styles.waveContainer}>
            <Text style={{ color: colors.accent, fontSize: 10, fontWeight: 'bold' }}>PLAYING</Text>
          </View>
        )}
      </View>

      {/* ── Arabic Text ──────────────────────────────────── */}
      <View style={styles.arabicContainer}>
        <Text style={[styles.arabicText, { fontSize: fontSize, color: isPlaying ? colors.accent : colors.textPrimary }]}>
          {showTajweed ? formatTajweed(ayah.textUthmani, styles.arabicText) : ayah.textUthmani}
          <Text style={[styles.medallion, { color: colors.gold }]}>
            {' '}{toArabicDigits(ayah.ayahNumber)}{' '}
          </Text>
        </Text>
      </View>

      {/* ── Translation ──────────────────────────────────── */}
      {showTranslation && (enTrans || urTrans) && (
        <View style={[styles.translationContainer, { borderTopColor: colors.border }]}>
          {enTrans ? (
            <Text style={[styles.enText, { color: colors.textSecondary }]}>
              {enTrans}
            </Text>
          ) : null}
          {urTrans ? (
            <Text style={[styles.urText, { color: colors.textTertiary }]}>
              {urTrans}
            </Text>
          ) : null}
        </View>
      )}

      {/* ── Action Bar ───────────────────────────────────── */}
      <View style={[styles.actionBar, { borderTopColor: colors.border }]}>
        {/* Play */}
        <TouchableOpacity
          onPress={() => onPlay(ayah.ayahNumber)}
          style={[
            styles.actionBtn,
            {
              backgroundColor: isPlaying ? colors.accent : 'transparent',
              borderColor: isPlaying ? colors.accent : colors.border,
            }
          ]}
        >
          {isPlaying ? (
            <Pause size={14} color="#fff" />
          ) : (
            <Play size={14} color={colors.textSecondary} />
          )}
          <Text style={[styles.actionLabel, { color: isPlaying ? '#fff' : colors.textSecondary }]}>
            {isPlaying ? 'Playing' : 'Play'}
          </Text>
        </TouchableOpacity>

        {/* Bookmark */}
        <TouchableOpacity
          onPress={() => onBookmark(ayah.id)}
          style={[
            styles.actionBtn,
            {
              backgroundColor: isBookmarked ? `${colors.gold}18` : 'transparent',
              borderColor: colors.border,
            }
          ]}
        >
          <Bookmark size={14} color={isBookmarked ? colors.gold : colors.textTertiary} fill={isBookmarked ? colors.gold : 'none'} />
          <Text style={[styles.actionLabel, { color: isBookmarked ? colors.gold : colors.textSecondary }]}>
            {isBookmarked ? 'Saved' : 'Bookmark'}
          </Text>
        </TouchableOpacity>

        {/* Tafseer */}
        <TouchableOpacity
          onPress={() => onOpenTafseer(ayah.id, ayah.ayahNumber)}
          style={[styles.actionBtn, { borderColor: colors.border }]}
        >
          <BookOpen size={14} color={colors.textTertiary} />
          <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Tafseer</Text>
        </TouchableOpacity>

        {/* Copy */}
        <TouchableOpacity
          onPress={handleCopy}
          style={[styles.actionBtn, { borderColor: colors.border }]}
        >
          <Copy size={14} color={colors.textTertiary} />
          <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.actionBtn, { borderColor: colors.border }]}
        >
          <Share2 size={14} color={colors.textTertiary} />
          <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginVertical: 6,
    width: '100%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  playingShadow: {
    boxShadow: '0 4px 12px rgba(26, 138, 74, 0.12)',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    fontSize: 10,
    fontWeight: 'bold',
  },
  metadataText: {
    fontSize: 10,
    fontWeight: '500',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arabicContainer: {
    position: 'relative',
    marginVertical: 8,
  },
  arabicText: {
    fontFamily: 'Amiri_400Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 48,
  },
  medallion: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 14,
    fontWeight: 'bold',
  },
  translationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  enText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  urText: {
    fontSize: 13,
    fontFamily: 'Amiri_400Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 99,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
