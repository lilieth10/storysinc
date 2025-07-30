"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/landing/Footer";
import { AILoader } from "@/components/ui/ai-loader";
import { useAuth } from "@/store/auth";
import toast from "react-hot-toast";

interface Version {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
  status: "deployed" | "testing" | "conflict";
  filesChanged: string[];
  projectId: number;
  projectName: string;
}

interface VersionFilters {
  author: string;
  dateRange: {
    start: string;
    end: string;
  };
  branch: string;
  searchTerm: string;
}

export default function VersionHistoryPage() {
  const { token, user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [filters, setFilters] = useState<VersionFilters>({
    author: "",
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
    branch: "",
    searchTerm: "",
  });

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.searchTerm) params.append("search", filters.searchTerm);
      if (filters.author) params.append("author", filters.author);
      if (filters.branch) params.append("branch", filters.branch);
      if (filters.dateRange.start)
        params.append("start", filters.dateRange.start);
      if (filters.dateRange.end) params.append("end", filters.dateRange.end);

      const response = await api.get(`/versions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVersions(response.data);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Error al cargar el historial de versiones");
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return "✅";
      case "testing":
        return "⚠️";
      case "conflict":
        return "🔄";
      default:
        return "❓";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "deployed":
        return "Desplegado en producción";
      case "testing":
        return "En pruebas";
      case "conflict":
        return "En conflicto";
      default:
        return "Desconocido";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "text-green-600 bg-green-100";
      case "testing":
        return "text-yellow-600 bg-yellow-100";
      case "conflict":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const handleAnalyzeWithAI = async (version: Version) => {
    setAnalyzingWithAI(true);
    try {
      const response = await api.post(
        `/versions/${version.id}/analyze`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("✅ Análisis de IA completado");
        // Aquí se mostrarían las recomendaciones de IA
        console.log("Análisis de IA:", response.data.data);
      }
    } catch (error) {
      console.error("Error analyzing version:", error);
      toast.error("❌ Error en el análisis de IA");
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  const handleRevertVersion = async (version: Version) => {
    try {
      const response = await api.post(
        `/versions/${version.id}/revert`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("✅ Versión revertida exitosamente");
        fetchVersions();
      }
    } catch (error) {
      console.error("Error reverting version:", error);
      toast.error("❌ Error al revertir versión");
    }
  };

  const handleDownloadVersion = async (version: Version) => {
    try {
      // Simular descarga
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("✅ Versión descargada exitosamente");
    } catch (error) {
      toast.error("❌ Error al descargar versión");
    }
  };

  const filteredVersions = versions.filter((version) => {
    const matchesAuthor =
      !filters.author ||
      version.author.toLowerCase().includes(filters.author.toLowerCase());
    const matchesBranch =
      !filters.branch ||
      version.branch.toLowerCase().includes(filters.branch.toLowerCase());
    const matchesSearch =
      !filters.searchTerm ||
      version.message
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase()) ||
      version.hash.toLowerCase().includes(filters.searchTerm.toLowerCase());

    return matchesAuthor && matchesBranch && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-64">
              <AILoader />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Historial de Versiones
              </h1>
              <p className="text-gray-600">
                Gestiona y revisa el historial de cambios de tus proyectos
              </p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Filtros y Búsqueda
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar
                  </label>
                  <input
                    type="text"
                    placeholder="Hash, mensaje, autor..."
                    value={filters.searchTerm}
                    onChange={(e) =>
                      setFilters({ ...filters, searchTerm: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autor
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del autor..."
                    value={filters.author}
                    onChange={(e) =>
                      setFilters({ ...filters, author: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rama
                  </label>
                  <input
                    type="text"
                    placeholder="main, develop, feature..."
                    value={filters.branch}
                    onChange={(e) =>
                      setFilters({ ...filters, branch: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          start: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Lista de Versiones */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Versiones ({filteredVersions.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredVersions.map((version) => (
                  <div key={version.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-gray-500">
                            {version.hash}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}
                          >
                            {getStatusIcon(version.status)}{" "}
                            {getStatusText(version.status)}
                          </span>
                        </div>

                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {version.message}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span>👤 {version.author}</span>
                          <span>
                            📅{" "}
                            {new Date(version.date).toLocaleDateString("es-ES")}
                          </span>
                          <span>🌿 {version.branch}</span>
                          <span>📁 {version.projectName}</span>
                        </div>

                        <div className="text-xs text-gray-400">
                          Archivos: {version.filesChanged.join(", ")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleAnalyzeWithAI(version)}
                          disabled={analyzingWithAI}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {analyzingWithAI ? "Analizando..." : "🤖 IA"}
                        </button>

                        <button
                          onClick={() => handleDownloadVersion(version)}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          📥 Descargar
                        </button>

                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleRevertVersion(version)}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            ↩️ Revertir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredVersions.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">
                    No se encontraron versiones con los filtros aplicados
                  </p>
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
