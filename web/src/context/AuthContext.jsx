import { createContext, useContext, useEffect, useState } from "react";
import api, { tokenStorage } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStorage.get()));

  // Saat aplikasi dibuka, cek apakah token lama masih berlaku
  useEffect(() => {
    if (!tokenStorage.get()) return;
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  function saveSession({ user, token }) {
    tokenStorage.set(token);
    setUser(user);
    return user;
  }

  const value = {
    user,
    loading,
    login: async (email, password) => saveSession((await api.post("/auth/login", { email, password })).data),
    register: async (data) => saveSession((await api.post("/auth/register", data)).data),
    logout: () => {
      tokenStorage.clear();
      setUser(null);
    },
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
