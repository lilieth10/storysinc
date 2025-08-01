"use client";

import React from "react";
import Image from "next/image";

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Beneficios principales */}
          <div>
            <h2 className="text-black text-4xl font-bold mb-6">
              Más rápido, más inteligente:
              <br />
              por qué elegir Proogia
            </h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Reduce la carga de trabajo repetitiva y mejora la eficiencia
                mediante la automatización y optimización impulsadas por IA.
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Anticipa y corrige problemas antes de que afecten la producción,
                asegurando una mayor estabilidad y calidad.
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Facilita la colaboración y el intercambio de ideas entre los
                miembros del equipo a través de herramientas de comunicación
                integradas.
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Sincroniza en tiempo real y gestiona versiones robustas
                mejorando la eficiencia y la integridad del proceso de
                desarrollo.
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Visualiza y realiza pruebas en un entorno interactivo, mejorando
                la interacción con los componentes de frontend.
              </li>
            </ul>
          </div>
          {/* Imagen hero a la derecha */}
          <div className="relative flex justify-center">
            <div className="rounded-lg overflow-hidden relative w-full max-w-md">
              <Image
                src="/hero-image.png"
                alt="Desarrollador trabajando"
                width={500}
                height={350}
                className="w-full h-auto object-cover rounded-lg"
                priority
              />
              {/* Overlay verde translúcido */}
              <div className="absolute inset-0 bg-green-600 opacity-30 rounded-lg pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
