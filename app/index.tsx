import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useThemeContext } from '@/src/context/ThemeContext';
import { themeColors } from '@/src/styles/theme';

const ONBOARDING_COMPLETE_KEY = 'quriora-onboarding-complete';
const NAV_TUTORIAL_COMPLETE_KEY = 'quriora-navigation-tutorial-complete';

export default function IndexRoute() {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const [initialRoute, setInitialRoute] = useState<'onboarding' | 'tutorial' | 'home' | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStartupRoute = async () => {
      const [onboardingComplete, tutorialComplete] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
        AsyncStorage.getItem(NAV_TUTORIAL_COMPLETE_KEY),
      ]);

      if (!mounted) return;
      if (onboardingComplete !== 'true') {
        setInitialRoute('onboarding');
      } else if (tutorialComplete !== 'true') {
        setInitialRoute('tutorial');
      } else {
        setInitialRoute('home');
      }
    };

    loadStartupRoute().catch(() => {
      if (mounted) setInitialRoute('onboarding');
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={initialRoute === 'home' ? '/home' : `/${initialRoute}`} />;
}
