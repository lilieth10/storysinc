import React, { useState } from "react";
import Image from "next/image";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useAuth } from "@/store/auth";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const toggleMenu = () => {

    setMenuOpen(!menuOpen);
  };

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white shadow-sm">
      <div className="flex items-center">
        <Image
          src="/proogia.png"
          alt="Proogia Logo"
          width={110}
          height={36}
          priority
          className="w-20 sm:w-24 lg:w-28"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:block">
          <NotificationsDropdown />
        </div>

        {/* User Menu - Responsive */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleMenu}
            className="flex items-center focus:outline-none"
          >
            <Image
              src="/avatar.png"
              alt="Avatar"
              width={36}
              height={36}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-green-500"
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                <a
                  href="/dashboard"
                  className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                >
                  📊 <span className="hidden sm:inline">Dashboard</span><span className="sm:hidden">Dashboard</span>
                </a>
                <a
                  href="/profile"
                  className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                >
                  👤 <span className="hidden sm:inline">Mi Perfil</span><span className="sm:hidden">Perfil</span>
                </a>
                {user?.role === "admin" && (
                  <a
                    href="/admin"
                    className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                  >
                    🛠️ <span className="hidden sm:inline">Panel de Admin</span><span className="sm:hidden">Admin</span>
                  </a>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 border-t border-gray-100"
                >
                  🚪 <span className="hidden sm:inline">Cerrar sesión</span><span className="sm:hidden">Salir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
