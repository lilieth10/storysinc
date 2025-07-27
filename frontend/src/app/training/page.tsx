"use client";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";

export default function TrainingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-blue-600 text-white px-8 py-6 rounded-lg mb-8">
              <h1 className="text-3xl font-bold">CAPACITACIÓN</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Contenido de Capacitación
              </h2>
              <p className="text-gray-600">
                Aquí encontrarás recursos de capacitación para el uso de la
                plataforma.
              </p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
