import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as authApi from "../api/auth";
import type { Session, User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => void;
  register: (email: string, password: string, name?: string) => Promise<User>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  getSessions: () => Promise<Session[]>;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: boolean;
  isOrganizer: boolean;
  isPrivileged: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("vf_token");
    const savedUser = localStorage.getItem("vf_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const setSession = useCallback((accessToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("vf_token", accessToken);
    localStorage.setItem("vf_user", JSON.stringify(userData));
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("vf_token");
    localStorage.removeItem("vf_user");
  }, []);

  const loginFn = useCallback(
    async (email: string, password: string): Promise<User> => {
      const res = await authApi.login(email, password);
      const { access_token, user: userData } = res.data;
      setSession(access_token, userData);
      return userData;
    },
    [setSession],
  );

  const loginWithGoogle = useCallback(() => {
    authApi.initiateGoogleLogin();
  }, []);

  const registerFn = useCallback(
    async (email: string, password: string, name?: string): Promise<User> => {
      await authApi.register(email, password, name);
      return loginFn(email, password);
    },
    [loginFn],
  );

  const logoutFn = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const logoutAllFn = useCallback(async (): Promise<void> => {
    try {
      await authApi.logoutAll();
    } catch {
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const getSessionsFn = useCallback(async (): Promise<Session[]> => {
    const res = await authApi.getSessions();
    return res.data;
  }, []);

  const updateUserFn = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("vf_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isOrganizer = user?.role === "ORGANIZER";
  const isPrivileged = isAdmin || isOrganizer;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: loginFn,
        loginWithGoogle,
        register: registerFn,
        logout: logoutFn,
        logoutAll: logoutAllFn,
        getSessions: getSessionsFn,
        updateUser: updateUserFn,
        isAdmin,
        isOrganizer,
        isPrivileged,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
