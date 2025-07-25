"use client";
import { useEffect } from "react";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";

export function NotificationsProvider() {
  const { user, token } = useAuth();
  const { fetchNotifications, connectSocket } = useNotifications();

  useEffect(() => {
    if (user && token) {
      fetchNotifications(token);
      connectSocket(user.id, token);
    }
  }, [user, token, fetchNotifications, connectSocket]);

  return null;
}
