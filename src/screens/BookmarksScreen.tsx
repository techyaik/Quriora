import React, { memo, useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { fetchQuranAyah } from '../services/quranFallback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, globalStyles } from '../styles/theme';
import {
  Bookmark,
  Trash2,
  ExternalLink,
  FileText,
  Search,
  Edit3,
  Save,
  Tag,
  AlertCircle,
  X
} from 'lucide-react-native';

interface BookmarkItem {
  id: number;
  ayahId: number;
  note: string | null;
  createdAt: string;
  ayah: {
    ayahNumber: number;
    surahId: number;
    textUthmani: string;
    surah: {
      nameEnglish: string;
      nameArabic: string;
    };
    translations: Array<{ language: string; text: string }>;
  };
}

export const BookmarksScreen: React.FC = () => {
  const { user, isGuest } = useAuthContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBySurah, setGroupBySurah] = useState(false);

  // Note editor states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (user) {
        const res = await api.get('/api/user/bookmarks');
        if (res.data.success) {
          setBookmarks(res.data.data);
        }
      } else {
        // Load guest bookmarks from localStorage/AsyncStorage
        const storedGuestBookmarks = await AsyncStorage.getItem('nurquran-guest-bookmarks');
        const guestAyahIds: number[] = JSON.parse(storedGuestBookmarks || '[]');
        if (guestAyahIds.length > 0) {
          const responses = [];
          for (let index = 0; index < guestAyahIds.length; index += 8) {
            const batch = guestAyahIds.slice(index, index + 8);
            responses.push(...await Promise.all(batch.map(fetchQuranAyah)));
          }
          const noteEntries = await AsyncStorage.multiGet(
            responses.map(ayah => `nurquran-guest-note-${ayah.id}`)
          );
          const guestBookmarksList: BookmarkItem[] = responses.map((ayah, idx) => {
              const note = noteEntries[idx]?.[1];
              return {
                id: guestAyahIds[idx], // Mock ID
                ayahId: ayah.id,
                note: note || '',
                createdAt: new Date().toISOString(),
                ayah: {
                  ayahNumber: ayah.ayahNumber,
                  surahId: ayah.surahId,
                  textUthmani: ayah.textUthmani,
                  surah: {
                    nameEnglish: ayah.surah.nameEnglish,
                    nameArabic: ayah.surah.nameArabic
                  },
                  translations: ayah.translations
                }
              };
            });
          setBookmarks(guestBookmarksList);
        } else {
          setBookmarks([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load bookmarks:', err);
      setLoadError('Bookmarks could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const handleDeleteBookmark = useCallback(async (bookmarkId: number, ayahId: number) => {
    try {
      if (user) {
        await api.delete(`/api/user/bookmarks/${bookmarkId}`);
      } else {
        const storedGuestBookmarks = await AsyncStorage.getItem('nurquran-guest-bookmarks');
        let guestBookmarks = JSON.parse(storedGuestBookmarks || '[]');
        guestBookmarks = guestBookmarks.filter((id: number) => id !== ayahId);
        await AsyncStorage.setItem('nurquran-guest-bookmarks', JSON.stringify(guestBookmarks));
        await AsyncStorage.removeItem(`nurquran-guest-note-${ayahId}`);
      }
      setBookmarks(current => current.filter(b => b.id !== bookmarkId));
      Alert.alert('Success', 'Bookmark removed.');
    } catch (err) {
      console.warn('Failed to delete bookmark:', err);
    }
  }, [user]);

  const handleStartEdit = useCallback((item: BookmarkItem) => {
    setEditingId(item.id);
    setEditNoteText(item.note || '');
  }, []);

  const handleSaveNote = useCallback(async (item: BookmarkItem) => {
    try {
      if (user) {
        await api.put(`/api/user/bookmarks/${item.id}`, { note: editNoteText });
        setBookmarks(current => current.map(b => b.id === item.id ? { ...b, note: editNoteText } : b));
      } else {
        await AsyncStorage.setItem(`nurquran-guest-note-${item.ayahId}`, editNoteText);
        setBookmarks(current => current.map(b => b.id === item.id ? { ...b, note: editNoteText } : b));
      }
      setEditingId(null);
      Alert.alert('Saved', 'Personal note updated successfully.');
    } catch (err) {
      console.warn('Failed to save note:', err);
    }
  }, [user, editNoteText]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleOpen = useCallback((surahId: number, ayahId: number) => {
    router.push({ pathname: '/quran/surah/[id]', params: { id: surahId, highlight: ayahId } });
  }, [router]);

  // Share formatted bookmarks text
  const handleExportText = async () => {
    if (filteredBookmarks.length === 0) return;
    
    let report = 'Quriora Saved Bookmarks:\n\n';
    filteredBookmarks.forEach((b, index) => {
      const trans = b.ayah.translations.find(t => t.language === 'en')?.text || '';
      report += `${index + 1}. Surah ${b.ayah.surah.nameEnglish} [${b.ayah.surahId}:${b.ayah.ayahNumber}]\n`;
      report += `Arabic: ${b.ayah.textUthmani}\n`;
      report += `Translation: ${trans}\n`;
      if (b.note) {
        report += `Note: ${b.note}\n`;
      }
      report += '\n';
    });

    try {
      await Share.share({
        message: report,
        title: 'My Quriora Bookmarks'
      });
    } catch (err) {
      console.warn('Failed to share report:', err);
    }
  };

  const filteredBookmarks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    return bookmarks.filter(b => {
      const trans = b.ayah.translations.find(t => t.language === 'en')?.text || '';
      return b.ayah.textUthmani.includes(searchQuery.trim()) ||
        trans.toLocaleLowerCase().includes(normalizedQuery) ||
        (b.note || '').toLocaleLowerCase().includes(normalizedQuery) ||
        b.ayah.surah.nameEnglish.toLocaleLowerCase().includes(normalizedQuery);
    });
  }, [bookmarks, searchQuery]);

  const groupedBookmarks = useMemo(() => filteredBookmarks.reduce((acc: Record<string, BookmarkItem[]>, item) => {
    const key = item.ayah.surah.nameEnglish || `Surah ${item.ayah.surahId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}), [filteredBookmarks]);

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['left', 'right']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title row */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bookmarked Ayahs</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Access your saved verses and personal notes.
            </Text>
          </View>
          {filteredBookmarks.length > 0 && (
            <TouchableOpacity
              onPress={handleExportText}
              style={[styles.exportBtn, { borderColor: colors.accent }]}
            >
              <FileText size={14} color={colors.accent} />
              <Text style={[styles.exportBtnText, { color: colors.accent }]}>Share</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Guest Warning */}
        {isGuest && (
          <View style={[styles.guestWarning, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <AlertCircle size={16} color={colors.accent} style={{ marginTop: 2 }} />
            <Text style={[styles.guestWarningText, { color: colors.textSecondary }]}>
              You are viewing local bookmarks. Sign in to synchronize your favorites permanently across devices.
            </Text>
          </View>
        )}

        {/* Toolbar (Search + Checkbox Grouping) */}
        {bookmarks.length > 0 && (
          <View style={[styles.toolbar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <View style={styles.searchBar}>
              <Search size={16} color={colors.textTertiary} style={{ marginRight: 6 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search bookmarks..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => setGroupBySurah(!groupBySurah)}
              style={styles.checkboxRow}
            >
              <View style={[
                styles.checkboxBox,
                { borderColor: colors.accent },
                groupBySurah && { backgroundColor: colors.accent }
              ]} />
              <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>Group by Surah</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main List */}
        {loadError ? (
          <View style={[styles.emptyContainer, { borderColor: colors.border }]}> 
            <AlertCircle size={36} color={colors.textTertiary} style={{ opacity: 0.6, marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Bookmarks unavailable</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{loadError}</Text>
            <TouchableOpacity onPress={fetchBookmarks} style={[styles.retryBtn, { backgroundColor: colors.accent }]}> 
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : bookmarks.length === 0 ? (
          <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
            <Bookmark size={40} color={colors.textTertiary} style={{ opacity: 0.5, marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No bookmarks yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Click the bookmark icon on any verse while reading to save it here for reference.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {groupBySurah ? (
              Object.entries(groupedBookmarks).map(([surahName, items]) => (
                <View key={surahName} style={{ gap: 8 }}>
                  <View style={styles.groupHeader}>
                    <Tag size={12} color={colors.accent} />
                    <Text style={[styles.groupTitle, { color: colors.accent }]}>{surahName}</Text>
                  </View>
                  {items.map((b) => (
                    <BookmarkCard
                      key={b.id}
                      item={b}
                      colors={colors}
                      editingId={editingId}
                      editNoteText={editNoteText}
                      setEditNoteText={setEditNoteText}
                      onStartEdit={handleStartEdit}
                      onSaveNote={handleSaveNote}
                      onCancelEdit={handleCancelEdit}
                      onDelete={handleDeleteBookmark}
                      onOpen={handleOpen}
                    />
                  ))}
                </View>
              ))
            ) : (
              filteredBookmarks.map((b) => (
                <BookmarkCard
                  key={b.id}
                  item={b}
                  colors={colors}
                  editingId={editingId}
                  editNoteText={editNoteText}
                  setEditNoteText={setEditNoteText}
                  onStartEdit={handleStartEdit}
                  onSaveNote={handleSaveNote}
                  onCancelEdit={handleCancelEdit}
                  onDelete={handleDeleteBookmark}
                  onOpen={handleOpen}
                />
              ))
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

/* BookmarkCard Item Component */
interface BookmarkCardProps {
  item: BookmarkItem;
  colors: any;
  editingId: number | null;
  editNoteText: string;
  setEditNoteText: (val: string) => void;
  onStartEdit: (item: BookmarkItem) => void;
  onSaveNote: (item: BookmarkItem) => void;
  onCancelEdit: () => void;
  onDelete: (bookmarkId: number, ayahId: number) => void;
  onOpen: (surahId: number, ayahId: number) => void;
}

const BookmarkCard = memo(function BookmarkCard({
  item,
  colors,
  editingId,
  editNoteText,
  setEditNoteText,
  onStartEdit,
  onSaveNote,
  onCancelEdit,
  onDelete,
  onOpen,
}: BookmarkCardProps) {
  const trans = item.ayah.translations.find(t => t.language === 'en')?.text || '';

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
            {item.ayah.surah.nameEnglish || 'Surah'} · {item.ayah.surahId}:{item.ayah.ayahNumber}
          </Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.textTertiary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Uthmani text */}
      <Text style={[styles.arabicText, { color: colors.textPrimary }]}>
        {item.ayah.textUthmani}
      </Text>

      {/* Translation */}
      <Text style={[styles.translationText, { color: colors.textSecondary, borderLeftColor: colors.border }]}>
        {trans}
      </Text>

      {/* Note Area */}
      <View style={[styles.noteContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        {editingId === item.id ? (
          <View style={styles.noteEditorRow}>
            <TextInput
              value={editNoteText}
              onChangeText={setEditNoteText}
              placeholder="Add personal note..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.noteInputField, { color: colors.textPrimary, borderColor: colors.border }]}
            />
            <TouchableOpacity onPress={() => onSaveNote(item)} style={[styles.noteSaveBtn, { backgroundColor: colors.accent }]}>
              <Save size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancelEdit} style={[styles.noteCancelBtn, { borderColor: colors.border }]}>
              <Text style={{ fontSize: 12, color: colors.textPrimary }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noteViewerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noteLabel, { color: colors.textTertiary }]}>ANNOTATION NOTE</Text>
              <Text style={[styles.noteText, { color: colors.textPrimary }]}>
                {item.note || 'No note added. Tap edit to write an annotation.'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onStartEdit(item)} style={[styles.noteEditBtn, { borderColor: colors.border }]}>
              <Edit3 size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Row */}
      <View style={[styles.cardActionsRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => onOpen(item.ayah.surahId, item.ayahId)}
          style={[styles.cardActionBtn, { backgroundColor: colors.accentLight }]}
        >
          <ExternalLink size={12} color={colors.accent} />
          <Text style={[styles.cardActionBtnText, { color: colors.accent }]}>Go to Ayah</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDelete(item.id, item.ayahId)}
          style={[styles.cardDeleteBtn, { borderColor: colors.border }]}
        >
          <Trash2 size={12} color="#E74C3C" />
          <Text style={styles.cardDeleteBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
});

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guestWarning: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  guestWarningText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  toolbar: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    gap: 6,
  },
  checkboxBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  checkboxLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 24,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 4,
    lineHeight: 16,
  },
  retryBtn: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingLeft: 4,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  /* CARD STYLES */
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardDate: {
    fontSize: 9,
    fontWeight: '600',
  },
  arabicText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 20,
    lineHeight: 34,
    textAlign: 'right',
    marginBottom: 10,
  },
  translationText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    borderLeftWidth: 2.5,
    paddingLeft: 10,
    marginBottom: 12,
  },
  noteContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 0.4,
  },
  noteText: {
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: 2,
  },
  noteEditBtn: {
    borderWidth: 1,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  noteInputField: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  noteSaveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCancelBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  noteEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteViewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 22,
    gap: 4,
  },
  cardActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    gap: 4,
    marginLeft: 'auto',
  },
  cardDeleteBtnText: {
    color: '#E74C3C',
    fontSize: 10,
    fontWeight: '700',
  },
});
