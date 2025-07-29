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
    <div className="w-full bg-white rounded-xl p-4 flex flex-col gap-3">
      <div className="border-b border-gray-200 pb-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">Notificaciones</h3>
      </div>
      <div className="max-h-96 overflow-y-auto space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-4 rounded-lg p-4 transition-all ${
              n.read 
                ? "bg-gray-50 border border-gray-200" 
                : "bg-green-50 border-l-4 border-l-green-500 shadow-sm"
            }`}
          >
            {/* Icono con campana */}
            <div className="relative flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="text-green-600"
                >
                  <path d="M12 20h.01M8 4h8m-4 0v16" />
                </svg>
              </div>
              {/* Campana pequeña en la esquina */}
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24" className="text-white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-base mb-1">
                {n.title}
              </div>
              <div className="text-sm text-gray-600 mb-2 leading-relaxed">
                {n.message}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleDateString('es-ES', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            
            {/* Punto naranja para no leídas */}
            {!n.read && (
              <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
            )}
            
            {/* Botones de acción */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {!n.read && token && (
                <button
                  className="text-sm text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                  onClick={() => markAsRead(n.id, token)}
                  title="Marcar como leída"
                >
                  ✓
                </button>
              )}
              {token && (
                <button
                  className="text-sm text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                  onClick={() => deleteNotification(n.id, token)}
                  title="Eliminar"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
