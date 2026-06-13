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
import { UserPlus, User, Lock, Mail, AlertCircle } from 'lucide-react-native';

export const RegisterScreen: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthContext();
  const { theme } = useThemeContext();
  const colors = themeColors[theme];
  const router = useRouter();

  const handleSubmit = async () => {
    setError(null);

    // Front-end Validations
    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/\d/.test(password)) {
      setError('Password must contain at least 1 number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        email: email.trim(),
        password,
        displayName: displayName.trim()
      });
      
      if (res.data.success) {
        // Auto-login after successful registration
        await login(res.data.data.token, res.data.data.user);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
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
          {/* Logo/Illustration */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoOutline, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
              <View style={[styles.logoCenter, { backgroundColor: colors.accent }]}>
                <UserPlus size={26} color="#fff" />
              </View>
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Create an Account</Text>
            <Text style={[styles.welcomeDesc, { color: colors.textSecondary }]}>
              Create a profile to save notes, organize bookmark tags, and track your daily reading goals.
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.registerCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            
            {/* Error Message */}
            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#E74C3C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Display Name Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.bgPrimary }]}>
                <User size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  style={[styles.inputTextInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.bgPrimary }]}>
                <Mail size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
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
                  placeholder="Min. 8 chars, 1 number"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.inputTextInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm Password</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.bgPrimary }]}>
                <Lock size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.inputTextInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, { backgroundColor: colors.accent }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <UserPlus size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Register & Log In</Text>
                </>
              )}
            </TouchableOpacity>

          </View>

          {/* Switch to Login Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={[styles.loginLink, { color: colors.accent }]}>Sign In</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
  registerCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
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
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  loginLink: {
    fontSize: 12,
    fontWeight: '800',
  },
});
