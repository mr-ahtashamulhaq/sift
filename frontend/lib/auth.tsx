import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, UserProfile } from "./types";
import { login as apiLogin, register as apiRegister, getProfile } from "./api";

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await getProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  // Rehydrate on mount
  useEffect(() => {
    const token = localStorage.getItem("sb_token");
    const stored = localStorage.getItem("sb_user");
    if (token && stored) {
      try {
        const u = JSON.parse(stored) as User;
        setUser(u);
        loadProfile().finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    const u: User = { id: data.user.id, email: data.user.email };
    localStorage.setItem("sb_token", data.access_token);
    if (data.refresh_token) localStorage.setItem("sb_refresh", data.refresh_token);
    localStorage.setItem("sb_user", JSON.stringify(u));
    setUser(u);
    await loadProfile();
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const data = await apiRegister(email, password, displayName);
    // After register, auto-login
    if (data.access_token) {
      const u: User = { id: data.user.id, email: data.user.email };
      localStorage.setItem("sb_token", data.access_token);
      localStorage.setItem("sb_user", JSON.stringify(u));
      setUser(u);
      await loadProfile();
    }
  };

  const logout = () => {
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_refresh");
    localStorage.removeItem("sb_user");
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = loadProfile;

  return (
    <Ctx.Provider value={{ user, profile, loading, login, register, logout, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
