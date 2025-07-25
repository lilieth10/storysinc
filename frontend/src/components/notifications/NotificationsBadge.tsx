"use client";
import { useNotifications } from "@/store/notifications";

export function NotificationsBadge() {
  const { notifications, unreadCount } = useNotifications();
  const hasNotifications = notifications.length > 0;
  const hasUnread = unreadCount > 0;
  return (
    <div className="relative">
      <span className="inline-block">
        {/* Icono de campana SVG fiel al Figma */}
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="text-gray-500"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.929 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 0 1-6 0v-1m6 0H9" />
        </svg>
      </span>
      {hasNotifications && hasUnread && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-xs text-white font-bold shadow-md animate-pulse">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
