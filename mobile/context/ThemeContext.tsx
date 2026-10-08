import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceCard: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  tabBarBg: string;
  tabBarBorder: string;
  inputBg: string;
  inputBorder: string;
}

const darkColors: ThemeColors = {
  background: '#020617',
  surface: '#0a0f1d',
  surfaceCard: '#0f172a',
  surfaceBorder: '#1e293b',
  textPrimary: '#ffffff',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  primary: '#38bdf8',
  primarySoft: 'rgba(56, 189, 248, 0.15)',
  accent: '#facc15',
  accentSoft: 'rgba(250, 204, 21, 0.15)',
  danger: '#ef4444',
  dangerSoft: 'rgba(239, 68, 68, 0.15)',
  success: '#10b981',
  successSoft: 'rgba(16, 185, 129, 0.15)',
  tabBarBg: '#0a0f1d',
  tabBarBorder: '#1e293b',
  inputBg: '#020617',
  inputBorder: '#1e293b',
};

const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceCard: '#ffffff',
  surfaceBorder: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  primary: '#0284c7',
  primarySoft: 'rgba(2, 132, 199, 0.12)',
  accent: '#d97706',
  accentSoft: 'rgba(217, 119, 6, 0.12)',
  danger: '#dc2626',
  dangerSoft: 'rgba(220, 38, 38, 0.12)',
  success: '#059669',
  successSoft: 'rgba(5, 150, 105, 0.12)',
  tabBarBg: '#ffffff',
  tabBarBorder: '#e2e8f0',
  inputBg: '#f1f5f9',
  inputBorder: '#cbd5e1',
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'sabiright_mobile_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        setMode(saved);
      }
    });
  }, []);

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  const isDark = mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
