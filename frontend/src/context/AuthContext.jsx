import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getSessionToken, setSessionToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async () => {
    try {
      const { profile } = await api.get('/auth/me');
      setProfile(profile);
    } catch {
      setSessionToken(null);
      setSession(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const token = getSessionToken();
    setSession(token);

    (async () => {
      if (token) {
        await syncProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    })();
  }, [syncProfile]);

  const completeProfile = async (payload) => {
    const { profile: savedProfile, token } = await api.post('/auth/session', payload);
    setSessionToken(token);
    setSession(token);
    setProfile(savedProfile);
    return savedProfile;
  };

  const signOut = async () => {
    setSessionToken(null);
    setSession(null);
    setProfile(null);
  };

  const value = {
    session,
    user: profile,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    completeProfile,
    signOut,
    refreshProfile: syncProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
