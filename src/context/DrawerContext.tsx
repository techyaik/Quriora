import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Switch,
  ScrollView,
  Share,
  Platform,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Share2, Heart, Globe, Star, MessageCircle, Bug, Info, Book } from 'lucide-react-native';
import { useThemeContext } from './ThemeContext';
import { themeColors } from '../styles/theme';
import { type Href, useRouter } from 'expo-router';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// App store URLs — update when live on stores
const IOS_APP_URL = 'https://apps.apple.com/app/quriora/id123456789';
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.aik7.quriora';
const TERMS_URL = 'https://quriora.app/terms';
const HAJJ_URL = 'https://www.islamicfinder.org/hajj-guide/';

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
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const drawerWidth = Math.min(screenWidth * 0.86, 390);
  const useNativeDriver = process.env.EXPO_OS !== 'web';

  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -drawerWidth,
          duration: 250,
          useNativeDriver,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver,
        }),
      ]).start();
    }
  }, [fadeAnim, isDrawerOpen, drawerWidth, slideAnim, useNativeDriver]);

  const openDrawer = () => setIsDrawerOpen(true);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 250,
        useNativeDriver,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver,
      }),
    ]).start(() => setIsDrawerOpen(false));
  };

  const navigateAndClose = (path: Href) => {
    closeDrawer();
    setTimeout(() => router.push(path), 300);
  };

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open Link', 'Your device cannot open this URL.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          'Explore the Quran, track your Hifz progress, and listen to beautiful recitations with Quriora! ' +
          (Platform.OS === 'ios' ? IOS_APP_URL : ANDROID_APP_URL),
        title: 'Quriora — Quran App',
      });
    } catch {
      // user cancelled share
    }
  };

  const handleRateApp = () => {
    const url = Platform.OS === 'ios' ? IOS_APP_URL : ANDROID_APP_URL;
    openURL(url);
    closeDrawer();
  };

  const handleTerms = () => {
    openURL(TERMS_URL);
    closeDrawer();
  };

  const handleMyHajj = () => {
    openURL(HAJJ_URL);
    closeDrawer();
  };

  const handleRequestFeature = () => {
    openURL('mailto:support@quriora.app?subject=Feature%20Request&body=Hi%20Quriora%20team%2C%0A%0AI%20would%20like%20to%20suggest%3A');
    closeDrawer();
  };

  const handleReportIssue = () => {
    openURL('mailto:support@quriora.app?subject=Bug%20Report&body=Hi%20Quriora%20team%2C%0A%0AI%20found%20an%20issue%3A');
    closeDrawer();
  };

  interface MenuItem {
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
  }

  const menuItems: MenuItem[] = [
    {
      label: 'My Hajj Guide',
      icon: <Globe size={17} color={colors.accent} />,
      onPress: handleMyHajj,
    },
    {
      label: 'About Quriora',
      icon: <Info size={17} color={colors.accent} />,
      onPress: () => navigateAndClose('/explore/about'),
    },
    {
      label: 'Attributions',
      icon: <Book size={17} color={colors.accent} />,
      onPress: () => navigateAndClose('/explore/attributions'),
    },
    {
      label: 'Request a Feature',
      icon: <Star size={17} color={colors.accent} />,
      onPress: handleRequestFeature,
    },
    {
      label: 'Report an Issue',
      icon: <Bug size={17} color={colors.accent} />,
      onPress: handleReportIssue,
    },
    {
      label: 'Rate Quriora',
      icon: <Star size={17} color="#F4774A" />,
      onPress: handleRateApp,
    },
    {
      label: 'Terms & Privacy Policy',
      icon: <MessageCircle size={17} color={colors.accent} />,
      onPress: handleTerms,
    },
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
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={closeDrawer} style={styles.backButton} activeOpacity={0.7}>
                  <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Menu</Text>
                </View>
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
                      onPress={item.onPress}
                      style={[styles.menuItem, { borderBottomColor: colors.border }]}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.menuIconWrap, { backgroundColor: colors.accentLight }]}>
                        {item.icon}
                      </View>
                      <Text style={[styles.menuItemLabel, { color: colors.textPrimary }]}>
                        {item.label}
                      </Text>
                      <ArrowRight size={14} color={colors.textTertiary} />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Analytics Toggle */}
                <View style={[styles.switchContainer, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>
                    Anonymously share usage & crash reports
                  </Text>
                  <Switch
                    value={collectUsage}
                    onValueChange={setCollectUsage}
                    trackColor={{ false: '#767577', true: colors.accent }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
                    ios_backgroundColor="#767577"
                  />
                </View>

                {/* Action Cards */}
                <View style={styles.cardsContainer}>
                  <TouchableOpacity
                    onPress={() => { handleShare(); closeDrawer(); }}
                    style={[
                      styles.actionCard,
                      {
                        borderColor: colors.accent,
                        backgroundColor: colors.bgCard,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cardText, { color: colors.textPrimary }]}>
                      Share Quriora
                    </Text>
                    <View style={[styles.cardIconWrap, { backgroundColor: colors.accentLight }]}>
                      <Share2 size={16} color={colors.accent} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openURL('mailto:support@quriora.app?subject=Support')}
                    style={[
                      styles.actionCard,
                      {
                        borderColor: colors.accent,
                        backgroundColor: colors.bgCard,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cardText, { color: colors.textPrimary }]}>
                      Support Quriora
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
                  Quriora v{APP_VERSION}
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
    boxShadow: '4px 0 12px rgba(0, 0, 0, 0.18)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  menuList: {
    marginBottom: 8,
  },
  menuItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
    marginBottom: 20,
  },
  switchLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  cardsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
  },
  cardText: {
    fontSize: 13,
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
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
