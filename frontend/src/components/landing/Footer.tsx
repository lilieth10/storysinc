import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[#E9F9EC] text-gray-900 font-['Roboto'] pt-4 pb-2">
      <div className="max-w-7xl mx-auto flex flex-row items-start justify-between px-6">
        {/* Logo alineado a la izquierda */}
        <div className="flex flex-col items-start justify-start min-w-[140px]">
          <Image
            src="/proogia.png"
            alt="Proogia"
            width={150}
            height={150}
            className="mb-2"
            priority
          />
        </div>
        {/* Enlaces en tres columnas centradas */}
        <div className="flex flex-1 flex-row justify-center gap-16">
          <div className="flex flex-col min-w-[120px] items-center">
            <span className="font-bold mb-2">Servicios</span>
            <Link href="#" className="mb-1 hover:underline">
              Beneficios
            </Link>
            <Link href="#" className="mb-1 hover:underline">
              Funciones
            </Link>
            <Link href="#" className="mb-1 hover:underline">
              Integraciones
            </Link>
          </div>
          <div className="flex flex-col min-w-[120px] items-center">
            <span className="font-bold mb-2">Sobre nosotros</span>
            <Link href="#" className="mb-1 hover:underline">
              La plataforma
            </Link>
            <Link href="#" className="mb-1 hover:underline">
              Contacto
            </Link>
          </div>
          <div className="flex flex-col min-w-[120px] items-center">
            <span className="font-bold mb-2">Legales</span>
            <Link href="#" className="mb-1 hover:underline">
              Términos y condiciones
            </Link>
            <Link href="#" className="mb-1 hover:underline">
              Política de privacidad
            </Link>
          </div>
        </div>
      </div>
      {/* Copyright */}
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-gray-700 text-xs text-center mt-2 pb-1">
          Copyright 0000 Nombre all rights reserved
        </p>
      </div>
    </footer>
  );
}
