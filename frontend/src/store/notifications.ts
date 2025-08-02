/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "zustand";
import { Notification } from "@/types";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  socket: Socket | null;
  loading: boolean;
  error: string | null;
  fetchNotifications: (token: string) => Promise<void>;
  connectSocket: (userId: number, token: string) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number, token: string) => Promise<void>;
  deleteNotification: (id: number, token: string) => Promise<void>;
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  loading: false,
  error: null,

  fetchNotifications: async (token) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<Notification[]>("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({
        notifications: res.data,
        unreadCount: res.data.filter((n) => !n.read).length,
        loading: false,
      });
    } catch (e: unknown) {
      set({ error: "Error al cargar notificaciones", loading: false });
    }
  },

  connectSocket: (userId, token) => {
    if (get().socket) return; // Ya conectado
    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      {
        query: { userId },
        auth: { token },
        transports: ["websocket"],
      },
    );
    socket.on("notification", (notification: Notification) => {
      get().addNotification(notification);
      
      // Show beautiful toast instead of ugly notification
      if (notification.type === 'success') {
        toast.success(`✅ ${notification.title}: ${notification.message}`);
      } else if (notification.type === 'error') {
        toast.error(`❌ ${notification.title}: ${notification.message}`);
      } else if (notification.type === 'warning') {
        toast(`⚠️ ${notification.title}: ${notification.message}`, {
          icon: '⚠️',
          style: { background: '#fff3cd', color: '#856404' }
        });
      } else {
        toast(`📢 ${notification.title}: ${notification.message}`, {
          icon: '📢',
          style: { background: '#d1ecf1', color: '#0c5460' }
        });
      }
    });
    set({ socket });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (!notification.read ? 1 : 0),
    }));
  },

  markAsRead: async (id, token) => {
    try {
      await api.patch(
        `/notifications/${id}/read?read=true`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: state.notifications.filter((n) => !n.read && n.id !== id)
          .length,
      }));
    } catch (e) {
      set({ error: "Error al marcar como leída" });
    }
  },

  deleteNotification: async (id, token) => {
    try {
      await api.delete(`/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.filter((n) => !n.read && n.id !== id)
          .length,
      }));
    } catch (e) {
      set({ error: "Error al eliminar notificación" });
    }
  },
}));
