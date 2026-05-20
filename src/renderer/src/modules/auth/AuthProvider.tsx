import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PublicAuthSession } from "../../../../shared/auth/auth-contract";
import type { BootstrapResult } from "../../../../shared/user-config/user-config-contract";

interface AuthContextValue {
  session: PublicAuthSession | null;
  loading: boolean;
  pendingBootstrapDiff: BootstrapResult | null;
  setSession: (session: PublicAuthSession | null) => void;
  setPendingBootstrapDiff: (result: BootstrapResult | null) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<PublicAuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingBootstrapDiff, setPendingBootstrapDiff] = useState<BootstrapResult | null>(
    null,
  );

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const s = await window.desktopAuth.getSession();
      setSession(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await window.desktopAuth.logout();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      pendingBootstrapDiff,
      setSession,
      setPendingBootstrapDiff,
      refreshSession,
      logout,
    }),
    [session, loading, pendingBootstrapDiff, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAuthSession(): Pick<AuthContextValue, "session" | "loading"> {
  const { session, loading } = useAuth();
  return { session, loading };
}
