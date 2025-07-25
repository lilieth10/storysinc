"use client";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { api } from "@/lib/api";
import { AILoader } from "@/components/ui/ai-loader";
import toast from "react-hot-toast";

interface Report {
  id: number;
  type: string;
  title: string;
  description?: string;
  metrics: string;
  iaResults: string;
  dateRange: string;
  createdAt: string;
  fileUrl?: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports");
      setReports(res.data);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "performance": return "Rendimiento";
      case "security": return "Seguridad";
      case "quality": return "Calidad de Código";
      case "analytics": return "Análisis de IA";
      default: return type;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case "performance": return "bg-blue-100 text-blue-800";
      case "security": return "bg-red-100 text-red-800";
      case "quality": return "bg-green-100 text-green-800";
      case "analytics": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AILoader size="lg" text="Cargando reportes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Reportes
              </h1>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Filtros
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Reporte
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Todos los tipos</option>
                    <option value="performance">Rendimiento</option>
                    <option value="security">Seguridad</option>
                    <option value="quality">Calidad de Código</option>
                    <option value="analytics">Análisis de IA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Fechas
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Todos los períodos</option>
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="90d">Últimos 90 días</option>
                    <option value="1y">Último año</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="createdAt">Fecha de creación</option>
                    <option value="title">Título</option>
                    <option value="type">Tipo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de reportes */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reportes Generados
                </h2>
              </div>
              {reports.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No hay reportes generados</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <div key={report.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {report.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.type)}`}>
                              {getReportTypeLabel(report.type)}
                            </span>
                          </div>
                          {report.description && (
                            <p className="text-gray-600 mb-2">{report.description}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            Generado el {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
} 