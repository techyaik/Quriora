import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { useDrawerContext } from '../context/DrawerContext';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors } from '../styles/theme';
import { MenuIcon } from './MenuIcon';

interface SharedHeaderProps {
  options: any;
  route: any;
  navigation: any;
  back?: any;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({ options, route, navigation, back }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawerContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  const isHome = options.isHome === true;
  
  // Choose header styling based on whether it is the Home screen or a secondary screen.
  const headerBg = isHome ? colors.accent : (options.headerStyle?.backgroundColor ?? colors.bgPrimary);
  const tintColor = isHome ? '#FFFFFF' : (options.headerTintColor ?? colors.textPrimary);
  const title = options.title !== undefined ? options.title : (options.headerTitle ?? route.name);

  // Home screen right settings color
  const settingsIconColor = isHome ? '#FFFFFF' : colors.textPrimary;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/home');
    }
  };

  const showSettings = isHome || 
    (route.name === 'index' && !back) || 
    options.showSettings === true;

  return (
    <View style={[styles.headerContainer, { backgroundColor: headerBg, paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        {/* Left Side Button Container */}
        <View style={styles.sideButtonContainer}>
          {isHome ? (
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.headerButton}
              activeOpacity={0.7}
              accessibilityLabel="Open navigation drawer"
            >
              <MenuIcon size={22} color={tintColor} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.headerButton}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color={tintColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Title Container */}
        <View style={styles.titleContainer}>
          {!isHome && title ? (
            <Text
              style={[
                styles.titleText,
                { color: tintColor },
                options.headerTitleStyle
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
        </View>

        {/* Right Side Button Container */}
        <View style={[styles.sideButtonContainer, styles.rightAlign]}>
          {options.headerRight ? (
            options.headerRight()
          ) : showSettings ? (
            <TouchableOpacity
              onPress={() => router.push('/explore/settings')}
              style={styles.headerButton}
              activeOpacity={0.7}
              accessibilityLabel="Open settings"
            >
              <Settings size={20} color={settingsIconColor} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }
    }),
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sideButtonContainer: {
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    position: 'absolute',
    left: 60,
    right: 60,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
