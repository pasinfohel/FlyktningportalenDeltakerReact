import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { decode } from "base-64";
import { UserProfile } from "../types/domain";

type AuthState = {
  accessToken: string | null;
  profile: UserProfile | null;
  setSession: (accessToken: string, idToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const ACCESS_TOKEN_KEY = "fp_access_token";
const PROFILE_KEY = "fp_profile";

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decode(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function profileFromIdToken(idToken?: string): UserProfile | null {
  if (!idToken) return null;
  const parsed = parseJwt(idToken);
  if (!parsed) return null;
  return {
    oid: String(parsed.oid ?? ""),
    name: String(parsed.name ?? ""),
    email: String(parsed.preferred_username ?? parsed.upn ?? ""),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function hydrate() {
      const [storedToken, storedProfile] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(PROFILE_KEY),
      ]);
      if (storedToken) setAccessToken(storedToken);
      if (storedProfile) setProfile(JSON.parse(storedProfile) as UserProfile);
    }
    void hydrate();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      profile,
      async setSession(token, idToken) {
        const nextProfile = profileFromIdToken(idToken);
        setAccessToken(token);
        setProfile(nextProfile);
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
        if (nextProfile) {
          await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(nextProfile));
        }
      },
      async signOut() {
        setAccessToken(null);
        setProfile(null);
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.deleteItemAsync(PROFILE_KEY),
        ]);
      },
    }),
    [accessToken, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
