// import { createContext, useContext, useEffect, useState } from "react";

// const AuthContext = createContext(null);
// const STORAGE_KEY = "vega:auth";

// function readStore() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     return raw ? JSON.parse(raw) : { users: [], session: null };
//   } catch {
//     return { users: [], session: null };
//   }
// }

// function writeStore(data) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
// }

// export function AuthProvider({ children }) {
//   const [store, setStore] = useState(readStore);

//   useEffect(() => writeStore(store), [store]);

//   const currentUser = store.users.find((u) => u.email === store.session) || null;

//   function signUp({ name, email, password }) {
//     if (store.users.some((u) => u.email === email)) {
//       return { ok: false, error: "An account with that email already exists." };
//     }
//     const user = {
//       name,
//       email,
//       password, // NOTE: demo-only. Never store plaintext passwords in production.
//       plan: "starter",
//       createdAt: new Date().toISOString(),
//     };
//     setStore((s) => ({ users: [...s.users, user], session: email }));
//     return { ok: true };
//   }

//   // ✅ UPDATED: Accept user data from API
//   function signIn(userData) {
//     // If userData has email and password (local login)
//     if (userData.email && userData.password) {
//       const user = store.users.find((u) => u.email === userData.email);
//       if (!user || user.password !== userData.password) {
//         return { ok: false, error: "Incorrect email or password." };
//       }
//       setStore((s) => ({ ...s, session: userData.email }));
//       return { ok: true };
//     }
    
//     // ✅ NEW: If userData is from API (has token and user object)
//     if (userData.token && userData.user) {
//       // Check if user exists in local store, if not add them
//       const existingUser = store.users.find((u) => u.email === userData.user.email);
//       if (!existingUser) {
//         setStore((s) => ({
//           ...s,
//           users: [...s.users, {
//             name: userData.user.name,
//             email: userData.user.email,
//             password: "api_user", // Placeholder for API users
//             plan: userData.user.plan || "starter",
//             createdAt: new Date().toISOString(),
//           }],
//           session: userData.user.email
//         }));
//       } else {
//         setStore((s) => ({ ...s, session: userData.user.email }));
//       }
//       return { ok: true };
//     }
    
//     return { ok: false, error: "Invalid login data" };
//   }

//   function signOut() {
//     setStore((s) => ({ ...s, session: null }));
//     localStorage.removeItem("authToken"); // ✅ Also remove token
//   }

//   function setPlan(plan) {
//     setStore((s) => ({
//       ...s,
//       users: s.users.map((u) => (u.email === s.session ? { ...u, plan } : u)),
//     }));
//   }

//   return (
//     <AuthContext.Provider
//       value={{ user: currentUser, isAuthenticated: !!currentUser, signUp, signIn, signOut, setPlan }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }


import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

const AuthContext = createContext(null);

// Constants
const STORAGE_KEY = "vega:auth";
const TOKEN_KEY = "authToken";
const USER_KEY = "userData";

// Storage helpers
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

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getUserData() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setUserData(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }) {
  // Initialize state from localStorage
  const [store, setStore] = useState(readStore);
  const [token, setTokenState] = useState(getToken);
  const [loading, setLoading] = useState(true);

  // Sync store to localStorage
  useEffect(() => {
    writeStore(store);
  }, [store]);

  // Sync token to localStorage
  useEffect(() => {
    setToken(token);
  }, [token]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = getUserData();
    const savedToken = getToken();
    
    if (savedUser && savedToken) {
      // Check if user exists in store
      const userExists = store.users.some((u) => u.email === savedUser.email);
      if (!userExists) {
        setStore((s) => ({
          ...s,
          users: [...s.users, {
            name: savedUser.name,
            email: savedUser.email,
            password: "api_user",
            plan: savedUser.plan || "starter",
            createdAt: savedUser.createdAt || new Date().toISOString(),
          }],
          session: savedUser.email
        }));
      } else {
        setStore((s) => ({ ...s, session: savedUser.email }));
      }
      setTokenState(savedToken);
    }
    setLoading(false);
  }, []);

  // Memoized current user
  const currentUser = useMemo(() => {
    return store.users.find((u) => u.email === store.session) || null;
  }, [store.users, store.session]);

  // Check if authenticated
  const isAuthenticated = useMemo(() => {
    return !!currentUser && !!token;
  }, [currentUser, token]);

  // Sign Up
  const signUp = useCallback(({ name, email, password }) => {
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
    setTokenState("local_demo_token"); // Demo token for local auth
    
    return { ok: true };
  }, [store.users]);

  // Sign In - Updated to handle API responses
  const signIn = useCallback((userData) => {
    // Case 1: Local login with email/password
    if (userData.email && userData.password) {
      const user = store.users.find((u) => u.email === userData.email);
      if (!user || user.password !== userData.password) {
        return { ok: false, error: "Incorrect email or password." };
      }
      
      setStore((s) => ({ ...s, session: userData.email }));
      setTokenState("local_demo_token");
      setUserData(user);
      
      return { ok: true };
    }
    
    // Case 2: API login with token and user object
    if (userData.token && userData.user) {
      const apiUser = userData.user;
      
      // Check if user exists in local store
      const existingUser = store.users.find((u) => u.email === apiUser.email);
      
      if (!existingUser) {
        setStore((s) => ({
          ...s,
          users: [...s.users, {
            name: apiUser.name,
            email: apiUser.email,
            password: "api_user",
            plan: apiUser.plan || apiUser.subscription?.plan || "starter",
            createdAt: apiUser.createdAt || new Date().toISOString(),
          }],
          session: apiUser.email
        }));
      } else {
        setStore((s) => ({ ...s, session: apiUser.email }));
      }
      
      // Store token and user data
      setTokenState(userData.token);
      setUserData(apiUser);
      
      return { ok: true };
    }
    
    return { ok: false, error: "Invalid login data" };
  }, [store.users]);

  // Sign Out
  const signOut = useCallback(() => {
    setStore((s) => ({ ...s, session: null }));
    setTokenState(null);
    setUserData(null);
  }, []);

  // Update Plan
  const setPlan = useCallback((plan) => {
    setStore((s) => ({
      ...s,
      users: s.users.map((u) => (u.email === s.session ? { ...u, plan } : u)),
    }));
    
    // Update stored user data
    const storedUser = getUserData();
    if (storedUser) {
      setUserData({ ...storedUser, plan });
    }
  }, []);

  // Refresh token from localStorage (useful for multi-tab sync)
  const refreshToken = useCallback(() => {
    const newToken = getToken();
    if (newToken !== token) {
      setTokenState(newToken);
    }
  }, [token]);

  // Memoized context value
  const value = useMemo(() => ({
    user: currentUser,
    token,
    isAuthenticated,
    loading,
    signUp,
    signIn,
    signOut,
    setPlan,
    refreshToken
  }), [currentUser, token, isAuthenticated, loading, signUp, signIn, signOut, setPlan, refreshToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook with error handling
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// Helper hook for protected routes
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate(); // If using react-router
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);
  
  return { isAuthenticated, loading };
}