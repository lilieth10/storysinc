"use client";

import React from "react";
import { Button } from "../ui/button";

export const HeroSection: React.FC = () => {
  return (
    <section className="bg-black text-white py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Sincroniza y desarrolla
          <br />
          código con precisión
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          En Proogia, crea componentes frontend de manera más eficiente en un
          entorno aislado, potenciado por inteligencia artificial.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            Crear cuenta
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white bg-transparent"
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    </section>
  );
};
