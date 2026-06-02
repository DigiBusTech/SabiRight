import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      if (user) {
        // Real-time profile sync
        const unsubscribeProfile = onSnapshot(doc(db, 'profiles', user.uid), (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data());
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile sync error:", error);
          setLoading(false);
        });
        
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
