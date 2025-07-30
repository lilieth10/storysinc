import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[#E9F9EC] text-gray-900 font-['Roboto'] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Contenido principal del footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo y descripción */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <Image
                src="/proogia.png"
                alt="Proogia"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              Plataforma integral para el desarrollo y análisis de proyectos con inteligencia artificial.
            </p>
          </div>

          {/* Servicios */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Servicios</h3>
            <div className="space-y-2">
              <Link 
                href="#" 
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                Beneficios
              </Link>
              <Link 
                href="#" 
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                Funciones
              </Link>
              <Link 
                href="#" 
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                Integraciones
              </Link>
            </div>
          </div>

          {/* Sobre nosotros */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Sobre nosotros</h3>
            <div className="space-y-2">
              <Link 
                href="#" 
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                La plataforma
              </Link>
              <Link 
                href="#" 
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                Contacto
              </Link>
            </div>
          </div>

          {/* Legales */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Legales</h3>
            <div className="space-y-2">
              <Link 
                href="#" 
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                Términos y condiciones
              </Link>
              <Link 
                href="#" 
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                Política de privacidad
              </Link>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-500 text-xs text-center sm:text-left">
              Copyright © 2024 Proogia. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6">
              <Link 
                href="#" 
                className="text-gray-500 hover:text-green-600 transition-colors duration-200 text-xs"
              >
                Cookies
              </Link>
              <Link 
                href="#" 
                className="text-gray-500 hover:text-green-600 transition-colors duration-200 text-xs"
              >
                Mapa del sitio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
