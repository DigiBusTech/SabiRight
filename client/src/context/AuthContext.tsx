import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  switchVendorMode: (mode: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null,
  loading: true,
  switchVendorMode: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        let res = await fetch(`/api/profile/${user.uid}`);
        let data = res.ok ? await res.json() : null;
        
        if (!data || !data.userId) {
          res = await fetch(`/api/profile/${user.uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0]
            })
          });
          data = res.ok ? await res.json() : null;
        }
        
        setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const switchVendorMode = async (mode: boolean) => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch('/api/vendor/self/mode', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ vendorMode: mode })
    });
    if (res.ok) {
      setProfile((prev: any) => ({ ...prev, vendorMode: mode }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, switchVendorMode }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
