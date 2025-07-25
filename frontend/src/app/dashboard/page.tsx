
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { api } from "@/lib/api";
import { ReportLoader } from "@/components/ui/report-loader";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import Link from "next/link";

// Importar ApexCharts dinámicamente para evitar errores de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DashboardMetrics {
  subscriptions: {
    categories: string[];
    Gratis: number[];
    Basico: number[];
    Pro: number[];
    Empresa: number[];
  };
  summary: {
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
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await api.post("/reports", {
        type: "dashboard",
        title: "Reporte de rendimiento",
        description: "Análisis completo del rendimiento de la plataforma",
        metrics: {
          subscriptions: metrics?.subscriptions || {},
          summary: metrics?.summary || {}
        },
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
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

  // Configuración del gráfico de suscripciones
  const subscriptionChartOptions = {
    chart: {
      type: 'bar' as const,
      stacked: true,
      toolbar: {
        show: false
      },
      fontFamily: 'Inter, sans-serif'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 0
    },
    xaxis: {
      categories: metrics?.subscriptions?.categories || ['ENG', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function(val: number) {
          if (val >= 1000000) {
            return (val / 1000000).toFixed(0) + 'M';
          } else if (val >= 1000) {
            return (val / 1000).toFixed(0) + 'K';
          }
          return val.toString();
        },
        style: {
          colors: '#6B7280',
          fontSize: '12px'
        }
      }
    },
    colors: ['#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE'],
    legend: {
      position: 'top' as const,
      horizontalAlign: 'center' as const,
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      labels: {
        colors: '#374151'
      }
    },
    tooltip: {
      y: {
        formatter: function(val: number) {
          if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + 'M';
          } else if (val >= 1000) {
            return (val / 1000).toFixed(1) + 'K';
          }
          return val.toString();
        }
      }
    }
  };

  const subscriptionChartSeries = [
    {
      name: 'Gratis',
      data: metrics?.subscriptions?.Gratis || [5000, 8000, 12000, 15000, 18000, 22000]
    },
    {
      name: 'Básico',
      data: metrics?.subscriptions?.Basico || [3000, 5000, 8000, 10000, 12000, 15000]
    },
    {
      name: 'Pro',
      data: metrics?.subscriptions?.Pro || [2000, 3000, 5000, 7000, 9000, 12000]
    },
    {
      name: 'Empresa',
      data: metrics?.subscriptions?.Empresa || [1000, 1500, 2500, 3500, 4500, 6000]
    }
  ];

  // Configuración del gráfico de resumen (donut) - Uso de recursos
  const summaryChartOptions = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'Inter, sans-serif'
    },
    labels: ['CPU', 'GPU', 'RAM'],
    colors: ['#1F2937', '#3B82F6', '#60A5FA'],
    legend: {
      position: 'bottom' as const,
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      labels: {
        colors: '#374151'
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val: number) {
        return val + '%';
      },
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '600'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              color: '#374151'
            }
          }
        }
      }
    }
  };

  const summaryChartSeries = [50, 30, 20]; // CPU 50%, GPU 30%, RAM 20%

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
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
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
                ← Dashboard
              </Link>
            </div>

            {/* Título principal */}
            <div className="mb-8">
              <h1 className="text-lg font-semibold text-gray-700 mb-2">
                Resumen de rendimiento de la plataforma
              </h1>
            </div>



            {/* Layout de dos columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Gráfico de Suscripciones (izquierda) */}
              <div>
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
                    options={subscriptionChartOptions}
                    series={subscriptionChartSeries}
                    type="bar"
                    height="100%"
                  />
                </div>
              </div>

              {/* Gráfico de Uso de Recursos (derecha) */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen
                </h2>
                <div className="h-64 flex justify-center">
                  <Chart
                    options={summaryChartOptions}
                    series={summaryChartSeries}
                    type="donut"
                    height="100%"
                  />
                </div>
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
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
} 