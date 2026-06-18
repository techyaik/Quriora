import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext, Theme } from '../context/ThemeContext';
import { useAudioContext } from '../context/AudioContext';
import { SCREEN_MAX_WIDTH, themeColors, globalStyles } from '../styles/theme';
import Constants from 'expo-constants';
import { releaseLinks } from '../config/release';
import {
  Sliders,
  Volume2,
  Share2,
  Check,
  ChevronRight,
  Sparkles,
  X,
  HelpCircle,
  Info,
  Star,
  Bug,
  Mail,
  Shield,
  Book,
} from 'lucide-react-native';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const openURL = (url: string | null, label = 'Link') => {
  if (!url) {
    Alert.alert(`${label} unavailable`, `${label} has not been configured for this release.`);
    return;
  }
  Linking.openURL(url).catch(() => Alert.alert('Cannot Open Link', `The ${label.toLowerCase()} could not be opened.`));
};

export const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    showTajweed,
    setShowTajweed,
    showTranslation,
    setShowTranslation,
    showTransliteration,
    setShowTransliteration
  } = useThemeContext();

  const {
    currentReciterId,
    changeReciter,
    reciters,
    playbackSpeed,
    setSpeed,
    volume,
    setVolume
  } = useAudioContext();

  const colors = themeColors[theme];
  const supportEmail = releaseLinks.supportEmail;
  const privacyUrl = releaseLinks.privacy;

  const [reciterPickerVisible, setReciterPickerVisible] = useState(false);
  const [speedPickerVisible, setSpeedPickerVisible] = useState(false);

  const handleExport = async () => {
    try {
      const storedBookmarks = await AsyncStorage.getItem('quriora-bookmarks');
      const legacyBookmarks = await AsyncStorage.getItem('nurquran-guest-bookmarks');
      const bookmarks = JSON.parse(storedBookmarks || legacyBookmarks || '[]');
      if (!storedBookmarks && legacyBookmarks) {
        await AsyncStorage.setItem('quriora-bookmarks', legacyBookmarks);
        await AsyncStorage.removeItem('nurquran-guest-bookmarks');
      }
      
      const backupData = JSON.stringify(bookmarks, null, 2);
      await Clipboard.setStringAsync(backupData);
      Alert.alert('Copied to Clipboard', 'Your bookmarks backup JSON data has been copied to the clipboard.');
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Failed to export bookmarks.');
    }
  };

  const THEMES = [
    { id: 'light' as Theme, label: 'Light', color: '#F7F4EF', accent: '#1A7A5E', textColor: '#1A2421' },
    { id: 'dark' as Theme, label: 'Dark', color: '#0F1117', accent: '#2ECC71', textColor: '#FFFFFF' },
    { id: 'sepia' as Theme, label: 'Sepia', color: '#F8F0E3', accent: '#5A6E32', textColor: '#3B2F20' },
  ] as const;

  const SPEED_OPTIONS = [
    { value: 0.75, label: '0.75× Slow' },
    { value: 1.0, label: '1.0× Normal' },
    { value: 1.25, label: '1.25× Fast' },
    { value: 1.5, label: '1.5× Very Fast' }
  ];

  const activeReciter = reciters.find(r => r.id === currentReciterId);

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── PAGE HEADER ── */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Appearance, audio, tutorial and more</Text>
        </View>


        {/* ── APPEARANCE SECTION ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Sliders size={18} color={colors.accent} />
            <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Appearance</Text>
          </View>

          {/* Theme Selector */}
          <View style={styles.settingItem}>
            <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>Theme</Text>
            <View style={styles.themeRow}>
              {THEMES.map((t) => {
                const isActive = theme === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                onPress={() => {
                  setTheme(t.id);
                }}
                    style={[
                      styles.themePill,
                      {
                        backgroundColor: t.color,
                        borderColor: isActive ? t.accent : 'rgba(128,128,128,0.25)',
                        borderWidth: isActive ? 2.5 : 1,
                      }
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.themePillColor, { backgroundColor: t.accent }]} />
                    <Text style={[styles.themePillLabel, { color: t.textColor }]}>{t.label}</Text>
                    {isActive ? (
                      <View style={[styles.themeActiveIndicator, { backgroundColor: t.accent }]}>
                        <Check size={10} color="#fff" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Arabic Font Size Control (tactile button step selectors) */}
          <View style={styles.settingItem}>
            <View style={styles.flexRowBetween}>
              <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>Arabic Font Size</Text>
              <Text style={[styles.settingValueText, { color: colors.accent }]}>{fontSize}px</Text>
            </View>
            <View style={styles.fontSizeControlsRow}>
              <TouchableOpacity
                onPress={() => {
                  const newSize = Math.max(18, fontSize - 2);
                  setFontSize(newSize);
                }}
                style={[styles.fontSizeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              >
                <Text style={[styles.fontSizeBtnText, { color: colors.textPrimary }]}>A-</Text>
              </TouchableOpacity>

              <View style={[styles.fontSizePreviewBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <Text
                  style={[
                    globalStyles.fontArabic,
                    { fontSize: Math.min(fontSize, 28), color: colors.textPrimary, textAlign: 'center' }
                  ]}
                  numberOfLines={1}
                >
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  const newSize = Math.min(52, fontSize + 2);
                  setFontSize(newSize);
                }}
                style={[styles.fontSizeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              >
                <Text style={[styles.fontSizeBtnText, { color: colors.textPrimary }]}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Appearance Toggles */}
          <View style={styles.togglesList}>
            {/* Tajweed Toggle */}
            <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Tajweed Rules</Text>
                <Text style={[styles.toggleHint, { color: colors.textTertiary }]}>Color-code Tajweed rules in Arabic text</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowTajweed(!showTajweed);
                }}
                style={[
                  styles.switchTrack,
                  { backgroundColor: showTajweed ? colors.accent : colors.border }
                ]}
              >
                <View style={[styles.switchThumb, showTajweed && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>

            {/* Translation Toggle */}
            <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show Translation</Text>
                <Text style={[styles.toggleHint, { color: colors.textTertiary }]}>Display English translations below Arabic</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowTranslation(!showTranslation);
                }}
                style={[
                  styles.switchTrack,
                  { backgroundColor: showTranslation ? colors.accent : colors.border }
                ]}
              >
                <View style={[styles.switchThumb, showTranslation && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>

            {/* Transliteration Toggle */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show Transliteration</Text>
                <Text style={[styles.toggleHint, { color: colors.textTertiary }]}>Phonetic Latin pronunciation guide</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowTransliteration(!showTransliteration);
                }}
                style={[
                  styles.switchTrack,
                  { backgroundColor: showTransliteration ? colors.accent : colors.border }
                ]}
              >
                <View style={[styles.switchThumb, showTransliteration && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── AUDIO & RECITATION SECTION ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Volume2 size={18} color={colors.accent} />
            <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Audio & Recitation</Text>
          </View>

          {/* Reciter Selector */}
          <View style={styles.settingItem}>
            <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>Default Reciter</Text>
            <TouchableOpacity
              onPress={() => setReciterPickerVisible(true)}
              style={[styles.customDropdownTrigger, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            >
              <Text numberOfLines={1} style={[styles.customDropdownText, { color: colors.textPrimary }]}>
                {activeReciter ? `${activeReciter.nameEnglish} (${activeReciter.style})` : 'Select Reciter'}
              </Text>
              <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Speed Selector */}
          <View style={styles.settingItem}>
            <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>Playback Speed</Text>
            <TouchableOpacity
              onPress={() => setSpeedPickerVisible(true)}
              style={[styles.customDropdownTrigger, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            >
              <Text numberOfLines={1} style={[styles.customDropdownText, { color: colors.textPrimary }]}>
                {SPEED_OPTIONS.find(o => o.value === playbackSpeed)?.label || '1.0× Normal'}
              </Text>
              <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Volume tactile control */}
          <View style={styles.settingItem}>
            <View style={styles.flexRowBetween}>
              <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>Audio Volume</Text>
              <Text style={[styles.settingValueText, { color: colors.accent }]}>{Math.round(volume * 100)}%</Text>
            </View>
            <View style={styles.volumeAdjustRow}>
              <TouchableOpacity
                onPress={() => {
                  const newVol = Math.max(0, volume - 0.1);
                  setVolume(newVol);
                }}
                style={[styles.volumeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              >
                <Text style={[styles.volumeBtnText, { color: colors.textPrimary }]}>-</Text>
              </TouchableOpacity>
              
              <View style={[styles.volumeTrackProgress, { backgroundColor: colors.border }]}>
                <View style={[styles.volumeTrackFill, { width: `${volume * 100}%`, backgroundColor: colors.accent }]} />
              </View>

              <TouchableOpacity
                onPress={() => {
                  const newVol = Math.min(1.0, volume + 0.1);
                  setVolume(newVol);
                }}
                style={[styles.volumeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              >
                <Text style={[styles.volumeBtnText, { color: colors.textPrimary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── DATA BACKUP SECTION ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Share2 size={18} color={colors.accent} />
            <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Data & Backup</Text>
          </View>
          
          <Text style={[styles.backupDesc, { color: colors.textSecondary }]}>
            Export your bookmarked verses, annotations, and Hifz study review logs to the clipboard as JSON.
          </Text>

          <TouchableOpacity
            onPress={handleExport}
            style={[styles.backupBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          >
            <Share2 size={16} color={colors.accent} />
            <Text style={[styles.backupBtnText, { color: colors.textPrimary }]}>Export Bookmarks (JSON)</Text>
          </TouchableOpacity>
        </View>

        {supportEmail ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <HelpCircle size={18} color={colors.accent} />
              <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Help & Support</Text>
            </View>

            <TouchableOpacity
              onPress={() => openURL(`mailto:${supportEmail}?subject=Support%20Request`, 'Support Email')}
              style={[styles.helpRow, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={[styles.helpIconWrap, { backgroundColor: colors.accentLight }]}>
                <Mail size={15} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpLabel, { color: colors.textPrimary }]}>Contact Support</Text>
                <Text style={[styles.helpHint, { color: colors.textTertiary }]}>{supportEmail}</Text>
              </View>
              <ChevronRight size={15} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openURL(`mailto:${supportEmail}?subject=Feature%20Request`, 'Support Email')}
              style={[styles.helpRow, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={[styles.helpIconWrap, { backgroundColor: colors.accentLight }]}>
                <Star size={15} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpLabel, { color: colors.textPrimary }]}>Request a Feature</Text>
                <Text style={[styles.helpHint, { color: colors.textTertiary }]}>Share your ideas with us</Text>
              </View>
              <ChevronRight size={15} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openURL(`mailto:${supportEmail}?subject=Bug%20Report`, 'Support Email')}
              style={[styles.helpRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
            >
              <View style={[styles.helpIconWrap, { backgroundColor: 'rgba(231,76,60,0.1)' }]}>
                <Bug size={15} color="#E74C3C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpLabel, { color: colors.textPrimary }]}>Report an Issue</Text>
                <Text style={[styles.helpHint, { color: colors.textTertiary }]}>Help us improve Quriora</Text>
              </View>
              <ChevronRight size={15} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── ABOUT APP SECTION ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Info size={18} color={colors.accent} />
            <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>About</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/onboarding')}
            style={[styles.helpRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={[styles.helpIconWrap, { backgroundColor: colors.accentLight }]}>
              <Sparkles size={15} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpLabel, { color: colors.textPrimary }]}>View Onboarding Tutorial</Text>
              <Text style={[styles.helpHint, { color: colors.textTertiary }]}>Replay the app introduction and navigation guide</Text>
            </View>
            <ChevronRight size={15} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/explore/about')}
            style={[styles.helpRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={[styles.helpIconWrap, { backgroundColor: colors.accentLight }]}>
              <Info size={15} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpLabel, { color: colors.textPrimary }]}>About Quriora</Text>
              <Text style={[styles.helpHint, { color: colors.textTertiary }]}>Mission, team, version info</Text>
            </View>
            <ChevronRight size={15} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/explore/attributions')}
            style={[styles.helpRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={[styles.helpIconWrap, { backgroundColor: colors.accentLight }]}>
              <Book size={15} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpLabel, { color: colors.textPrimary }]}>Attributions</Text>
              <Text style={[styles.helpHint, { color: colors.textTertiary }]}>Open source credits</Text>
            </View>
            <ChevronRight size={15} color={colors.textTertiary} />
          </TouchableOpacity>

          {privacyUrl ? (
            <TouchableOpacity
              onPress={() => openURL(privacyUrl, 'Privacy Policy')}
              style={[styles.helpRow, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={[styles.helpIconWrap, { backgroundColor: colors.accentLight }]}>
                <Shield size={15} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
                <Text style={[styles.helpHint, { color: colors.textTertiary }]}>Review app privacy details</Text>
              </View>
              <ChevronRight size={15} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}

          <View style={[styles.helpRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.helpIconWrap, { backgroundColor: colors.accentLight }]}>
              <Info size={15} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpLabel, { color: colors.textPrimary }]}>App Version</Text>
              <Text style={[styles.helpHint, { color: colors.textTertiary }]}>
                {APP_VERSION} · {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Reciters selection dialog */}
      <Modal
        visible={reciterPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReciterPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Default Reciter</Text>
              <TouchableOpacity onPress={() => setReciterPickerVisible(false)} style={styles.modalClose}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {reciters.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={async () => {
                    await changeReciter(item.id);
                    setReciterPickerVisible(false);
                  }}
                  style={[
                    styles.modalListItem,
                    { borderBottomColor: colors.border },
                    currentReciterId === item.id && { backgroundColor: colors.accentLight }
                  ]}
                >
                  <Text style={[
                    styles.modalListItemText,
                    { color: currentReciterId === item.id ? colors.accent : colors.textPrimary }
                  ]}>
                    {item.nameEnglish} ({item.style})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Playback speed dialog */}
      <Modal
        visible={speedPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpeedPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Playback Speed</Text>
              <TouchableOpacity onPress={() => setSpeedPickerVisible(false)} style={styles.modalClose}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {SPEED_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={async () => {
                  await setSpeed(item.value);
                  setSpeedPickerVisible(false);
                }}
                style={[
                  styles.modalListItem,
                  { borderBottomColor: colors.border },
                  playbackSpeed === item.value && { backgroundColor: colors.accentLight }
                ]}
              >
                <Text style={[
                  styles.modalListItemText,
                  { color: playbackSpeed === item.value ? colors.accent : colors.textPrimary }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    width: '100%',
    maxWidth: SCREEN_MAX_WIDTH,
    alignSelf: 'center',
  },
  pageHeader: {
    marginBottom: 20,
    paddingLeft: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  helpRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  helpIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  helpHint: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  titleRow: {
    marginBottom: 20,
    paddingLeft: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 16,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.04)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  settingItem: {
    marginBottom: 16,
  },
  settingSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themePill: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 5,
    position: 'relative',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
    paddingVertical: 10,
  },
  themePillColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  },
  themePillLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  themeActiveIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCheck: {
    position: 'absolute',
    top: 4,
    right: 6,
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingValueText: {
    fontSize: 12,
    fontWeight: '800',
  },
  fontSizeControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontSizeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  fontSizePreviewBox: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  togglesList: {
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.8,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleHint: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.20)',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  customDropdownTrigger: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  customDropdownText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  volumeAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  volumeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  volumeTrackProgress: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  volumeTrackFill: {
    height: '100%',
    borderRadius: 3,
  },
  backupDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  backupBtn: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backupBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    maxHeight: '60%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListItem: {
    minHeight: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  modalListItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
