import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dynamic host resolution helper for Expo Go
const getBaseUrl = () => {
  const manifest = Constants.expoConfig || (Constants as any).manifest;
  const hostUri = manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3001`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Configure axios defaults
    axios.defaults.baseURL = getBaseUrl();

    const loadAuthState = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('nurquran-token');
        const storedUser = await AsyncStorage.getItem('nurquran-user');
        const storedGuest = await AsyncStorage.getItem('nurquran-guest') === 'true';

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else if (storedGuest) {
          setIsGuest(true);
        }
      } catch (err) {
        console.error('Error loading auth state:', err);
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
      await AsyncStorage.setItem('nurquran-token', newToken);
      await AsyncStorage.setItem('nurquran-user', JSON.stringify(newUser));
      await AsyncStorage.removeItem('nurquran-guest');
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setIsGuest(false);
    try {
      await AsyncStorage.removeItem('nurquran-token');
      await AsyncStorage.removeItem('nurquran-user');
      await AsyncStorage.removeItem('nurquran-guest');
      delete axios.defaults.headers.common['Authorization'];
    } catch (e) {
      console.error(e);
    }
  };

  const enterAsGuest = async () => {
    setIsGuest(true);
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.setItem('nurquran-guest', 'true');
      await AsyncStorage.removeItem('nurquran-token');
      await AsyncStorage.removeItem('nurquran-user');
      delete axios.defaults.headers.common['Authorization'];
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isGuest,
      isLoading,
      login,
      logout,
      enterAsGuest
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
