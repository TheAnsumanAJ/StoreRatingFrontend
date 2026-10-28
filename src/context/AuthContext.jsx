
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const result = response.data?.data ?? response.data;

    const token = result.token ?? result.accessToken;
    const loggedInUser =
      result.user ?? result.account ?? {
        id: result.id,
        name: result.name,
        email: result.email ?? email,
        role: result.role,
      };

    if (!token) {
      throw new Error("Login response did not contain a token.");
    }

    if (!loggedInUser.role) {
      throw new Error(
        "Login succeeded, but the user role was not returned by the backend."
      );
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    return loggedInUser;
  }

  async function signup(name, email, password, address) {
    const response = await api.post("/auth/signup", {
      name,
      email,
      password,
      address,
    });

    return response.data;
  }

  async function logout() {
    try {
      if (localStorage.getItem("token")) {
        await api.post("/auth/logout");
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }

  const value = {
    user,
    loading,
    setLoading,
    login,
    signup,
    logout,
    isAuthenticated: Boolean(user && localStorage.getItem("token")),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
