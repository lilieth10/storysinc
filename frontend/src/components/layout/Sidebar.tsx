/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FolderIcon,
  ArrowPathIcon,
  CpuChipIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/store/auth";

const navItems = [
  { label: "Proyectos", href: "/projects", icon: FolderIcon },
  { label: "Sincronización", href: "/sync", icon: ArrowPathIcon },
  { label: "Análisis de IA", href: "/ai-analysis", icon: CpuChipIcon },
  { label: "Historial de versiones", href: "/version-history", icon: ClockIcon },
  { label: "Capacitación", href: "/training", icon: AcademicCapIcon },
  { label: "Reportes", href: "/reports", icon: ChartBarIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();

  // Detectar si estamos en páginas principales donde el sidebar debe estar completo
  const isInMainPage = pathname.match(/^\/(dashboard|projects|sync|ai-analysis|version-history|training|reports)$/);
  
  // Detectar si estamos en páginas de contenido específico que necesitan más espacio
  const isInContentPage = pathname.match(/^\/projects\/\d+$/);
  
  // Auto-colapsar solo cuando estés en páginas de contenido específico
  useEffect(() => {
    if (isInContentPage) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isInContentPage]);

  const handleLogout = () => {
    logout();
  };

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col min-h-screen bg-white border-r border-gray-200 py-8 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16 px-2" : "w-64 px-4"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "mb-8 transition-all duration-300",
        isCollapsed ? "text-center" : "text-left"
      )}>
        <div className={cn(
          "font-bold text-green-600 transition-all duration-300",
          isCollapsed ? "text-2xl" : "text-xl"
        )}>
          {isCollapsed ? "P" : "Próògia"}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/projects" && pathname.startsWith("/projects"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-green-50 transition-all duration-200",
                isActive && "bg-green-500 text-white font-bold",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Cerrar sesión" : undefined}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="truncate">Cerrar sesión</span>
          )}
        </button>
      </div>
    </aside>
  );
}
