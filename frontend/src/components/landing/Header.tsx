"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { NotificationsDropdown } from "../notifications/NotificationsDropdown";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/proogia.png"
              alt="Proogia Logo"
              width={100}
              height={24}
              className="h-10 w-auto"
              priority
            />
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#beneficios"
              className="text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
              Beneficios
            </Link>
            <Link
              href="#funciones"
              className="text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
              Funciones
            </Link>
            <Link
              href="#integraciones"
              className="text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
              Integraciones
            </Link>
            <Link
              href="#contacto"
              className="text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
              Contacto
            </Link>
          </nav>

          {/* Botones */}
          <div className="flex items-center space-x-4">
            <NotificationsDropdown />
            <Link href="/register">
              <Button
                variant="outline"
                className="font-medium"
                onClick={() => {}}
              >
                Registrarse
              </Button>
            </Link>
            <Link href="/login">
              <Button
                className="bg-green-600 hover:bg-green-700 font-medium"
                onClick={() => {}}
              >
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
