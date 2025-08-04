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
import { Trash2, FileText, Users, GitBranch, Brain } from "lucide-react";

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

interface ChartData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
  [key: string]: any;
}

interface SummaryMetrics {
  chartData: ChartData;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>("project");
  const [dateRange, setDateRange] = useState<string>("30");
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(null);

  useEffect(() => {
    loadReportsData();
  }, []);

  useEffect(() => {
    loadSummaryMetrics();
  }, [selectedReportType, dateRange]);

  const loadReportsData = async () => {
    try {
      setLoading(true);

      // Cargar reportes
      const reportsRes = await api.get("/reports");
      setReports(reportsRes.data);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryMetrics = async () => {
    try {
      const response = await api.get("/reports/summary-metrics", {
        params: {
          type: selectedReportType,
          dateRange: dateRange,
        },
      });
      
      setSummaryMetrics(response.data);
    } catch (error) {
      console.error("Error loading summary metrics:", error);
      // No mostrar toast para evitar spam, ya que se llama frecuentemente
    }
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);

      // Simular generación de reporte con IA
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const reportData = {
        type: selectedReportType,
        title: getReportTitle(selectedReportType),
        description: getReportDescription(selectedReportType),
        dateRange: {
          start: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString(),
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

  const getReportTitle = (type: string): string => {
    switch (type) {
      case "project":
        return "Reporte de Proyectos";
      case "collaboration":
        return "Reporte de Colaboración";
      case "sync":
        return "Reporte de Sincronización";
      case "ai":
        return "Reporte de IA";
      case "history":
        return "Reporte de Historial";
      default:
        return "Reporte General";
    }
  };

  const getReportDescription = (type: string): string => {
    switch (type) {
      case "project":
        return "Análisis completo de proyectos, patrones y colaboradores";
      case "collaboration":
        return "Métricas de trabajo en equipo y roles de colaboradores";
      case "sync":
        return "Estados de sincronización BFF y Sidecar";
      case "ai":
        return "Optimizaciones y recomendaciones de IA aplicadas";
      case "history":
        return "Trazabilidad de cambios y versiones";
      default:
        return "Reporte general de la plataforma";
    }
  };

  const getChartTitle = (type: string): string => {
    switch (type) {
      case "project":
        return "Proyectos por Patrón Arquitectónico";
      case "collaboration":
        return "Colaboradores por Rol";
      case "sync":
        return "Sincronizaciones por Tipo";
      case "ai":
        return "Análisis de IA por Tipo";
      case "history":
        return "Versiones por Estado";
      default:
        return "Distribución General";
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

  // Configuración dinámica del gráfico basada en el tipo de reporte seleccionado
  const getChartOptions = () => {
    const categories = summaryMetrics?.chartData?.categories || [];
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];
    
    return {
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
        categories: categories,
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
      colors: colors.slice(0, categories.length),
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
  };

  const getChartSeries = () => {
    return summaryMetrics?.chartData?.series || [{ name: "Datos", data: [] }];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-black">Cargando reportes...</p>
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
              <Link
                href="/reports"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
              >
                ← Reportes
              </Link>
            </div>

            {/* Título principal */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-black mb-2">
                Reportes de STORYSINC
              </h1>
              <p className="text-sm sm:text-base text-black">
                Análisis de proyectos, sincronización, IA e historial
              </p>
            </div>

            {/* Selector de tipo de reporte */}
            <div className="mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReportType === "project" 
                    ? "border-blue-300 bg-blue-50" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
                     onClick={() => setSelectedReportType("project")}>
                  <div className={`p-2 rounded-lg mr-3 ${
                    selectedReportType === "project" 
                      ? "bg-blue-100 text-blue-600" 
                      : "bg-gray-100 text-black"
                  }`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-black">Proyectos</h3>
                    <p className="text-xs sm:text-sm text-black">Código, colaboradores, entornos</p>
                  </div>
                </div>

                <div className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReportType === "collaboration" 
                    ? "border-green-300 bg-green-50" 
                    : "border-gray-200 hover:border-green-300"
                }`}
                     onClick={() => setSelectedReportType("collaboration")}>
                  <div className={`p-2 rounded-lg mr-3 ${
                    selectedReportType === "collaboration" 
                      ? "bg-green-100 text-green-600" 
                      : "bg-gray-100 text-black"
                  }`}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-black">Colaboración</h3>
                    <p className="text-xs sm:text-sm text-black">Equipos, roles, actividad</p>
                  </div>
                </div>

                <div className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReportType === "sync" 
                    ? "border-purple-300 bg-purple-50" 
                    : "border-gray-200 hover:border-purple-300"
                }`}
                     onClick={() => setSelectedReportType("sync")}>
                  <div className={`p-2 rounded-lg mr-3 ${
                    selectedReportType === "sync" 
                      ? "bg-purple-100 text-purple-600" 
                      : "bg-gray-100 text-black"
                  }`}>
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-black">Sincronización</h3>
                    <p className="text-xs sm:text-sm text-black">BFF, Sidecar, estados</p>
                  </div>
                </div>

                <div className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReportType === "ai" 
                    ? "border-orange-300 bg-orange-50" 
                    : "border-gray-200 hover:border-orange-300"
                }`}
                     onClick={() => setSelectedReportType("ai")}>
                  <div className={`p-2 rounded-lg mr-3 ${
                    selectedReportType === "ai" 
                      ? "bg-orange-100 text-orange-600" 
                      : "bg-gray-100 text-black"
                  }`}>
                    <Brain size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-black">IA</h3>
                    <p className="text-xs sm:text-sm text-black">Optimizaciones, recomendaciones</p>
                  </div>
                </div>

                <div className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReportType === "history" 
                    ? "border-red-300 bg-red-50" 
                    : "border-gray-200 hover:border-red-300"
                }`}
                     onClick={() => setSelectedReportType("history")}>
                  <div className={`p-2 rounded-lg mr-3 ${
                    selectedReportType === "history" 
                      ? "bg-red-100 text-red-600" 
                      : "bg-gray-100 text-black"
                  }`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-black">Historial</h3>
                    <p className="text-xs sm:text-sm text-black">Cambios, versiones, trazabilidad</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-black font-medium">Rango de fechas:</span>
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-3 py-1 text-black"
                  >
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                    <option value="90">Últimos 3 meses</option>
                    <option value="365">Último año</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-black font-medium">Filtrar reportes:</span>
                  <select 
                    className="text-sm border border-gray-300 rounded px-3 py-1 text-black"
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedReportType(e.target.value);
                      }
                    }}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="project">Solo Proyectos</option>
                    <option value="collaboration">Solo Colaboración</option>
                    <option value="sync">Solo Sincronización</option>
                    <option value="ai">Solo IA</option>
                    <option value="history">Solo Historial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Gráfico Dinámico */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-black mb-1">
                    Distribución de Datos
                  </h2>
                  <h3 className="text-lg font-bold text-black">
                    {getChartTitle(selectedReportType)}
                  </h3>
                  {summaryMetrics && (
                    <p className="text-xs text-black mt-1">
                      Período: {new Date(summaryMetrics.dateRange.start).toLocaleDateString()} - {new Date(summaryMetrics.dateRange.end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="h-64 sm:h-80">
                <Chart
                  options={getChartOptions()}
                  series={getChartSeries()}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>

            {/* Lista de Reportes */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6">
                Reportes Generados
              </h2>
              <div className="space-y-3 sm:space-y-4 max-h-80 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="text-black text-center py-8">
                    No hay reportes generados aún
                  </p>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-black text-sm sm:text-base">
                          {report.title}
                        </h3>
                        <span className="text-xs text-black">
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
                      <p className="text-xs sm:text-sm text-black mb-2">
                        Tipo: {report.type}
                      </p>
                      <div className="flex flex-wrap gap-2">
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
                          PDF
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report.id, "csv")}
                          className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                        >
                          CSV
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
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base"
              >
                {generatingReport ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generando reporte...
                  </>
                ) : (
                  `Generar reporte de ${selectedReportType}`
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
