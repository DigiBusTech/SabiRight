import { supabase } from './supabase';
import Constants from 'expo-constants';

function getApiBaseUrl(): string {
  // If EXPO_PUBLIC_API_URL is explicitly set and points to an actual remote host (not localhost), use it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // When running on a physical mobile device with Expo Go, dynamically detect the host machine's IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:5000`;
    }
  }

  // Fallback to local network IP or localhost
  return envUrl || 'http://192.168.100.5:5000';
}

export const API_BASE_URL = getApiBaseUrl();

export async function apiFetch(endpoint: string, options: RequestInit & { timeoutMs?: number } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 30000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal
    });
    return response;
  } catch (err: any) {
    console.error(`[apiFetch error] Failed to fetch ${url}:`, err.message || err);
    if (err?.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error(`Cannot reach the SabiRight server (${API_BASE_URL}). Check your connection.`);
  } finally {
    clearTimeout(timer);
  }
}