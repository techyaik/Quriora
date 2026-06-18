import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeContext } from '../context/ThemeContext';
import { SCREEN_MAX_WIDTH, themeColors } from '../styles/theme';

const USER_NAME_KEY = 'quriora-user-name';

export const NameSetupScreen: React.FC = () => {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const compact = width < 360 || height < 700;

  const continueToOnboarding = async () => {
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    if (!normalizedName) {
      setError('Please enter your name to continue.');
      return;
    }

    await AsyncStorage.setItem(USER_NAME_KEY, normalizedName);
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.container, { maxWidth: SCREEN_MAX_WIDTH }]}>
          <View style={styles.topSpacer} />

          <View style={styles.centerContent}>
            <View style={[styles.logoCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={[styles.logoGlow, { backgroundColor: colors.accentGlow }]} />
              <Image
                source={require('../../assets/logo-mark-transparent.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.copyBlock}>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>Before We Begin</Text>
              <Text style={[styles.title, { color: colors.textPrimary, fontSize: compact ? 30 : 36 }]}>
                What should we call you?
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Your name stays on this device and is used only for a warmer greeting.
              </Text>
            </View>

            <View style={styles.formBlock}>
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (error) setError('');
                }}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                returnKeyType="done"
                onSubmitEditing={continueToOnboarding}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: error ? colors.gold : colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
              {error ? <Text style={[styles.errorText, { color: colors.gold }]}>{error}</Text> : null}
            </View>
          </View>

          <TouchableOpacity
            onPress={continueToOnboarding}
            style={[styles.continueButton, { backgroundColor: colors.accent }]}
            activeOpacity={0.86}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    width: '100%',
  },
  topSpacer: {
    minHeight: 44,
  },
  centerContent: {
    alignItems: 'center',
    gap: 30,
  },
  logoCard: {
    alignItems: 'center',
    borderRadius: 42,
    borderWidth: 1,
    height: 172,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 34,
    width: 172,
    boxShadow: '0 22px 54px rgba(0, 0, 0, 0.12)',
  },
  logoGlow: {
    borderRadius: 999,
    height: 132,
    opacity: 0.72,
    position: 'absolute',
    right: -36,
    top: -34,
    width: 132,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  copyBlock: {
    alignItems: 'center',
    maxWidth: 430,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '900',
    letterSpacing: -1.1,
    lineHeight: 42,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 360,
    textAlign: 'center',
  },
  formBlock: {
    gap: 8,
    maxWidth: 420,
    width: '100%',
  },
  input: {
    borderRadius: 24,
    borderWidth: 1,
    fontSize: 17,
    fontWeight: '700',
    minHeight: 58,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  continueButton: {
    alignItems: 'center',
    borderRadius: 24,
    justifyContent: 'center',
    minHeight: 56,
    boxShadow: '0 14px 24px rgba(0, 0, 0, 0.10)',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
