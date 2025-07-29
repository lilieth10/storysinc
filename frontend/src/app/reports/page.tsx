"use client";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { api } from "@/lib/api";
import { ReportLoader } from "@/components/ui/report-loader";
import { ReportModal } from "@/components/ui/report-modal";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Trash2 } from "lucide-react";

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
  subscriptions: {
    categories: string[];
    Gratis: number[];
    Basico: number[];
    Pro: number[];
    Empresa: number[];
  };
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);

      // Cargar reportes
      const reportsRes = await api.get("/reports");
      setReports(reportsRes.data);

      // Cargar métricas para el gráfico
      const metricsRes = await api.get("/dashboard/metrics");
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);

      // Simular generación de reporte con IA
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const reportData = {
        type: "dashboard",
        title: "Reporte de rendimiento",
        description: "Análisis completo del rendimiento de la plataforma",
        metrics: {
          subscriptions: metrics?.subscriptions || {},
        },
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      };

      await api.post("/reports", reportData);

      toast.success("Reporte generado exitosamente");
      await loadReportsData(); // Recargar datos
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error al generar el reporte");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleDownloadReport = async (reportId: number, format: string) => {
    try {
      const response = await api.post(
        "/reports/download",
        {
          reportId,
          format,
        },
        {
          responseType: "blob",
        },
      );

      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `reporte_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Reporte descargado en formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Error al descargar el reporte");
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    // Confirmación elegante con toast
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <div className="font-medium text-gray-900">¿Eliminar reporte?</div>
            <div className="text-sm text-gray-600">
              Esta acción no se puede deshacer
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000,
          position: "top-center",
        },
      );
    });

    if (!confirmed) return;

    try {
      await api.delete(`/reports/${reportId}`);
      toast.success("Reporte eliminado exitosamente");
      await loadReportsData(); // Recargar datos
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Error al eliminar el reporte");
    }
  };

  // Configuración del gráfico de estadísticas (igual al de suscripciones)
  const statisticsChartOptions = {
    chart: {
      type: "bar" as const,
      stacked: true,
      toolbar: {
        show: false,
      },
      fontFamily: "Inter, sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    xaxis: {
      categories: metrics?.subscriptions?.categories || [
        "ENG",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
      ],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: function (val: number) {
          if (val >= 1000000) {
            return (val / 1000000).toFixed(0) + "M";
          } else if (val >= 1000) {
            return (val / 1000).toFixed(0) + "K";
          }
          return val.toString();
        },
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    colors: ["#8B5CF6", "#A855F7", "#C084FC", "#DDD6FE"],
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
          if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + "M";
          } else if (val >= 1000) {
            return (val / 1000).toFixed(1) + "K";
          }
          return val.toString();
        },
      },
    },
  };

  const statisticsChartSeries = [
    {
      name: "Gratis",
      data: metrics?.subscriptions?.Gratis || [
        5000, 8000, 12000, 15000, 18000, 22000,
      ],
    },
    {
      name: "Básico",
      data: metrics?.subscriptions?.Basico || [
        3000, 5000, 8000, 10000, 12000, 15000,
      ],
    },
    {
      name: "Pro",
      data: metrics?.subscriptions?.Pro || [
        2000, 3000, 5000, 7000, 9000, 12000,
      ],
    },
    {
      name: "Empresa",
      data: metrics?.subscriptions?.Empresa || [
        1000, 1500, 2500, 3500, 4500, 6000,
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Link
                href="/reports"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Reportes
              </Link>
            </div>

            {/* Título principal */}
            <div className="mb-8">
              <h1 className="text-lg font-semibold text-gray-700 mb-2">
                Resumen de rendimiento
              </h1>
            </div>

            {/* Gráfico de Estadísticas */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-600 mb-1">
                    Estadísticas
                  </h2>
                  <h3 className="text-lg font-bold text-gray-900">
                    Suscripciones
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Filtrar:</span>
                  <select className="text-sm border border-gray-300 rounded px-2 py-1">
                    <option>Últimos 6 meses</option>
                    <option>Último año</option>
                    <option>Últimos 30 días</option>
                  </select>
                </div>
              </div>
              <div className="h-80">
                <Chart
                  options={statisticsChartOptions}
                  series={statisticsChartSeries}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>

            {/* Lista de Reportes */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Reportes Generados
              </h2>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay reportes generados aún
                  </p>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {report.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Tipo: {report.type}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report.id, "pdf")}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                        >
                          Descargar
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 flex items-center gap-1"
                          title="Eliminar reporte"
                        >
                          <Trash2 size={12} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Botón Generar Reporte */}
            <div className="flex justify-start">
              <button
                onClick={generateReport}
                disabled={generatingReport}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2"
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

            {/* Loader de generación de reporte */}
            <ReportLoader isGenerating={generatingReport} />

            {/* Modal de reporte */}
            <ReportModal
              report={selectedReport}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedReport(null);
              }}
              onDownload={handleDownloadReport}
            />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
