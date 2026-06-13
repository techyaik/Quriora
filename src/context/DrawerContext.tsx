import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Switch,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Share2, Heart } from 'lucide-react-native';
import { useThemeContext } from './ThemeContext';
import { themeColors } from '../styles/theme';

interface DrawerContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawerContext = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawerContext must be used within a DrawerProvider');
  }
  return context;
};

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [collectUsage, setCollectUsage] = useState(true);
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.82; // covers ~82% of screen width

  // Animation values
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDrawerOpen) {
      // Open animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close animation is handled before setting isDrawerOpen to false
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -drawerWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDrawerOpen, drawerWidth]);

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDrawerOpen(false);
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Explore Quran, Tafsir, and track your Hifz progress with Deen App! Download it now.',
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  const menuItems = [
    { label: 'My Hajj' },
    { label: 'About Us' },
    { label: 'Request a Feature' },
    { label: 'Report an Issue' },
    { label: 'Rate the App' },
    { label: 'Terms of Use & Privacy Policy' },
    { label: 'Attributions' },
  ];

  return (
    <DrawerContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer }}>
      {children}

      <Modal
        transparent
        visible={isDrawerOpen}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
          </TouchableWithoutFeedback>

          {/* Drawer Container */}
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                width: drawerWidth,
                transform: [{ translateX: slideAnim }],
                backgroundColor: colors.bgPrimary,
              },
            ]}
          >
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'bottom']}>
              {/* Header: Back Arrow */}
              <View style={styles.header}>
                <TouchableOpacity onPress={closeDrawer} style={styles.backButton} activeOpacity={0.7}>
                  <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Menu List */}
                <View style={styles.menuList}>
                  {menuItems.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {}}
                      style={[styles.menuItem, { borderBottomColor: colors.border }]}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.menuItemLabel, { color: colors.textPrimary }]}>
                        {item.label}
                      </Text>
                      <ArrowRight size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Switch Item */}
                <View style={[styles.switchContainer, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
                    Anonymously collect usage and crash reports
                  </Text>
                  <Switch
                    value={collectUsage}
                    onValueChange={setCollectUsage}
                    trackColor={{ false: '#767577', true: colors.accent }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
                    ios_backgroundColor="#767577"
                  />
                </View>

                {/* Accent Cards */}
                <View style={styles.cardsContainer}>
                  {/* Share App */}
                  <TouchableOpacity
                    onPress={handleShare}
                    style={[
                      styles.actionCard,
                      {
                        borderColor: colors.accent,
                        backgroundColor: theme === 'dark' ? colors.bgSecondary : '#FFF',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cardText, { color: colors.textPrimary }]}>
                      Share Deen App
                    </Text>
                    <View style={[styles.cardIconWrap, { backgroundColor: colors.accentLight }]}>
                      <Share2 size={16} color={colors.accent} />
                    </View>
                  </TouchableOpacity>

                  {/* Support App */}
                  <TouchableOpacity
                    onPress={() => {}}
                    style={[
                      styles.actionCard,
                      {
                        borderColor: colors.accent,
                        backgroundColor: theme === 'dark' ? colors.bgSecondary : '#FFF',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cardText, { color: colors.textPrimary }]}>
                      Support Deen
                    </Text>
                    <View style={[styles.cardIconWrap, { backgroundColor: colors.accentLight }]}>
                      <Heart size={16} color={colors.accent} fill={colors.accent} />
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Version Footer */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                  Deen V3.4.0 (81) | 019eb6
                </Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </DrawerContext.Provider>
  );
};
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  drawerContainer: {
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  menuList: {
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
    marginBottom: 20,
  },
  switchLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
