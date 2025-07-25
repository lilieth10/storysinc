"use client";
import { useNotifications } from "@/store/notifications";
import { useAuth } from "@/store/auth";

export function NotificationsList() {
  const { notifications, markAsRead, deleteNotification, loading, error } =
    useNotifications();
  const { token } = useAuth();

  if (loading)
    return <div className="p-4 text-gray-500">Cargando notificaciones...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (notifications.length === 0)
    return <div className="p-4 text-gray-400">No tienes notificaciones.</div>;

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4 flex flex-col gap-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition border ${n.read ? "bg-gray-50 border-gray-200" : "bg-green-50 border-green-200 shadow-sm"}`}
        >
          {/* Icono tipo notificación */}
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="text-green-600"
            >
              <path d="M12 20h.01M8 4h8m-4 0v16" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              {n.title}
            </div>
            <div className="text-xs text-gray-500 truncate">{n.message}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </div>
          </div>
          {!n.read && token && (
            <button
              className="ml-2 text-xs text-green-600 font-bold hover:underline"
              onClick={() => markAsRead(n.id, token)}
              title="Marcar como leída"
            >
              ●
            </button>
          )}
          {token && (
            <button
              className="ml-2 text-xs text-gray-400 hover:text-red-500"
              onClick={() => deleteNotification(n.id, token)}
              title="Eliminar"
            >
              🗑️
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
