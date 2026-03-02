import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

async function storageGet(key: string): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage can be unavailable in strict/private browser modes.
  }
}

async function storageDelete(key: string): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {
    // best effort cleanup
  }
}

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

function profileFromTokens(accessToken: string, idToken?: string): UserProfile | null {
  const parsed = parseJwt(idToken ?? "") ?? parseJwt(accessToken);
  if (!parsed) return null;
  const oid = String(parsed.oid ?? parsed.objectid ?? "");
  if (!oid) return null;
  const name = String(
    parsed.name ?? parsed.preferred_username ?? parsed.upn ?? parsed.unique_name ?? "",
  );
  const email = String(parsed.preferred_username ?? parsed.upn ?? parsed.email ?? "");
  return {
    oid,
    name,
    email,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function hydrate() {
      const [storedToken, storedProfile] = await Promise.all([
        storageGet(ACCESS_TOKEN_KEY),
        storageGet(PROFILE_KEY),
      ]);
      if (storedToken) setAccessToken(storedToken);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile) as UserProfile);
      } else if (storedToken) {
        setProfile(profileFromTokens(storedToken));
      }
    }
    void hydrate();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      profile,
      async setSession(token, idToken) {
        const nextProfile = profileFromTokens(token, idToken);
        setAccessToken(token);
        setProfile(nextProfile);
        await storageSet(ACCESS_TOKEN_KEY, token);
        if (nextProfile) {
          await storageSet(PROFILE_KEY, JSON.stringify(nextProfile));
        } else {
          await storageDelete(PROFILE_KEY);
        }
      },
      async signOut() {
        setAccessToken(null);
        setProfile(null);
        await Promise.all([
          storageDelete(ACCESS_TOKEN_KEY),
          storageDelete(PROFILE_KEY),
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
