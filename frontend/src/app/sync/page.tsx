/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  FolderIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useNotifications } from "@/store/notifications";

// Importar ApexCharts dinámicamente para evitar errores de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SyncProject {
  id: number;
  name: string;
  pattern: string; // Cambiado de 'type' a 'pattern' para coincidir con el backend
  language: string; // Agregado para coincidir con el backend
  lastSync: string;
  description: string;
  tags?: string;
  frontendAssociation?: string;
  contact?: string;
  functions?: string;
  owner?: {
    id: number;
    fullName?: string;
    name: string;
  };
}

interface CreateFormData {
  serviceName: string;
  description: string;
  pattern: string;
  tags: string;
  frontendAssociation: string;
  contact: string;
  functions: string[];
}

interface SyncHistory {
  id: number;
  projectId: number;
  userId: number;
  date: string;
  status: string;
  message?: string;
}

interface AIMetrics {
  performance: {
    averageTime: number;
    successRate: number;
    optimizations: number;
  };
  patterns: {
    bff: number;
    sidecar: number;
    monolith: number;
    microservices: number;
  };
  suggestions: Array<{
    type: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
  }>;
  performanceData?: number[];
}

export default function SyncPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createType, setCreateType] = useState<"bff" | "sidecar">("bff");
  const [syncProjects, setSyncProjects] = useState<SyncProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateFormData>({
    serviceName: "",
    description: "",
    pattern: "",
    tags: "",
    frontendAssociation: "",
    contact: "",
    functions: [],
  });
  const [selectedProject, setSelectedProject] = useState<SyncProject | null>(
    null,
  );
  const [editMode, setEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncHighlight, setLastSyncHighlight] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Agregar estados para métricas de IA
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    history: true,
    aiMetrics: true,
  });
  const { fetchNotifications } = useNotifications();

  // Cargar proyectos de sincronización
  useEffect(() => {
    fetchSyncProjects();
  }, []);

  // Cargar métricas e historial cuando se cargan los proyectos
  useEffect(() => {
    if (syncProjects.length > 0) {
      fetchAIMetrics();
      fetchSyncHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncProjects]);

  // Cargar métricas de IA cuando se selecciona un proyecto
  useEffect(() => {
    if (selectedProject) {
      fetchAIMetrics();
      fetchSyncHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  const fetchAIMetrics = async () => {
    const projectToUse = selectedProject || syncProjects[0];
    if (!projectToUse) return;

    setLoadingMetrics(true);
    try {
      const response = await fetch(
        `/sync/projects/${projectToUse.id}/ai-metrics`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setAiMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching AI metrics:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchSyncHistory = async () => {
    const projectToUse = selectedProject || syncProjects[0];
    if (!projectToUse) return;

    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await fetch(
        `/sync/projects/${projectToUse.id}/history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data);
      } else {
        setHistoryError("Error al cargar el historial");
      }
    } catch (error) {
      console.error("Error fetching sync history:", error);
      setHistoryError("Error de red");
    } finally {
      setLoadingHistory(false);
    }
  };

  const deleteHistoryEntry = async (historyId: number) => {
    // Confirmación elegante con toast
    const t = toast(
      (t) => (
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <p className="font-medium">¿Eliminar entrada del historial?</p>
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                performDelete(historyId);
              }}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Eliminar
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
      },
    );
  };

  const performDelete = async (historyId: number) => {
    try {
      const response = await fetch(`/sync/history/${historyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        // Recargar el historial
        await fetchSyncHistory();
        toast.success("Entrada del historial eliminada con éxito.");
      } else {
        toast.error("Error al eliminar la entrada del historial.");
      }
    } catch (error) {
      console.error("Error deleting history entry:", error);
      toast.error("Error de red al eliminar la entrada del historial.");
    }
  };

  // Al seleccionar un proyecto para editar, precargar los datos en el formulario
  useEffect(() => {
    if (selectedProject && editMode) {
      setFormData({
        serviceName: selectedProject.name || "",
        description: selectedProject.description || "",
        pattern: selectedProject.pattern || "",
        tags: selectedProject.tags || "",
        frontendAssociation: selectedProject.frontendAssociation || "",
        contact: selectedProject.contact || "",
        functions: selectedProject.functions
          ? JSON.parse(selectedProject.functions)
          : [],
      });
    }
  }, [selectedProject, editMode]);

  useEffect(() => {
    if (selectedProject) {
      setLoadingHistory(true);
      setHistoryError(null);
      fetch(`/sync/projects/${selectedProject.id}/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) =>
          res.ok ? res.json() : Promise.reject("Error al cargar historial"),
        )
        .then((data) => setSyncHistory(data))
        .catch(() => setHistoryError("No se pudo cargar el historial"))
        .finally(() => setLoadingHistory(false));
    }
  }, [selectedProject, syncing, syncSuccess]);

  const fetchSyncProjects = async () => {
    try {
      const response = await fetch("/sync/projects", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const projects = await response.json();
        console.log("Proyectos recibidos:", projects); // Debug
        setSyncProjects(projects);
      } else {
        console.error(
          "Error en la respuesta:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error fetching sync projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = syncProjects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreate = async () => {
    try {
      const response = await fetch("/sync/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          type: createType,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          serviceName: "",
          description: "",
          pattern: "",
          tags: "",
          frontendAssociation: "",
          contact: "",
          functions: [],
        });
        // Recargar proyectos
        fetchSyncProjects();
      }
    } catch (error) {
      console.error("Error creating sync project:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/sync/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        fetchSyncProjects();
      }
    } catch (error) {
      console.error("Error deleting sync project:", error);
    }
  };

  const addFunction = (functionName: string) => {
    if (functionName && !formData.functions.includes(functionName)) {
      setFormData((prev) => ({
        ...prev,
        functions: [...prev.functions, functionName],
      }));
    }
  };

  const removeFunction = (functionName: string) => {
    setFormData((prev) => ({
      ...prev,
      functions: prev.functions.filter((f) => f !== functionName),
    }));
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col justify-center">
            <div
              className="w-full bg-white border border-gray-200 rounded-lg shadow-sm my-8 px-12 py-8"
              style={{ maxWidth: "100%", minWidth: 0 }}
            >
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => {
                    setCreateType("bff");
                    setFormData({
                      serviceName: "",
                      description: "",
                      pattern: "",
                      tags: "",
                      frontendAssociation: "",
                      contact: "",
                      functions: [],
                    });
                  }}
                  className={`px-4 py-2 rounded font-semibold border transition-colors duration-150 ${createType === "bff" ? "bg-green-100 text-black border-green-400" : "bg-white text-black border-green-100 hover:bg-green-50"}`}
                >
                  {"< BFF"}
                </button>
                <button
                  onClick={() => {
                    setCreateType("sidecar");
                    setFormData({
                      serviceName: "",
                      description: "",
                      pattern: "",
                      tags: "",
                      frontendAssociation: "",
                      contact: "",
                      functions: [],
                    });
                  }}
                  className={`px-4 py-2 rounded font-semibold border transition-colors duration-150 ${createType === "sidecar" ? "bg-green-100 text-black border-green-400" : "bg-white text-black border-green-100 hover:bg-green-50"}`}
                >
                  Sidecar
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del servicio
                  </label>
                  <input
                    type="text"
                    value={formData.serviceName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        serviceName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ingresa el nombre del servicio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Describe el servicio"
                  />
                </div>
                {createType === "bff" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patrón
                    </label>
                    <select
                      value={formData.pattern}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pattern: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Selecciona un patrón</option>
                      <option value="monolito">Monolito</option>
                      <option value="microservicio">Microservicio</option>
                      <option value="nube">Nube</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="no-asignado">No asignado</option>
                    </select>
                  </div>
                )}
                {createType === "sidecar" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funciones
                    </label>
                    <div className="flex gap-2 mb-1">
                      <input
                        type="text"
                        placeholder="Envío de Notificaciones"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addFunction(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Registro de Notificaciones"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addFunction(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.functions.map((func, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded bg-green-100 text-green-800 text-xs font-medium"
                        >
                          {func}
                          <button
                            type="button"
                            className="ml-2 text-red-500 hover:text-red-700"
                            onClick={() => removeFunction(func)}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asociación de Frontends
                  </label>
                  <input
                    type="text"
                    value={formData.frontendAssociation}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        frontendAssociation: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Frontends asociados"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Información de contacto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción adicional
                  </label>
                  <textarea
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descripción adicional"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 rounded font-semibold border border-green-400 bg-green-100 text-black hover:bg-green-200 transition-colors duration-150"
                  >
                    Cancelar
                  </button>
                  <Button
                    type="button"
                    onClick={handleCreate}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded"
                  >
                    Guardar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (selectedProject && editMode) {
    // Formulario de edición (igual que creación, pero precargado y con guardar cambios)
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col justify-center">
            <div
              className="w-full bg-white border border-gray-200 rounded-lg shadow-sm my-8 px-12 py-8"
              style={{ maxWidth: "100%", minWidth: 0 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Editar proyecto
                </h2>
              </div>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditLoading(true);
                  setEditError(null);
                  setEditSuccess(false);
                  try {
                    const response = await fetch(
                      `/sync/projects/${selectedProject.id}`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        body: JSON.stringify({
                          ...formData,
                          type: selectedProject.pattern, // Assuming pattern is the new type
                        }),
                      },
                    );
                    if (response.ok) {
                      setEditSuccess(true);
                      setTimeout(() => {
                        setEditMode(false);
                        setSelectedProject(null);
                        fetchSyncProjects();
                      }, 1200);
                    } else {
                      setEditError("Error al guardar los cambios");
                    }
                  } catch (err) {
                    setEditError("Error de red");
                  } finally {
                    setEditLoading(false);
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del servicio
                  </label>
                  <input
                    type="text"
                    value={formData.serviceName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        serviceName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ingresa el nombre del servicio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Describe el servicio"
                  />
                </div>
                {selectedProject.pattern === "monolito" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patrón
                    </label>
                    <select
                      value={formData.pattern}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pattern: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Selecciona un patrón</option>
                      <option value="monolito">Monolito</option>
                      <option value="microservicio">Microservicio</option>
                      <option value="nube">Nube</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="no-asignado">No asignado</option>
                    </select>
                  </div>
                )}
                {selectedProject.pattern === "microservicio" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funciones
                    </label>
                    <div className="flex gap-2 mb-1">
                      <input
                        type="text"
                        placeholder="Envío de Notificaciones"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addFunction(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Registro de Notificaciones"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addFunction(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.functions.map((func, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded bg-green-100 text-green-800 text-xs font-medium"
                        >
                          {func}
                          <button
                            type="button"
                            className="ml-2 text-red-500 hover:text-red-700"
                            onClick={() => removeFunction(func)}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asociación de Frontends
                  </label>
                  <input
                    type="text"
                    value={formData.frontendAssociation}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        frontendAssociation: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Frontends asociados"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Información de contacto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción adicional
                  </label>
                  <textarea
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descripción adicional"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setEditError(null);
                      setEditSuccess(false);
                    }}
                    className="px-6 py-2 rounded font-semibold border border-green-400 bg-green-100 text-black hover:bg-green-200 transition-colors duration-150"
                  >
                    Cancelar
                  </button>
                  <Button
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded"
                  >
                    {editLoading ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
                {editError && (
                  <div className="text-red-600 mt-2">{editError}</div>
                )}
                {editSuccess && (
                  <div className="text-green-600 mt-2">¡Cambios guardados!</div>
                )}
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-start">
            {/* Modal de Loading */}
            {syncing && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-12 shadow-2xl border border-gray-200 z-10 min-w-[300px]">
                <div className="text-center">
                  {/* Spinner principal con SVG más grande */}
                  <div className="mb-6">
                    <svg
                      width={100}
                      height={100}
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-24 h-24 mx-auto"
                    >
                      {/* Central "Brain" Node - Pulsing */}
                      <circle
                        cx="50"
                        cy="50"
                        r="15"
                        fill="#4CAF50"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="r"
                          values="15;18;15"
                          dur="3s"
                          repeatCount="indefinite"
                          keyTimes="0;0.5;1"
                          calcMode="spline"
                          keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.8;1;0.8"
                          dur="3s"
                          repeatCount="indefinite"
                          keyTimes="0;0.5;1"
                          calcMode="spline"
                          keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                        />
                      </circle>

                      {/* Orbiting Nodes and Connecting Lines */}
                      <g transform="rotate(0 50 50)">
                        {/* Group for rotation */}
                        <animateTransform
                          attributeName="transform"
                          attributeType="XML"
                          type="rotate"
                          from="0 50 50"
                          to="360 50 50"
                          dur="8s"
                          repeatCount="indefinite"
                        />

                        {/* Node 1 */}
                        <circle
                          cx="50"
                          cy="25"
                          r="6"
                          fill="#8BC34A"
                          opacity="0.9"
                        >
                          <animate
                            attributeName="opacity"
                            values="0.9;0.6;0.9"
                            dur="2.5s"
                            begin="0s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="25"
                          stroke="#388E3C"
                          strokeWidth="3.125"
                          strokeLinecap="round"
                          strokeDasharray="10 10"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            values="0; -20"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </line>

                        {/* Node 2 */}
                        <circle
                          cx="71.65"
                          cy="62.5"
                          r="6"
                          fill="#8BC34A"
                          opacity="0.9"
                        >
                          <animate
                            attributeName="opacity"
                            values="0.9;0.6;0.9"
                            dur="2.5s"
                            begin="0.8s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <line
                          x1="50"
                          y1="50"
                          x2="71.65"
                          y2="62.5"
                          stroke="#388E3C"
                          strokeWidth="3.125"
                          strokeLinecap="round"
                          strokeDasharray="10 10"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            values="0; -20"
                            dur="2s"
                            begin="0.5s"
                            repeatCount="indefinite"
                          />
                        </line>

                        {/* Node 3 */}
                        <circle
                          cx="28.35"
                          cy="62.5"
                          r="6"
                          fill="#8BC34A"
                          opacity="0.9"
                        >
                          <animate
                            attributeName="opacity"
                            values="0.9;0.6;0.9"
                            dur="2.5s"
                            begin="1.6s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <line
                          x1="50"
                          y1="50"
                          x2="28.35"
                          y2="62.5"
                          stroke="#388E3C"
                          strokeWidth="3.125"
                          strokeLinecap="round"
                          strokeDasharray="10 10"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            values="0; -20"
                            dur="2s"
                            begin="1s"
                            repeatCount="indefinite"
                          />
                        </line>
                      </g>
                    </svg>
                  </div>

                  {/* Solo texto simple */}
                  <p className="text-gray-600 font-medium text-lg">
                    Sincronizando...
                  </p>
                </div>
              </div>
            )}
            <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-lg shadow-sm mt-8 mb-8 px-8 py-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedProject.name}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setSyncing(true);
                      setSyncError(null);
                      setSyncSuccess(false);
                      try {
                        const start = Date.now();
                        const response = await fetch(
                          `/sync/projects/${selectedProject.id}/sync`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                          },
                        );
                        const elapsed = Date.now() - start;
                        const minLoader = 1500;
                        if (elapsed < minLoader) {
                          await new Promise((res) =>
                            setTimeout(res, minLoader - elapsed),
                          );
                        }
                        if (response.ok) {
                          const data = await response.json();
                          setSyncSuccess(true);
                          setSelectedProject({
                            ...selectedProject,
                            lastSync: data.lastSync,
                          });
                          setLastSyncHighlight(true);
                          setTimeout(() => setLastSyncHighlight(false), 1200);
                          // Recargar historial después de sincronizar
                          await fetchSyncHistory();
                          // Recargar notificaciones
                          const token = localStorage.getItem("token");
                          if (token) {
                            await fetchNotifications(token);
                          }
                        } else {
                          setSyncError("Error al sincronizar");
                          toast.error("Error al sincronizar el proyecto");
                        }
                      } catch (err) {
                        setSyncError("Error de red");
                        toast.error("Error de red al sincronizar");
                      } finally {
                        setSyncing(false);
                        setTimeout(() => setSyncSuccess(false), 2000);
                      }
                    }}
                    className="px-4 py-2 rounded font-semibold border border-green-400 bg-green-100 text-black hover:bg-green-200 transition-colors duration-150"
                    disabled={syncing}
                  >
                    Sincronizar ahora
                  </button>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 rounded font-semibold border border-green-400 bg-green-100 text-black hover:bg-green-200 transition-colors duration-150"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 rounded font-semibold border border-green-400 bg-green-100 text-black hover:bg-green-200 transition-colors duration-150"
                  >
                    Volver
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-2">
                    <span className="font-semibold">Tipo:</span>{" "}
                    {selectedProject.pattern === "monolito"
                      ? "Monolito"
                      : selectedProject.pattern === "microservicio"
                        ? "Microservicio"
                        : selectedProject.pattern}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Descripción:</span>{" "}
                    {selectedProject.description}
                  </div>
                  {selectedProject.pattern === "monolito" && (
                    <div className="mb-2">
                      <span className="font-semibold">Patrón:</span>{" "}
                      {selectedProject.pattern || "-"}
                    </div>
                  )}
                  {selectedProject.pattern === "microservicio" && (
                    <div className="mb-2">
                      <span className="font-semibold">Funciones:</span>{" "}
                      {selectedProject.functions
                        ? JSON.parse(selectedProject.functions).join(", ")
                        : "-"}
                    </div>
                  )}
                  <div className="mb-2">
                    <span className="font-semibold">
                      Asociación de Frontends:
                    </span>{" "}
                    {selectedProject.frontendAssociation || "-"}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Contacto:</span>{" "}
                    {selectedProject.contact || "-"}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">
                      Descripción adicional:
                    </span>{" "}
                    {selectedProject.tags || "-"}
                  </div>
                </div>
                <div>
                  <div className="mb-2">
                    <span className="font-semibold">Estado:</span>{" "}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Activo
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">
                      Última sincronización:
                    </span>{" "}
                    <span
                      className={
                        lastSyncHighlight
                          ? "bg-green-200 transition-all duration-700 px-2 rounded"
                          : ""
                      }
                    >
                      {selectedProject.lastSync
                        ? new Date(
                            selectedProject.lastSync,
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
              {syncSuccess && (
                <div className="text-green-600 mt-4">
                  ¡Sincronización exitosa!
                </div>
              )}
              {syncError && (
                <div className="text-red-600 mt-4">{syncError}</div>
              )}

              {/* Historial de sincronizaciones */}
              <div className="mt-10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-green-700">
                    Historial de sincronizaciones
                  </h3>
                  <button
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        history: !prev.history,
                      }))
                    }
                    className="text-sm text-green-600 hover:text-green-800 px-3 py-1 rounded-md hover:bg-green-50 transition-colors"
                  >
                    {expandedSections.history ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {loadingHistory ? (
                  <div className="text-green-600">Cargando historial...</div>
                ) : historyError ? (
                  <div className="text-red-600">{historyError}</div>
                ) : syncHistory.length === 0 ? (
                  <div className="text-gray-500">
                    No hay sincronizaciones registradas.
                  </div>
                ) : expandedSections.history ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-green-200 rounded-lg">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-green-800 font-semibold">
                            Fecha
                          </th>
                          <th className="px-4 py-2 text-left text-green-800 font-semibold">
                            Estado
                          </th>
                          <th className="px-4 py-2 text-left text-green-800 font-semibold">
                            Mensaje
                          </th>
                          <th className="px-4 py-2 text-left text-green-800 font-semibold">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncHistory.map((h, idx) => (
                          <tr
                            key={h.id}
                            className={
                              idx % 2 === 0 ? "bg-green-50" : "bg-white"
                            }
                          >
                            <td className="px-4 py-2 text-gray-700">
                              {new Date(h.date).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${h.status === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                              >
                                {h.status === "success" ? "Éxito" : "Error"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              {h.message || "-"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => deleteHistoryEntry(h.id)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Métricas de IA y Análisis */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-green-700">
                  Análisis de IA y Métricas
                </h3>
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      aiMetrics: !prev.aiMetrics,
                    }))
                  }
                  className="text-sm text-green-600 hover:text-green-800 px-3 py-1 rounded-md hover:bg-green-50 transition-colors"
                >
                  {expandedSections.aiMetrics ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {expandedSections.aiMetrics && (
                <>
                  {loadingMetrics ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Analizando con IA...</p>
                    </div>
                  ) : aiMetrics ? (
                    <>
                      {/* Gráfico de rendimiento de sincronización */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white border border-green-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Rendimiento de Sincronización
                          </h4>
                          <div className="h-64">
                            <Chart
                              options={{
                                chart: {
                                  type: "line",
                                  fontFamily: "Inter, sans-serif",
                                  toolbar: { show: false },
                                },
                                colors: ["#10B981"],
                                stroke: { curve: "smooth", width: 3 },
                                xaxis: {
                                  categories: [
                                    "Lun",
                                    "Mar",
                                    "Mié",
                                    "Jue",
                                    "Vie",
                                    "Sáb",
                                    "Dom",
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
                                    style: {
                                      colors: "#6B7280",
                                      fontSize: "12px",
                                    },
                                  },
                                },
                                tooltip: { theme: "light" },
                              }}
                              series={[
                                {
                                  name: "Tiempo de Sincronización (ms)",
                                  data: Array.isArray(aiMetrics.performanceData)
                                    ? aiMetrics.performanceData
                                    : [120, 95, 140, 110, 85, 130, 105],
                                },
                              ]}
                              type="line"
                              height="100%"
                            />
                          </div>
                        </div>

                        <div className="bg-white border border-green-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Patrones Detectados
                          </h4>
                          <div className="h-64">
                            <Chart
                              options={{
                                chart: {
                                  type: "donut",
                                  fontFamily: "Inter, sans-serif",
                                },
                                colors: [
                                  "#22c55e", // Verde claro - BFF
                                  "#16a34a", // Verde medio - Sidecar
                                  "#15803d", // Verde oscuro - Monolito
                                  "#166534", // Verde muy oscuro - Microservicios
                                ],
                                labels: [
                                  "BFF",
                                  "Sidecar",
                                  "Monolito",
                                  "Microservicios",
                                ],
                                legend: {
                                  position: "bottom",
                                  fontSize: "12px",
                                  labels: {
                                    colors: "#374151",
                                  },
                                },
                                dataLabels: {
                                  enabled: true,
                                  formatter: (val: number) => val + "%",
                                  style: {
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                  },
                                },
                                plotOptions: {
                                  pie: {
                                    donut: {
                                      size: "60%",
                                    },
                                  },
                                },
                              }}
                              series={[
                                aiMetrics.patterns?.bff || 0,
                                aiMetrics.patterns?.sidecar || 0,
                                aiMetrics.patterns?.monolith || 0,
                                aiMetrics.patterns?.microservices || 0,
                              ].map((val) => Number(val))}
                              type="donut"
                              height="100%"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sugerencias de IA */}
                      <div className="bg-white border border-green-200 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Sugerencias de IA
                        </h4>
                        <div className="space-y-3">
                          {(aiMetrics.suggestions || []).map(
                            (suggestion, index) => (
                              <div
                                key={index}
                                className={`flex items-start space-x-3 p-3 rounded-lg ${
                                  suggestion.priority === "high"
                                    ? "bg-red-50"
                                    : suggestion.priority === "medium"
                                      ? "bg-green-100"
                                      : "bg-green-50"
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 ${
                                    suggestion.priority === "high"
                                      ? "bg-red-500"
                                      : suggestion.priority === "medium"
                                        ? "bg-green-600"
                                        : "bg-green-500"
                                  }`}
                                ></div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {suggestion.title}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {suggestion.description}
                                  </p>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Métricas de rendimiento */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Tiempo Promedio
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {aiMetrics.performance?.averageTime || 0}ms
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-lg">⚡</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Tasa de Éxito
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {aiMetrics.performance?.successRate || 0}%
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-lg">✓</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Optimizaciones IA
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {aiMetrics.performance?.optimizations || 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-lg">🤖</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No hay datos de IA disponibles para este proyecto.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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

        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-white p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 w-80"
                />
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Crear
              </Button>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Proyectos sincronizados
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando proyectos...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <FolderIcon className="w-8 h-8 text-gray-400 mr-3" />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {project.pattern === "monolito"
                                ? "Monolito"
                                : project.pattern === "microservicio"
                                  ? "Microservicio"
                                  : project.pattern}
                            </p>
                            <p className="text-xs text-gray-400">
                              Última sincronización:{" "}
                              {new Date(project.lastSync).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            project.pattern === "monolito" ||
                            project.pattern === "microservicio"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {project.pattern === "monolito" ||
                          project.pattern === "microservicio"
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center items-center space-x-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Anterior
              </button>
              <button className="px-3 py-2 text-sm font-medium text-white bg-green-500 border border-green-500 rounded-md">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                4
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                5
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8"></div>
      <Footer />
    </div>
  );
}
