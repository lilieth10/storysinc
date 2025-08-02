/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { api } from "@/lib/api";
import { AILoader } from "@/components/ui/ai-loader";
import toast from "react-hot-toast";
import { Dialog } from "@/components/ui/dialog";
import Link from "next/link";

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

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (format: string, selection: string, by: string) => void;
  isDownloading: boolean;
}

function DownloadModal({
  isOpen,
  onClose,
  onDownload,
  isDownloading,
}: DownloadModalProps) {
  const [format, setFormat] = useState("pdf");
  const [selection, setSelection] = useState("all");
  const [by, setBy] = useState("date");

  const handleDownload = () => {
    onDownload(format, selection, by);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Reporte">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formato
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar
          </label>
          <select
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">Todo el reporte</option>
            <option value="summary">Solo resumen</option>
            <option value="metrics">Solo métricas</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Por
          </label>
          <select
            value={by}
            onChange={(e) => setBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="date">Fecha</option>
            <option value="type">Tipo</option>
            <option value="priority">Prioridad</option>
          </select>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isDownloading ? (
              <>
                <AILoader size="sm" text="" />
                Descargando...
              </>
            ) : (
              "Descargar"
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte descargado con éxito"
    >
      <div>
        <p className="text-gray-600 mb-6">
          El reporte se ha descargado correctamente y está disponible para su
          visualización.
        </p>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
        >
          Continuar
        </button>
      </div>
    </Dialog>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${resolvedParams.id}`);
      setReport(res.data);
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error("Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleDownload = async (
    _format: string,
    _selection: string,
    _by: string,
  ) => {
    try {
      setIsDownloading(true);

      // Simular descarga
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setDownloadModalOpen(false);
      setSuccessModalOpen(true);

      toast.success("Reporte descargado exitosamente");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Error al descargar el reporte");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AILoader size="lg" text="Cargando reporte..." />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Reporte no encontrado</p>
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
            {/* Header con título */}
            <div className="bg-blue-600 text-white px-8 py-6 rounded-lg mb-8">
              <h1 className="text-3xl font-bold">REPORTE</h1>
            </div>

            {/* Breadcrumb */}
            <div className="mb-6">
              <Link
                href="/reports"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Reportes
              </Link>
            </div>

            {/* Contenido del reporte */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {report.title}
              </h2>

              <div className="space-y-6 text-gray-700">
                {/* Métricas dinámicas */}
                {report.metrics && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Métricas del Sistema
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        try {
                          const metrics = JSON.parse(report.metrics);
                          return Object.entries(metrics).map(([key, value]) => {
                            if (typeof value === 'object' && value !== null) {
                              return (
                                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </h4>
                                  <div className="text-xs text-gray-600">
                                    {Object.entries(value).map(([subKey, subValue]) => (
                                      <div key={subKey} className="flex justify-between">
                                        <span className="capitalize">{subKey.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                        <span className="font-medium">{String(subValue)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <p className="text-2xl font-bold text-green-600">
                                  {String(value)}
                                </p>
                              </div>
                            );
                          });
                        } catch {
                          return (
                            <div className="col-span-full text-center py-4">
                              <p className="text-gray-500">No hay métricas disponibles</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Análisis de IA dinámico */}
                {report.iaResults && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Análisis de IA
                    </h3>
                    {(() => {
                      try {
                        const iaResults = JSON.parse(report.iaResults);
                        return (
                          <div className="space-y-4">
                            {/* Recomendaciones */}
                            {iaResults.recommendations && iaResults.recommendations.length > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-blue-900 mb-3">
                                  Recomendaciones
                                </h4>
                                <div className="space-y-2">
                                  {iaResults.recommendations.map((rec: any, idx: number) => (
                                    <div key={idx} className="flex items-start">
                                      <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                                        rec.priority === 'high' ? 'bg-red-500' : 
                                        rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}></div>
                                      <div>
                                        <p className="text-sm text-blue-800 font-medium capitalize">
                                          {rec.type}
                                        </p>
                                        <p className="text-xs text-blue-700">
                                          {rec.message}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Alertas */}
                            {iaResults.alerts && iaResults.alerts.length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-yellow-900 mb-3">
                                  Alertas
                                </h4>
                                <div className="space-y-2">
                                  {iaResults.alerts.map((alert: any, idx: number) => (
                                    <div key={idx} className="flex items-start">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                      <div>
                                        <p className="text-sm text-yellow-800 font-medium capitalize">
                                          {alert.type}
                                        </p>
                                        <p className="text-xs text-yellow-700">
                                          {alert.message}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Insights */}
                            {iaResults.insights && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-green-900 mb-3">
                                  Insights
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {Object.entries(iaResults.insights).map(([key, value]) => (
                                    <div key={key} className="text-center">
                                      <p className="text-xs text-green-700 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </p>
                                      <p className="text-lg font-bold text-green-600">
                                        {String(value)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } catch {
                        return (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No hay análisis de IA disponible</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Información del reporte */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Información del Reporte
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Tipo de reporte</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">
                        {report.type}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Fecha de creación</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Descargar */}
            <div className="flex justify-center">
              <button
                onClick={() => setDownloadModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Descargar
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Modales */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />

      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </div>
  );
}
