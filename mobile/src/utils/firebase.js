import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Standard Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBrtOCOwXp8UloT0nDqzQDpZpHgtrJUQBs",
    authDomain: "legal-13d13.firebaseapp.com",
    projectId: "legal-13d13",
    storageBucket: "legal-13d13.appspot.com",
    messagingSenderId: "482238213242",
    appId: "1:482238213242:web:435d5002b58d97b3349fc3"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// In React Native, we MUST use initializeAuth with persistence
let auth;

try {
  // Always try to initialize with persistence first
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get the existing instance
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
