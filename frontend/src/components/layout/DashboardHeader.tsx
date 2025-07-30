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
    console.log("🔍 DEBUG - Toggle menu clicked");
    console.log("🔍 DEBUG - Current menu state:", menuOpen);
    console.log("🔍 DEBUG - User role:", user?.role);
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      <div className="flex items-center">
        <Image
          src="/proogia.png"
          alt="Proogia Logo"
          width={110}
          height={36}
          priority
        />
      </div>

      <div className="flex items-center gap-4">
        <NotificationsDropdown />

        {/* User Menu */}
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
              className="rounded-full border-2 border-green-500"
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  👤 Mi Perfil
                </a>
                {user?.role === "admin" && (
                  <a
                    href="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                  >
                    🛠️ Panel de Admin
                  </a>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 border-t border-gray-100"
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
