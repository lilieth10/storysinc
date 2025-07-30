import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 py-8 px-4">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          // Detectar si la ruta actual coincide con el item
          const isActive =
            pathname === item.href ||
            (item.href === "/projects" && pathname.startsWith("/projects"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-green-50 transition",
                isActive && "bg-green-500 text-white font-bold",
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
