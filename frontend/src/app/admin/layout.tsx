"use client";
import { useAuth } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, initialized } = useAuth();
  const router = useRouter();

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (initialized && (!user || user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [user, initialized, router]);

  // Si no es admin, no renderizar nada
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="w-full">{children}</main>
    </div>
  );
}
