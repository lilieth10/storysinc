/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { useState } from "react";

export default function AIAnalysisPage() {
  const [selectedProject, setSelectedProject] = useState("E-commerce React");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">STORYSINC</h1>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar simple */}
        <div className="w-64 bg-white shadow-sm h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              <a
                href="/dashboard"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Dashboard
              </a>
              <a
                href="/projects"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Proyectos
              </a>
              <a
                href="/sync"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Sincronización
              </a>
              <a
                href="/ai-analysis"
                className="block px-3 py-2 text-sm bg-green-500 text-white rounded"
              >
                Análisis de IA
              </a>
            </nav>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-bold uppercase">
                Implementación IA
              </h1>
            </div>
          </div>
          <div className="bg-blue-600 text-white">
            <div className="px-6 py-2">
              <h2 className="text-xl font-bold uppercase">ANÁLISIS DE IA</h2>
            </div>
          </div>

          <div className="flex-1 bg-white p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">
                  Análisis de Código
                </h3>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option>Archivo.js</option>
                  <option>Componente.tsx</option>
                  <option>Servicio.ts</option>
                </select>

                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="font-medium text-yellow-800">
                      Optimización Sugerida
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Considera usar React.memo para el componente ProductCard
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-800">Seguridad</h4>
                    <p className="text-sm text-blue-700">
                      Validar inputs en el endpoint /api/cart
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="font-medium text-green-800">
                      Buenas Prácticas
                    </h4>
                    <p className="text-sm text-green-700">
                      Código bien estructurado y legible
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">
                  Resultado del Análisis
                </h3>
                <div className="bg-white rounded border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="text-green-600 font-medium">
                      ✓ Sin errores críticos
                    </span>
                  </div>

                  <div className="font-mono text-sm space-y-1">
                    <div>function generateRandomString() {}</div>
                    <div className="ml-4">const chars = 'ABC...';</div>
                    <div className="ml-4">let result = '';</div>
                    <div className="ml-4">
                      for (let i = 0; i &lt; 8; i++) {}
                    </div>
                    <div className="ml-8">result += chars.charAt(...);</div>
                    <div className="ml-4">return result;</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Uso de CPU</h4>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">65%</span>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Uso de Memoria
                </h4>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">45%</span>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Tiempo de Respuesta
                </h4>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: "78%" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">78%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer simple */}
      <div className="bg-gray-100 border-t">
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">
            © 2024 STORYSINC. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
