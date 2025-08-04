"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

// Importar ApexCharts dinámicamente para evitar errores de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

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

interface DashboardMetrics {
  projects: {
    total: number;
    active: number;
    byPattern: Record<string, number>;
    byLanguage: Record<string, number>;
  };
  collaboration: {
    totalCollaborators: number;
    totalCollaborations: number;
    byRole: Record<string, number>;
  };
  sync: {
    totalSyncs: number;
    successfulSyncs: number;
    byType: Record<string, number>;
  };
  ai: {
    totalAnalyses: number;
    optimizationsApplied: number;
    byType: Record<string, number>;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [, setReports] = useState<Report[]>([]);

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

  const generateReport = async () => {
    try {
      setGeneratingReport(true);

      // Simular generación de reporte con IA
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await api.post("/reports", {
        type: "dashboard",
        title: "Reporte de rendimiento",
        description: "Análisis completo del rendimiento de la plataforma",
        metrics: {
          projects: metrics?.projects || {},
          collaboration: metrics?.collaboration || {},
          sync: metrics?.sync || {},
          ai: metrics?.ai || {},
        },
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      });

      toast.success("Reporte generado exitosamente");
      router.push("/reports"); // Redirigir a reportes
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error al generar el reporte");
    } finally {
      setGeneratingReport(false);
    }
  };

  // Configuración del gráfico de proyectos por patrón
  const projectsChartOptions = {
    chart: {
      type: "bar" as const,
      stacked: false,
      toolbar: {
        show: false,
      },
      fontFamily: "Inter, sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
    },
    xaxis: {
      categories: ["Monolito", "Microservicios", "BFF", "Sidecar", "Event-Driven"],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
    legend: {
      position: "top" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      labels: {
        colors: "#374151",
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toString();
        },
      },
    },
  };

  const projectsChartSeries = [
    {
      name: "Proyectos",
      data: [
        metrics?.projects?.byPattern?.monolith || 0,
        metrics?.projects?.byPattern?.microservices || 0,
        metrics?.projects?.byPattern?.bff || 0,
        metrics?.projects?.byPattern?.sidecar || 0,
        metrics?.projects?.byPattern?.eventDriven || 0,
      ],
    },
  ];

  // Configuración del gráfico de dona para resumen
  const summaryChartOptions = {
    chart: {
      type: "donut" as const,
      fontFamily: "Inter, sans-serif",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              color: "#374151",
            },
            value: {
              show: true,
              fontSize: "18px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              color: "#111827",
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "16px",
              fontFamily: "Inter, sans-serif",
              color: "#374151",
            },
          },
        },
      },
    },
    labels: ["Proyectos", "Colaboradores", "Sincronizaciones", "Análisis IA"],
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    legend: {
      position: "bottom" as const,
      fontSize: "12px",
      fontFamily: "Inter, sans-serif",
      labels: {
        colors: "#374151",
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toString();
        },
      },
    },
  };

  const summaryChartSeries = [
    metrics?.projects?.total || 0,
    metrics?.collaboration?.totalCollaborators || 0,
    metrics?.sync?.totalSyncs || 0,
    metrics?.ai?.totalAnalyses || 0,
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-black">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-4 sm:mb-6">
              <span className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                ← Dashboard
              </span>
            </div>

            {/* Título principal */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-black mb-2">
                Resumen de rendimiento de la plataforma
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Métricas de proyectos, colaboración, sincronización e IA
              </p>
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
              {/* Gráfico de proyectos por patrón */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-medium text-black mb-1">
                      Distribución de Proyectos
                    </h2>
                    <h3 className="text-lg font-bold text-black">
                      Por Patrón Arquitectónico
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black">Filtrar:</span>
                    <select className="text-sm border border-gray-300 rounded px-2 py-1 text-black">
                      <option>Últimos 6 meses</option>
                      <option>Último año</option>
                      <option>Últimos 30 días</option>
                    </select>
                  </div>
                </div>
                <div className="h-64 sm:h-80">
                  <Chart
                    options={projectsChartOptions}
                    series={projectsChartSeries}
                    type="bar"
                    height="100%"
                  />
                </div>
              </div>

              {/* Gráfico de dona para resumen */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-sm font-medium text-black mb-1">
                    Resumen
                  </h2>
                  <h3 className="text-lg font-bold text-black">
                    Actividad General
                  </h3>
                </div>
                <div className="h-64 sm:h-80">
                  <Chart
                    options={summaryChartOptions}
                    series={summaryChartSeries}
                    type="donut"
                    height="100%"
                  />
                </div>
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Proyectos</p>
                    <p className="text-2xl font-bold text-blue-900">{metrics?.projects?.total || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Colaboradores</p>
                    <p className="text-2xl font-bold text-green-900">{metrics?.collaboration?.totalCollaborators || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Sincronizaciones</p>
                    <p className="text-2xl font-bold text-purple-900">{metrics?.sync?.totalSyncs || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-orange-600">Análisis IA</p>
                    <p className="text-2xl font-bold text-orange-900">{metrics?.ai?.totalAnalyses || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Generar Reporte */}
            <div className="flex justify-start">
              <button
                onClick={generateReport}
                disabled={generatingReport}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base"
              >
                {generatingReport ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generando reporte...
                  </>
                ) : (
                  "Generar reporte"
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
