import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";

const navItems = [
  { label: "Proyectos", href: "/projects", icon: "📁" },
  { label: "Sincronización", href: "/sync", icon: "🔄" },
  { label: "Análisis de IA", href: "/ai-analysis", icon: "🤖" },
  { label: "Historial de versiones", href: "/version-history", icon: "🕑" },
  { label: "Capacitación", href: "/training", icon: "🎓" },
  { label: "Reportes", href: "/reports", icon: "📊" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    router.replace("/");
  };
  
  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 py-8 px-4">
      <nav className="flex flex-col gap-1 mb-2">
        {navItems.map((item) => {
          // Solo resaltar el item activo basado en la ruta exacta
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-green-50 transition",
                isActive && "bg-green-100 text-green-700 font-bold",
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium transition mt-auto"
      >
        <span className="text-xl">🚪</span>
        Cerrar sesión
      </button>
    </aside>
  );
}
