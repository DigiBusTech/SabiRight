import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

// Replace with your project Supabase credentials or pass via environment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://njtwsuwlxbfxvzbmsrzr.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdHdzdXdseGJmeHZ6Ym1zcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzQ3NjYsImV4cCI6MjEwNjcxMDc2Nn0.x9SgIrKbm6Nt40rO8hIjRSqe3OuIPecX0pj97x1Jq7U";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS !== 'web' ? ExpoSecureStoreAdapter : localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
