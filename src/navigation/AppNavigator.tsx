import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, TAB_BAR_BASE_HEIGHT } from '../styles/theme';
import { BottomAudioBar } from '../components/BottomAudioBar';

export const navigationRef = createNavigationContainerRef<any>();

// Import Screens
import { HomeScreen } from '../screens/HomeScreen';
import { SurahListScreen } from '../screens/SurahListScreen';
import { SurahScreen } from '../screens/SurahScreen';
import { ListenScreen } from '../screens/ListenScreen';
import { HifzScreen } from '../screens/HifzScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

// Import Lucide Icons
import { Home, BookOpen, Headphones, Award, Compass } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const QuranStack = createNativeStackNavigator();

// Nested Quran Stack Navigator
const QuranStackNavigator: React.FC = () => {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  return (
    <QuranStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.bgSecondary,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '800',
        },
      }}
    >
      <QuranStack.Screen
        name="SurahList"
        component={SurahListScreen}
        options={{ title: 'Surah Index' }}
      />
      <QuranStack.Screen
        name="Surah"
        component={SurahScreen}
        options={({ route }: any) => {
          const name = route.params?.nameEnglish;
          const hasName = name && name !== 'undefined' && name !== 'null';
          return {
            title: hasName ? `Surah ${name}` : 'Quran Reader',
          };
        }}
      />
    </QuranStack.Navigator>
  );
};

// Bottom Tab Navigator
const MainTabNavigator: React.FC = () => {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.bgSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 16,
        },
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <Home size={size} color={color} />;
          } else if (route.name === 'QuranStack') {
            return <BookOpen size={size} color={color} />;
          } else if (route.name === 'Listen') {
            return <Headphones size={size} color={color} />;
          } else if (route.name === 'Memorize') {
            return <Award size={size} color={color} />;
          } else if (route.name === 'Explore') {
            return <Compass size={size} color={color} />;
          }
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home Dashboard' }} />
      <Tab.Screen name="QuranStack" component={QuranStackNavigator} options={{ title: 'Quran Reader', headerShown: false }} />
      <Tab.Screen name="Listen" component={ListenScreen} options={{ title: 'Audio Station' }} />
      <Tab.Screen name="Memorize" component={HifzScreen} options={{ title: 'Hifz Tracker' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explore Hub' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { token, isGuest, isLoading } = useAuthContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const [activeRouteName, setActiveRouteName] = React.useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isAuthenticated = token !== null || isGuest;

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const currentRoute = navigationRef.getCurrentRoute();
        setActiveRouteName(currentRoute?.name);
      }}
    >
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.bgSecondary,
            },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontWeight: '800',
            },
          }}
        >
          {isAuthenticated ? (
            // Main Application Stacks
            <>
              <Stack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookmarks"
                component={BookmarksScreen}
                options={{ title: 'Bookmarks & Notes' }}
              />
              <Stack.Screen
                name="Search"
                component={SearchScreen}
                options={{ title: 'Quran Search' }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Preferences Settings' }}
              />
            </>
          ) : (
            // Auth Screen Stack
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
        <BottomAudioBar activeRouteName={activeRouteName} />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
