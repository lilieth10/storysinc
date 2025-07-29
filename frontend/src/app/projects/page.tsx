"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/landing/Footer";
import { AILoader } from "@/components/ui/ai-loader";
import { useAuth } from "@/store/auth";
import toast from "react-hot-toast";

interface Project {
  id: number;
  name: string;
  description?: string;
  pattern: string;
  status: string;
  tags: string;
  lastSync: string;
  iaInsights: string;
  components?: string;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface CreateProjectData {
  name: string;
  description: string;
  pattern: string;
  tags: string;
  license?: string;
  visibility?: string;
  addReadme?: boolean;
  addGitignore?: boolean;
  chooseLicense?: boolean;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIA, setLoadingIA] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filterPattern, setFilterPattern] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState<CreateProjectData>({
    name: "",
    description: "",
    pattern: "monolith",
    tags: "",
    license: "MIT",
    visibility: "public",
    addReadme: true,
    addGitignore: true,
    chooseLicense: true,
  });

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch {
      toast.error("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del proyecto es requerido");
      return;
    }

    setLoadingIA(true);
    try {
      // Preparar datos para el backend
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        pattern: "monolith", // Valor por defecto
        status: "active",
        tags: "", // Se puede agregar después
        license: formData.license || "MIT",
        visibility: formData.visibility || "public",
        addReadme: formData.addReadme || false,
        addGitignore: formData.addGitignore || false,
        chooseLicense: formData.chooseLicense || false,
      };

      console.log("Enviando datos al backend:", projectData);

      const response = await api.post("/projects", projectData);

      if (response.data) {
        toast.success("Proyecto creado exitosamente");
        setShowCreateForm(false);
        setFormData({
          name: "",
          description: "",
          pattern: "monolith",
          tags: "",
          license: "MIT",
          visibility: "public",
          addReadme: true,
          addGitignore: true,
          chooseLicense: true,
        });
        fetchProjects(); // Recargar la lista de proyectos
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error al crear proyecto:", error);

      if (error.response?.status === 400) {
        toast.error("Datos inválidos. Verifica la información del proyecto.");
      } else if (error.response?.status === 401) {
        toast.error("No tienes permisos para crear proyectos.");
      } else if (error.response?.status === 409) {
        toast.error("Ya existe un proyecto con ese nombre.");
      } else {
        toast.error("Error al crear el proyecto. Intenta nuevamente.");
      }
    } finally {
      setLoadingIA(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await api.delete(`/projects/${selectedProject.id}`);
      toast.success("Proyecto eliminado exitosamente");
      setShowDeleteModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch {
      toast.error("Error al eliminar el proyecto");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case "microservices":
        return "🔧";
      case "monolith":
        return "🏗️";
      case "serverless":
        return "⚡";
      case "event-driven":
        return "🔄";
      default:
        return "📁";
    }
  };

  const filteredProjects = projects.filter((project) => {
    const patternMatch =
      filterPattern === "all" || project.pattern === filterPattern;
    const statusMatch =
      filterStatus === "all" || project.status === filterStatus;
    return patternMatch && statusMatch;
  });

  // Agregar handlers vacíos para evitar errores de referencia
  const handleAnalyzeIA = (projectId: number) => {
    // Implementación futura: análisis IA
    toast("Funcionalidad de análisis IA próximamente");
  };
  const handleSyncProject = (projectId: number) => {
    // Implementación futura: sincronización
    toast("Funcionalidad de sincronización próximamente");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header con búsqueda y crear como en el Figma */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex flex-1 items-center gap-6 max-w-3xl w-full">
                <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap mr-4">
                  Proyectos
                </h1>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar proyectos..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Crear
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <select
                value={filterPattern}
                onChange={(e) => setFilterPattern(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Todos los patrones</option>
                <option value="monolith">Monolito</option>
                <option value="microservices">Microservicios</option>
                <option value="serverless">Serverless</option>
                <option value="event-driven">Event-Driven</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="archived">Archivado</option>
              </select>
            </div>

            {/* Project Grid - Corregido como en Figma */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  No se encontraron proyectos
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Crear Proyecto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 md:p-6">
                      {/* Layout corregido como en Figma */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg md:text-xl">
                              {getPatternIcon(project.pattern)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {project.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(project.status)}`}
                          >
                            {project.status === "active"
                              ? "Activo"
                              : project.status}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowDeleteModal(true);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Información del proyecto */}
                      <div className="space-y-1 mb-3">
                        <div className="text-xs text-gray-600">
                          Última sincronización:{" "}
                          {new Date(project.lastSync).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          Propietario: {project.owner?.name || "John Doe"}
                        </div>
                      </div>

                      {/* Tags */}
                      {project.tags && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.tags
                            .split(",")
                            .slice(0, 3)
                            .map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          {project.tags.split(",").length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{project.tags.split(",").length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => router.push(`/projects/${project.id}`)}
                          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                            />
                          </svg>
                          Abrir Editor
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAnalyzeIA(project.id)}
                            disabled={loadingIA}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingIA ? (
                              <AILoader size="sm" text="" />
                            ) : (
                              <>
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                  />
                                </svg>
                                Analizar IA
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleSyncProject(project.id)}
                            disabled={loadingIA}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Sincronizar
                          </button>
                        </div>
                      </div>

                      {/* Last sync */}
                      <div className="mt-4 text-xs text-gray-500">
                        Última sincronización:{" "}
                        {new Date(project.lastSync).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación como en el Figma */}
            {filteredProjects.length > 0 && (
              <div className="flex justify-center items-center space-x-1 md:space-x-2">
                <button className="px-2 md:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button className="px-2 md:px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md">
                  1
                </button>
                <button className="px-2 md:px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  2
                </button>
                <button className="px-2 md:px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  3
                </button>
                <button className="px-2 md:px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  4
                </button>
                <button className="px-2 md:px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  5
                </button>
                <button className="px-2 md:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Create Project Form - Integrado como en Figma */}
            {showCreateForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Crear un nuevo repositorio
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de repositorio{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Mi Proyecto"
                      />
                    </div>
                    <div className="flex-1 mt-4 md:mt-0">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dueño <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={
                          /* Aquí deberías poner el valor del dueño si lo tienes, por ahora vacío */ ""
                        }
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="Nombre del dueño"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Describe tu proyecto..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Licencia
                    </label>
                    <select
                      value={formData.license || "MIT"}
                      onChange={(e) =>
                        setFormData({ ...formData, license: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="MIT">MIT License</option>
                      <option value="Apache">Apache License 2.0</option>
                      <option value="GPL">GPL v3</option>
                      <option value="BSD">BSD License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visibilidad
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={formData.visibility === "public"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              visibility: e.target.value,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="mr-1">
                          <svg
                            className="inline w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 17a4 4 0 100-8 4 4 0 000 8zm6-4V7a6 6 0 10-12 0v6a2 2 0 002 2h8a2 2 0 002-2z"
                            />
                          </svg>
                        </span>
                        Público
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={formData.visibility === "private"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              visibility: e.target.value,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="mr-1">
                          <svg
                            className="inline w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 17a4 4 0 100-8 4 4 0 000 8zm6-4V7a6 6 0 10-12 0v6a2 2 0 002 2h8a2 2 0 002-2z"
                            />
                            <circle cx="12" cy="12" r="4" fill="currentColor" />
                          </svg>
                        </span>
                        Privado
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inicializar este repositorio con:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="addReadme"
                          checked={formData.addReadme || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addReadme: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        Agregar un archivo README
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="addGitignore"
                          checked={formData.addGitignore || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addGitignore: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        Agregar .gitignore
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="chooseLicense"
                          checked={formData.chooseLicense || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              chooseLicense: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        Elegir una licencia
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateProject}
                      disabled={loadingIA}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingIA ? (
                        <div className="flex items-center">
                          <AILoader size="sm" text="" />
                          <span className="ml-2">Creando...</span>
                        </div>
                      ) : (
                        "Crear repositorio"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Eliminar Proyecto
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar el proyecto &quot;
                {selectedProject?.name}&quot;? Esta acción no se puede deshacer.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
