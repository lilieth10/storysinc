"use client";

import React from "react";
import { Card, CardContent } from "../ui/card";
import { Code2, Eye, Brain, Clock } from "lucide-react";

export const FeaturesGrid: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16">
          Eleva tus componentes frontend al siguiente nivel
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Clock className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-bold mb-2">Sincronización en tiempo real</h3>
              <p className="text-gray-600 text-sm">
                Implementa patrones de diseño avanzados y mantén tu código
                sincronizado con una infraestructura que soporta la concurrencia
                y la colaboración.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Code2 className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-bold mb-2">Gestión de versiones</h3>
              <p className="text-gray-600 text-sm">
                Mantén la integridad de tu código mediante un sistema de control
                de cambios, garantizando que esté siempre actualizado y seguro.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Eye className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-bold mb-2">Visualización en frontend</h3>
              <p className="text-gray-600 text-sm">
                Encuentra los componentes de tu aplicación de manera visual, una
                mejor interacción y prueba de los elementos.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Brain className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-bold mb-2">Recomendaciones con IA</h3>
              <p className="text-gray-600 text-sm">
                Analiza las capas de uso con IA y obtén sugerencias de
                optimización, optimizando así el proceso de desarrollo y la
                calidad del código final.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
