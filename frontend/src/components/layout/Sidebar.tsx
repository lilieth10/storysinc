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
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/store/auth";

const navItems = [
  { label: "Proyectos", href: "/projects", icon: FolderIcon },
  { label: "Sincronización", href: "/sync", icon: ArrowPathIcon },
  { label: "Análisis de IA", href: "/ai-analysis", icon: CpuChipIcon },
  {
    label: "Historial de versiones",
    href: "/version-history",
    icon: ClockIcon,
  },
  { label: "Capacitación", href: "/training", icon: AcademicCapIcon },
  { label: "Reportes", href: "/reports", icon: ChartBarIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout } = useAuth();

  // Detectar si estamos en páginas principales donde el sidebar debe estar completo
  const isInMainPage = pathname.match(
    /^\/(dashboard|projects|sync|ai-analysis|version-history|training|reports)$/,
  );

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

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile Menu Button - Responsive */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-3 sm:top-4 left-3 sm:left-4 z-50 p-1.5 sm:p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileOpen ? (
          <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        ) : (
          <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside
        className={cn(
          "fixed md:relative z-40 flex flex-col min-h-screen bg-white border-r border-gray-200 py-6 sm:py-8 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-14 sm:w-16 px-1 sm:px-2" : "w-56 sm:w-64 px-3 sm:px-4",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Navigation - Responsive */}
        <nav className="flex flex-col gap-1 flex-1 mt-6 sm:mt-8 md:mt-0">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/projects" && pathname.startsWith("/projects"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-gray-700 hover:bg-green-50 transition-all duration-200 text-sm sm:text-base",
                  isActive && "bg-green-500 text-black font-bold",
                  isCollapsed && "justify-center px-1 sm:px-2",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-sm sm:text-base",
              isCollapsed && "justify-center px-1 sm:px-2",
            )}
            title={isCollapsed ? "Cerrar sesión" : undefined}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
