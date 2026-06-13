import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext, Theme } from '../context/ThemeContext';
import { useAudioContext } from '../context/AudioContext';
import { useAuthContext } from '../context/AuthContext';
import { themeColors, globalStyles, AUDIO_BAR_HEIGHT } from '../styles/theme';
import {
  Sliders,
  Settings,
  User,
  Volume2,
  Share2,
  Check,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
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

  const { user, isGuest } = useAuthContext();
  const colors = themeColors[theme];
  const { width } = useWindowDimensions();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [savingAccount, setSavingAccount] = useState(false);
  const [reciterPickerVisible, setReciterPickerVisible] = useState(false);
  const [speedPickerVisible, setSpeedPickerVisible] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.displayName || '');
  }, [user]);

  const syncDB = async (payload: any) => {
    if (isGuest || !user) return;
    try {
      await axios.put('/api/user/settings', payload);
    } catch (err) {
      console.error('Failed to sync settings with DB:', err);
    }
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    setSavingAccount(true);
    try {
      const res = await axios.put('/api/user/profile', { displayName });
      if (res.data.success) {
        Alert.alert('Success', 'Profile display name updated successfully.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleExport = async () => {
    try {
      let bookmarks = [];
      if (user) {
        const res = await axios.get('/api/user/bookmarks');
        bookmarks = res.data.data;
      } else {
        const storedBookmarks = await AsyncStorage.getItem('nurquran-guest-bookmarks');
        bookmarks = JSON.parse(storedBookmarks || '[]');
      }
      
      const backupData = JSON.stringify(bookmarks, null, 2);
      await Clipboard.setStringAsync(backupData);
      Alert.alert('Copied to Clipboard', 'Your bookmarks backup JSON data has been copied to the clipboard.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to export bookmarks.');
    }
  };

  const THEMES = [
    { id: 'light' as Theme, label: 'Light', color: '#FAFAF8', accent: '#1A8A4A' },
    { id: 'dark' as Theme, label: 'Dark', color: '#0F1117', accent: '#2ECC71' },
    { id: 'sepia' as Theme, label: 'Sepia', color: '#F8F0E3', accent: '#5A6E32' },
  ] as const;

  const SPEED_OPTIONS = [
    { value: 0.75, label: '0.75× Slow' },
    { value: 1.0, label: '1.0× Normal' },
    { value: 1.25, label: '1.25× Fast' },
    { value: 1.5, label: '1.5× Very Fast' }
  ];

  const activeReciter = reciters.find(r => r.id === currentReciterId);

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: AUDIO_BAR_HEIGHT + insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.titleRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Customize your Quriora experience
          </Text>
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
                      syncDB({ theme: t.id });
                    }}
                    style={[
                      styles.themePill,
                      {
                        backgroundColor: t.color,
                        borderColor: isActive ? colors.accent : colors.border,
                        borderWidth: isActive ? 2 : 1
                      }
                    ]}
                  >
                    <View style={[styles.themePillColor, { backgroundColor: t.accent }]} />
                    <Text style={[styles.themePillLabel, { color: '#333' }]}>{t.label}</Text>
                    {isActive ? (
                      <Check size={12} color={colors.accent} style={styles.themeCheck} />
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
                  syncDB({ fontSize: newSize });
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
                  syncDB({ fontSize: newSize });
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
                  syncDB({ showTajweed: !showTajweed });
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
                  syncDB({ showTranslation: !showTranslation });
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
                  syncDB({ showTransliteration: !showTransliteration });
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
              <Text style={[styles.customDropdownText, { color: colors.textPrimary }]}>
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
              <Text style={[styles.customDropdownText, { color: colors.textPrimary }]}>
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

        {/* ── ACCOUNT SECTION ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <User size={18} color={colors.accent} />
            <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Account Profile</Text>
          </View>

          {!isGuest && user ? (
            <View style={styles.accountForm}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputFieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
                <TextInput
                  value={user.email}
                  editable={false}
                  style={[styles.disabledTextInput, { backgroundColor: colors.bgSecondary, color: colors.textTertiary, borderColor: colors.border }]}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputFieldLabel, { color: colors.textSecondary }]}>Display Name</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={[styles.activeTextInput, { backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.border }]}
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveAccount}
                disabled={savingAccount}
                style={[styles.saveProfileBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.saveProfileBtnText}>
                  {savingAccount ? 'Saving...' : 'Save Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.guestCenter}>
              <View style={[styles.guestIconWrap, { backgroundColor: colors.accentLight }]}>
                <Sparkles size={24} color={colors.accent} />
              </View>
              <Text style={[styles.guestTitle, { color: colors.textPrimary }]}>Guest Mode Active</Text>
              <Text style={[styles.guestDesc, { color: colors.textSecondary }]}>
                Sign in to sync your progress, bookmarks, and notes across all your mobile and web devices.
              </Text>
            </View>
          )}
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
                    await syncDB({ reciterId: item.id });
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
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
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  themePillColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themePillLabel: {
    fontSize: 11,
    fontWeight: '700',
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  customDropdownTrigger: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  customDropdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  volumeAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  volumeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  accountForm: {
    gap: 12,
  },
  inputWrapper: {
    gap: 4,
  },
  inputFieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginLeft: 2,
  },
  disabledTextInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTextInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  saveProfileBtn: {
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveProfileBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  guestCenter: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  guestTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  guestDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  backupDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  backupBtn: {
    height: 42,
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
    padding: 4,
  },
  modalListItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  modalListItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
