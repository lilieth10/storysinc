"use client";

import React from "react";
import Image from "next/image";

export const TargetAudience: React.FC = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Imagen ilustrativa */}
          <div className="relative">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <Image
                src="/target-audience.png"
                alt="Equipo de desarrollo trabajando"
                width={400}
                height={300}
                className="w-full h-auto object-cover rounded-lg"
              />
            </div>
          </div>
          {/* Cards de perfiles */}
          <div>
            <h2 className="text-4xl font-bold mb-8">
              ¿Para quiénes está pensada Proogia?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-lg mb-2 text-gray-900">
                  Desarrolladores frontend
                </h3>
                <p className="text-gray-600 text-sm">
                  Encargados de crear la interfaz de usuario de una aplicación
                  web o móvil.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-lg mb-2 text-gray-900">
                  Equipos de desarrollo
                </h3>
                <p className="text-gray-600 text-sm">
                  Que utilizan metodologías ágiles para desarrollar software.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-lg mb-2 text-gray-900">
                  Arquitectos y arquitectas de software
                </h3>
                <p className="text-gray-600 text-sm">
                  Que diseñan y construyen la arquitectura de software de una
                  aplicación.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-lg mb-2 text-gray-900">
                  Empresas
                </h3>
                <p className="text-gray-600 text-sm">
                  Que buscan mejorar la calidad de software y aumentar la
                  eficiencia de sus equipos de desarrollo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
