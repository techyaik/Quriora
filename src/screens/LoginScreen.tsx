import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api, getErrorMessage } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { themeColors, globalStyles } from '../styles/theme';
import { LogIn, User, Lock, Sparkles, AlertCircle } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, enterAsGuest } = useAuthContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and Password are required');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email: email.trim(), password });
      if (res.data.success) {
        await login(res.data.data.token, res.data.data.user);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = async () => {
    await enterAsGuest();
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo illustration */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoOutline, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
              <View style={[styles.logoCenter, { backgroundColor: colors.accent }]}>
                <LogIn size={26} color="#fff" />
              </View>
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Welcome to Quriora</Text>
            <Text style={[styles.welcomeDesc, { color: colors.textSecondary }]}>
              Sign in to sync your memorization progress, bookmark tags, and reading preferences.
            </Text>
          </View>

          {/* Form container */}
          <View style={[styles.loginCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            
            {/* Error Message */}
            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#E74C3C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.bgPrimary }]}>
                <User size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.inputTextInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.bgPrimary }]}>
                <Lock size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.inputTextInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            {/* Sign-in Action Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, { backgroundColor: colors.accent }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <LogIn size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Or Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Third-party buttons */}
            <View style={styles.oauthRow}>
              <TouchableOpacity
                onPress={handleGuestEntry}
                disabled={loading}
                style={[styles.guestBtn, { borderColor: colors.accent }]}
              >
                <Sparkles size={14} color={colors.gold} style={{ marginRight: 4 }} />
                <Text style={[styles.guestBtnText, { color: colors.textSecondary }]}>Guest Entry</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Footer Navigation Switcher */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>New to Quriora? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={[styles.registerLink, { color: colors.accent }]}>Create an Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: process.env.EXPO_OS === 'ios' ? 40 : 20,
    paddingBottom: 40,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoOutline: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
    marginBottom: 14,
  },
  logoCenter: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
    paddingHorizontal: 16,
  },
  loginCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)',
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.2)',
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#D98880',
    fontSize: 11,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.10)',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 0.8,
  },
  dividerText: {
    fontSize: 8,
    fontWeight: '800',
    marginHorizontal: 10,
    letterSpacing: 0.8,
  },
  oauthRow: {
    flexDirection: 'row',
    gap: 10,
  },
  oauthBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  oauthBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guestBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  guestBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  registerLink: {
    fontSize: 12,
    fontWeight: '800',
  },
});
