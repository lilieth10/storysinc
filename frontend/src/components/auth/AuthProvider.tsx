"use client";
import { useEffect } from "react";
import { useAuth } from "@/store/auth";
import { useRouter, usePathname } from "next/navigation";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, token, initialized, fetchProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Inicializar una sola vez
    if (!initialized) {
      if (token && !user) {
        fetchProfile();
      } else {
        useAuth.setState({ initialized: true });
      }
    }
  }, [token, user, initialized, fetchProfile]);

  useEffect(() => {
    if (!initialized) return;

    const publicPaths = ["/", "/login", "/register"];
    const isPublicPath = publicPaths.includes(pathname);

    // Solo redirigir si no está autenticado y no está en página pública
    if (!user && !isPublicPath) {
      router.replace("/login");
    }
  }, [user, initialized, pathname, router]);

  // Mostrar loading mientras se inicializa
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
