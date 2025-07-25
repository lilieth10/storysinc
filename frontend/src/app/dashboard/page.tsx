
"use client";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { api } from "@/lib/api";
import { AILoader } from "@/components/ui/ai-loader";
import toast from "react-hot-toast";

interface DashboardMetrics {
  subscriptions: {
    categories: string[];
    Gratis: number[];
    Basico: number[];
    Pro: number[];
    Empresa: number[];
  };
  resources: {
    labels: string[];
    values: number[];
  };
}

interface Report {
  id: number;
  type: string;
  title: string;
  metrics: string;
  iaResults: string;
  dateRange: string;
  createdAt: string;
  fileUrl?: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar métricas del dashboard
      const metricsRes = await api.get("/dashboard/metrics");
      setMetrics(metricsRes.data);

      // Cargar reportes recientes
      const reportsRes = await api.get("/reports/metrics", {
        params: { limit: 5 },
      });
      setReports(reportsRes.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AILoader size="lg" text="Cargando dashboard..." />
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
                Dashboard
              </h1>
            </div>
            
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Proyectos Activos
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {metrics?.subscriptions?.Gratis?.[5] || 12}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Reportes Generados
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {reports.length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Análisis IA
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {metrics?.subscriptions?.Pro?.[5] || 24}
                </p>
              </div>
            </div>

            {/* Gráfico de recursos */}
            {metrics && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Uso de Recursos
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {metrics.resources.labels.map((label, index) => (
                    <div key={label} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {metrics.resources.values[index]}%
                      </div>
                      <div className="text-sm text-gray-600">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reportes recientes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Reportes Recientes
              </h2>
              {reports.length === 0 ? (
                <p className="text-gray-500">No hay reportes recientes</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
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