/// <reference types="react-native" />

declare module '*.css';

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_API_URL?: string;
    [key: string]: string | undefined;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};



