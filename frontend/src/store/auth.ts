import { create } from "zustand";
import { api } from "@/lib/api";

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  birthdate?: string;
  address?: string;
  gender?: string;
  identityNumber?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  register: (
    data: Omit<User, "id" | "createdAt" | "avatar"> & { password: string },
  ) => Promise<boolean>;
  login: (data: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (
    data: Partial<User> & { confirmPassword?: string },
  ) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  loading: false,
  error: null,
  initialized: typeof window !== "undefined" ? false : true,

  // Cargar perfil automáticamente si hay token
  initialize: async () => {
    const token = get().token;
    if (token && !get().user) {
      await get().fetchProfile();
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.post("/auth/register", data);
      set({ loading: false });
      return true;
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      set({
        error: error.response?.data?.message || "Error al registrar",
        loading: false,
      });
      return false;
    }
  },

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", data);
      set({
        token: res.data.access_token,
        user: res.data.user,
        loading: false,
      });
      localStorage.setItem("token", res.data.access_token);
      return true;
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      set({
        error: error.response?.data?.message || "Error al iniciar sesión",
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem("token");
  },

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const token = get().token;
      if (!token) throw new Error("No autenticado");
      const res = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ user: res.data, initialized: true });
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      set({
        error: error.response?.data?.message || "Error al cargar perfil",
        user: null,
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const token = get().token;
      if (!token) throw new Error("No autenticado");
      const res = await api.put("/users/me", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ user: res.data });
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      set({
        error: error.response?.data?.message || "Error al actualizar perfil",
      });
    } finally {
      set({ loading: false });
    }
  },
}));
