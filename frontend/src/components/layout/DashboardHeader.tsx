import React, { useState } from "react";
import Image from "next/image";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

export function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm relative">
      <div className="flex items-center">
        <Image
          src="/proogia.png"
          alt="Proogia Logo"
          width={110}
          height={36}
          priority
        />
      </div>
      <div className="flex items-center gap-4 relative">
        <NotificationsDropdown />
        <button
          className="focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menú de usuario"
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
          <div className="absolute right-0 top-14 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 flex flex-col">
            <a
              href="/profile"
              className="px-4 py-3 hover:bg-green-50 text-gray-700 text-sm font-medium"
            >
              Perfil
            </a>
            <a
              href="/dashboard"
              className="px-4 py-3 hover:bg-green-50 text-gray-700 text-sm font-medium"
            >
              Dashboard
            </a>
            <button className="px-4 py-3 text-left hover:bg-red-50 text-gray-700 hover:text-red-600 text-sm font-medium">
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
