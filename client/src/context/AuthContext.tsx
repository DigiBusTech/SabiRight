import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  switchVendorMode: (mode: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null,
  loading: true,
  switchVendorMode: async () => {},
  refreshProfile: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (sbUser: any, token?: string) => {
    if (!sbUser) return null;
    return {
      ...sbUser,
      uid: sbUser.id,
      displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.displayName || sbUser.email?.split('@')[0],
      getIdToken: async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || token || '';
      }
    };
  };

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const normUser = normalizeUser(session.user, session.access_token);
        setUser(normUser);
        await fetchProfile(normUser.uid, session.access_token, normUser.email, normUser.displayName);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // 2. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const normUser = normalizeUser(session.user, session.access_token);
        setUser(normUser);
        await fetchProfile(normUser.uid, session.access_token, normUser.email, normUser.displayName);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, token: string, email?: string, displayName?: string) => {
    try {
      let res = await fetch(`/api/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let data = res.ok ? await res.json() : null;
      
      if (!data || !data.userId) {
        res = await fetch(`/api/profile/${userId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: email,
            displayName: displayName || email?.split('@')[0]
          })
        });
        data = res.ok ? await res.json() : null;
      }
      
      setProfile(data);
    } catch (error) {
      console.error("[AuthContext] Failed to fetch profile:", error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/profile/${user.uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, switchVendorMode, refreshProfile, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

