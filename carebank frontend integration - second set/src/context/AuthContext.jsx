import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "vega:auth";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { users: [], session: null };
  } catch {
    return { users: [], session: null };
  }
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function AuthProvider({ children }) {
  const [store, setStore] = useState(readStore);

  useEffect(() => writeStore(store), [store]);

  const currentUser = store.users.find((u) => u.email === store.session) || null;

  function signUp({ name, email, password }) {
    if (store.users.some((u) => u.email === email)) {
      return { ok: false, error: "An account with that email already exists." };
    }
    const user = {
      name,
      email,
      password, // NOTE: demo-only. Never store plaintext passwords in production.
      plan: "starter",
      createdAt: new Date().toISOString(),
    };
    setStore((s) => ({ users: [...s.users, user], session: email }));
    return { ok: true };
  }

  // ✅ UPDATED: Accept user data from API
  function signIn(userData) {
    // If userData has email and password (local login)
    if (userData.email && userData.password) {
      const user = store.users.find((u) => u.email === userData.email);
      if (!user || user.password !== userData.password) {
        return { ok: false, error: "Incorrect email or password." };
      }
      setStore((s) => ({ ...s, session: userData.email }));
      return { ok: true };
    }
    
    // ✅ NEW: If userData is from API (has token and user object)
    if (userData.token && userData.user) {
      // Check if user exists in local store, if not add them
      const existingUser = store.users.find((u) => u.email === userData.user.email);
      if (!existingUser) {
        setStore((s) => ({
          ...s,
          users: [...s.users, {
            name: userData.user.name,
            email: userData.user.email,
            password: "api_user", // Placeholder for API users
            plan: userData.user.plan || "starter",
            createdAt: new Date().toISOString(),
          }],
          session: userData.user.email
        }));
      } else {
        setStore((s) => ({ ...s, session: userData.user.email }));
      }
      return { ok: true };
    }
    
    return { ok: false, error: "Invalid login data" };
  }

  function signOut() {
    setStore((s) => ({ ...s, session: null }));
    localStorage.removeItem("authToken"); // ✅ Also remove token
  }

  function setPlan(plan) {
    setStore((s) => ({
      ...s,
      users: s.users.map((u) => (u.email === s.session ? { ...u, plan } : u)),
    }));
  }

  return (
    <AuthContext.Provider
      value={{ user: currentUser, isAuthenticated: !!currentUser, signUp, signIn, signOut, setPlan }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}