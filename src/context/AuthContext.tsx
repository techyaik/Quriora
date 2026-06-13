import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { setApiAuthToken } from '../services/api';

export interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  enterAsGuest: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'nurquran-token';

const tokenStorage = {
  get: () => Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY),
  set: (value: string) => Platform.OS === 'web'
    ? AsyncStorage.setItem(TOKEN_KEY, value)
    : SecureStore.setItemAsync(TOKEN_KEY, value),
  remove: () => Platform.OS === 'web'
    ? AsyncStorage.removeItem(TOKEN_KEY)
    : SecureStore.deleteItemAsync(TOKEN_KEY),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        let storedToken = await tokenStorage.get();
        const legacyToken = Platform.OS === 'web' ? null : await AsyncStorage.getItem(TOKEN_KEY);
        if (!storedToken && legacyToken) {
          storedToken = legacyToken;
          await tokenStorage.set(legacyToken);
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
        const storedUser = await AsyncStorage.getItem('nurquran-user');
        const storedGuest = await AsyncStorage.getItem('nurquran-guest') === 'true';

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setApiAuthToken(storedToken);
        } else if (storedGuest) {
          setIsGuest(true);
        }
      } catch (err) {
        console.warn('Error loading auth state:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthState();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setIsGuest(false);
    try {
      await tokenStorage.set(newToken);
      await AsyncStorage.setItem('nurquran-user', JSON.stringify(newUser));
      await AsyncStorage.removeItem('nurquran-guest');
      setApiAuthToken(newToken);
    } catch (e) {
      console.warn(e);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setIsGuest(false);
    try {
      await tokenStorage.remove();
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem('nurquran-user');
      await AsyncStorage.removeItem('nurquran-guest');
      setApiAuthToken(null);
    } catch (e) {
      console.warn(e);
    }
  };

  const enterAsGuest = async () => {
    setIsGuest(true);
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.setItem('nurquran-guest', 'true');
      await tokenStorage.remove();
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem('nurquran-user');
      setApiAuthToken(null);
    } catch (e) {
      console.warn(e);
    }
  };

  const updateUser = async (nextUser: User) => {
    setUser(nextUser);
    await AsyncStorage.setItem('nurquran-user', JSON.stringify(nextUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isGuest,
      isLoading,
      login,
      logout,
      enterAsGuest,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
