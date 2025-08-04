"use client";
import { useState } from "react";

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

interface ReportModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (reportId: number, format: string) => void;
}

export function ReportModal({
  report,
  isOpen,
  onClose,
  onDownload,
}: ReportModalProps) {
  const [downloadFormat, setDownloadFormat] = useState("pdf");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  if (!isOpen || !report) return null;

  const parsedMetrics = JSON.parse(report.metrics);
  const parsedIaResults = JSON.parse(report.iaResults);
  const parsedDateRange = JSON.parse(report.dateRange);

  const handleDownload = () => {
    onDownload(report.id, downloadFormat);
    setShowDownloadModal(false);
  };

  const renderMetricsByType = () => {
    switch (report.type) {
      case 'project':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {parsedMetrics.totalProjects || 0}
              </div>
              <div className="text-sm text-gray-600">Proyectos Totales</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {parsedMetrics.totalCollaborators || 0}
              </div>
              <div className="text-sm text-gray-600">Colaboradores</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {parsedMetrics.activeProjects || 0}
              </div>
              <div className="text-sm text-gray-600">Proyectos Activos</div>
            </div>
            {parsedMetrics.projectsByPattern && (
              <div className="text-center bg-orange-50 rounded-lg p-4">
                <div className="text-lg font-bold text-orange-600">
                  {Object.keys(parsedMetrics.projectsByPattern).length}
                </div>
                <div className="text-sm text-gray-600">Patrones Usados</div>
              </div>
            )}
          </div>
        );
      
      case 'collaboration':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {parsedMetrics.totalCollaborators || 0}
              </div>
              <div className="text-sm text-gray-600">Colaboradores Únicos</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {parsedMetrics.totalCollaborations || 0}
              </div>
              <div className="text-sm text-gray-600">Colaboraciones</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {parsedMetrics.averageProjectsPerCollaborator || 0}
              </div>
              <div className="text-sm text-gray-600">Promedio por Colaborador</div>
            </div>
          </div>
        );
      
      case 'sync':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {parsedMetrics.totalSyncs || 0}
              </div>
              <div className="text-sm text-gray-600">Sincronizaciones Totales</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {parsedMetrics.successfulSyncs || 0}
              </div>
              <div className="text-sm text-gray-600">Sincronizaciones Exitosas</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {parsedMetrics.successRate || 0}%
              </div>
              <div className="text-sm text-gray-600">Tasa de Éxito</div>
            </div>
          </div>
        );
      
      case 'ai':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {parsedMetrics.totalAnalyses || 0}
              </div>
              <div className="text-sm text-gray-600">Análisis Totales</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {parsedMetrics.optimizationsApplied || 0}
              </div>
              <div className="text-sm text-gray-600">Optimizaciones Aplicadas</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {parsedMetrics.averageScore || 0}%
              </div>
              <div className="text-sm text-gray-600">Puntuación Promedio</div>
            </div>
          </div>
        );
      
      case 'history':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {parsedMetrics.totalVersions || 0}
              </div>
              <div className="text-sm text-gray-600">Versiones Totales</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {parsedMetrics.recentVersions || 0}
              </div>
              <div className="text-sm text-gray-600">Versiones Recientes</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {parsedMetrics.averageVersionsPerProject || 0}
              </div>
              <div className="text-sm text-gray-600">Promedio por Proyecto</div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {parsedMetrics.totalProjects || 0}
              </div>
              <div className="text-sm text-gray-600">Proyectos</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {parsedMetrics.totalCollaborators || 0}
              </div>
              <div className="text-sm text-gray-600">Colaboradores</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {parsedMetrics.totalSyncs || 0}
              </div>
              <div className="text-sm text-gray-600">Sincronizaciones</div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {/* Modal principal del reporte */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {report.title}
                </h2>
                <p className="text-gray-600">
                  Generado el{" "}
                  {new Date(report.createdAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Contenido del reporte */}
            <div className="space-y-6">
              {/* Descripción */}
              {report.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Descripción
                  </h3>
                  <p className="text-gray-700">{report.description}</p>
                </div>
              )}

              {/* Métricas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Métricas del Sistema
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {renderMetricsByType()}
                </div>
                
                {/* Rango de fechas utilizado */}
                {parsedMetrics.dateRange && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Período analizado:</h4>
                    <p className="text-sm text-blue-800">
                      Desde: {new Date(parsedMetrics.dateRange.start).toLocaleDateString('es-ES')} 
                      hasta: {new Date(parsedMetrics.dateRange.end).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
              </div>

              {/* Resultados de IA */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Análisis de IA
                </h3>
                <div className="space-y-4">
                  {/* Recomendaciones */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      Recomendaciones:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {parsedIaResults.recommendations?.map(
                        (rec: any, index: number) => (
                          <li key={index} className="text-sm">
                            {rec.message}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Alertas */}
                  {parsedIaResults.alerts &&
                    parsedIaResults.alerts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          Alertas:
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {parsedIaResults.alerts.map(
                            (alert: any, index: number) => (
                              <li key={index} className="text-sm">
                                {alert.message}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {/* Insights */}
                  {parsedIaResults.insights && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        Insights:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {parsedIaResults.insights.performanceScore && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {parsedIaResults.insights.performanceScore}%
                            </div>
                            <div className="text-xs text-gray-600">
                              Performance Score
                            </div>
                          </div>
                        )}
                        {parsedIaResults.insights.collaborationScore && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {parsedIaResults.insights.collaborationScore}%
                            </div>
                            <div className="text-xs text-gray-600">
                              Collaboration Score
                            </div>
                          </div>
                        )}
                        {parsedIaResults.insights.recommendations && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {parsedIaResults.insights.recommendations}
                            </div>
                            <div className="text-xs text-gray-600">
                              Recomendaciones
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de descarga */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de descarga */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Seleccionar formato de descarga
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato
                </label>
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
