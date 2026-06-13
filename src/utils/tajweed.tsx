import React from 'react';
import { Text, StyleSheet } from 'react-native';

/**
 * Parsers for Uthmani script to highlight basic Tajweed rules.
 * Rules:
 * 1. Ghunnah (Orange): Noon Shaddah (نّ) and Meem Shaddah (مّ)
 * 2. Qalqalah (Purple): قطب جد (ق, ط, ب, ج, د) with Sukun (ْ)
 * 3. Madd (Red/Blue): Madd characters (~ over Alif, Waw, Ya)
 */
export function formatTajweed(text: string, baseStyle: any): React.ReactNode[] {
  const words = text.split(' ');
  
  const styles = StyleSheet.create({
    ghunnah: { color: '#E67E22', fontWeight: '700' },
    qalqalah: { color: '#8E44AD', fontWeight: '700' },
    maddNormal: { color: '#34495E', fontWeight: '700' },
    maddLazim: { color: '#C0392B', fontWeight: '700' },
  });

  return words.map((word, wordIdx) => {
    const hasNoonShaddah = word.includes('نّ') || word.includes('نّْ');
    const hasMeemShaddah = word.includes('مّ') || word.includes('مّْ');
    
    const qalqalahRegex = /[قطبجد]ْ/g;
    const hasQalqalah = qalqalahRegex.test(word);

    const hasMaddNormal = word.includes('ٰ') || word.includes('ٖ');
    const hasMaddLazim = word.includes('ۤ') || word.includes('~');

    let wordStyle = {};
    if (hasNoonShaddah || hasMeemShaddah) {
      wordStyle = styles.ghunnah;
    } else if (hasQalqalah) {
      wordStyle = styles.qalqalah;
    } else if (hasMaddLazim) {
      wordStyle = styles.maddLazim;
    } else if (hasMaddNormal) {
      wordStyle = styles.maddNormal;
    }

    return (
      <Text key={wordIdx} style={[baseStyle, wordStyle]}>
        {word}{' '}
      </Text>
    );
  });
}
