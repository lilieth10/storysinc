"use client";

import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/store/auth";
import toast from "react-hot-toast";
// Lazy load Monaco Editor for better performance
const Editor = lazy(() => import("@monaco-editor/react"));
import {
  ArrowLeftIcon,
  DocumentIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  BookmarkIcon,
  PlayIcon,
  CodeBracketIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  LockOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  UserIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

/* eslint-disable @typescript-eslint/no-unused-vars */
/*
  This file has been optimized for better performance:
  - Lazy loading of Monaco Editor
  - Reduced bundle size
  - Faster initial load
  - Maintains all functionality
*/

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface ProjectCollaborator {
  id: number;
  role?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    fullName?: string;
  };
}

interface Project {
  id: number;
  name: string;
  description?: string;
  pattern: string;
  status: string;
  tags: string;
  language?: string;
  components?: string; // JSON string
  owner: {
    id: number;
    name: string;
    email: string;
    fullName?: string;
  };
  createdAt: string;
  updatedAt?: string;
  collaborators?: ProjectCollaborator[];
  lastModifiedBy?: number; // ✅ QUIÉN HIZO EL ÚLTIMO CAMBIO
  lastModifiedByUser?: string; // ✅ NOMBRE DEL USUARIO QUE HIZO EL CAMBIO
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

interface IAAnalysis {
  performance?: {
    score?: number;
    suggestions?: string[];
  };
  security?: {
    risks?: string[];
    score?: number;
  };
  bestPractices?: {
    issues?: string[];
    score?: number;
  };
  // Estructura real que viene de n8n (071-maqueta)
  output?: {
    Sugerencias?: string[];
    Advertencias?: string[];
    sugerencias?: string[]; // Versión en minúsculas
    advertencias?: string[]; // Versión en minúsculas
    optimizedCode?: string;
  };
  [key: string]: unknown; // Para permitir otras propiedades que puedan venir de n8n
}

interface IASuggestion {
  id: string;
  text: string;
  type: "suggestion" | "warning";
  accepted?: boolean;
  rejected?: boolean;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
  files: string[];
  additions: number;
  deletions: number;
}

interface GitRepository {
  name: string;
  url: string;
  branch: string;
  lastSync: string;
  status: 'synced' | 'pending' | 'error';
  commits: GitCommit[];
}

// Componente de loading optimizado
const EditorLoading = () => (
  <div className="flex items-center justify-center h-full bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-sm text-gray-600">Cargando editor...</p>
      <p className="text-xs text-gray-400 mt-2">
        Esto puede tomar unos segundos
      </p>
    </div>
  </div>
);

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token, user } = useAuth();
  const projectId = params.id as string;

  // Estados principales
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string>("");
  const [iaAnalysis, setIaAnalysis] = useState<IAAnalysis | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [showIAModal, setShowIAModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [iaSuggestions, setIaSuggestions] = useState<IASuggestion[]>([]);
  const [optimizedCode, setOptimizedCode] = useState<string>("");
  const [autoSaved, setAutoSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "code" | "collaborators" | "settings" | "versions"
  >("code");
  const [currentBranch, setCurrentBranch] = useState("main");
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isEditingCollaborators, setIsEditingCollaborators] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");

  // Estado para colaboradores
  const [showAddColab, setShowAddColab] = useState(false);
  const [newColab, setNewColab] = useState({
    name: "",
    email: "",
    role: "Editor"
  });
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [colabRoles, setColabRoles] = useState<{[key: number]: string}>({});
  
  // Estado para versiones
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  
  // 🔥 COLABORACIÓN SIMPLE: Polling para cambios
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Estado para edición de configuración
  const [editConfig, setEditConfig] = useState({
    name: "",
    description: "",
  });
  useEffect(() => {
    if (project) {
      setEditConfig({
        name: project.name || "",
        description: project.description || "",
      });
    }
  }, [project]);

  const handleConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setEditConfig({ ...editConfig, [e.target.name]: e.target.value });
  };

  const handleConfigSave = async () => {
    try {
      await api.put(
        `/projects/${projectId}`,
        {
          name: editConfig.name,
          description: editConfig.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Cambios guardados");
      fetchProject();
      setIsEditingConfig(false);
    } catch {
      toast.error("Error al guardar los cambios");
    }
  };

  // Funciones de API (mover antes del useEffect)
  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(response.data);
    } catch {
      toast.error("Error al cargar el proyecto");
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  }, [projectId, token, router]);

  const fetchFileTree = useCallback(async () => {
    try {
      const response = await api.get(`/projects/${projectId}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFileTree(response.data);
    } catch (error) {
      console.error("Error fetching file tree:", error);
      // No mostrar error al usuario, usar estructura por defecto
    }
  }, [projectId, token]);

  const fetchVersions = useCallback(async () => {
    if (!projectId || !token) return;
    
    try {
      setLoadingVersions(true);
      const response = await api.get(`/versions/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVersions(response.data || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Error al cargar el historial de versiones");
    } finally {
      setLoadingVersions(false);
    }
  }, [projectId, token]);

  // 🔥 COLABORACIÓN SIMPLE: Detectar cambios de otros usuarios
  const checkForUpdates = useCallback(async () => {
    if (!projectId || !token || !project) return;
    
    try {
      // Verificar cambios en el proyecto
      const projectResponse = await api.get(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const updatedProject = projectResponse.data;
      const projectLastUpdate = new Date(updatedProject.updatedAt || updatedProject.createdAt);
      
      // Verificar actualizaciones del proyecto
      
      // Si hay cambios más recientes que la última actualización conocida
      if (projectLastUpdate > lastUpdate) {
        setLastUpdate(projectLastUpdate);
        
        // ✅ SOLO NOTIFICAR A OTROS COLABORADORES, NO AL QUE HIZO EL CAMBIO
        if (updatedProject.updatedAt !== project.updatedAt) {
          // Verificar si el cambio fue hecho por otro usuario
          const currentUserId = user?.id;
          const lastModifiedBy = updatedProject.lastModifiedBy;
          const isMyChange = currentUserId === lastModifiedBy;
          

          
          // 🔥 MEJORAR LÓGICA: Solo notificar si NO es mi cambio Y hay un modificador Y ha pasado tiempo suficiente
          const timeSinceLastUpdate = projectLastUpdate.getTime() - lastUpdate.getTime();
          const hasEnoughTimePassed = timeSinceLastUpdate > 1000; // Al menos 1 segundo
          
          if (!isMyChange && lastModifiedBy && lastModifiedBy !== currentUserId && hasEnoughTimePassed) {
            const authorName = updatedProject.lastModifiedByUser || 'Otro colaborador';

            toast(`🔄 Proyecto actualizado por ${authorName}`, {
              duration: 3000,
              icon: '👥',
              style: { background: '#F3E5F5', color: '#7B1FA2' }
            });
          }
          
          // Recargar el proyecto
          setProject(updatedProject);
          
          // Si estamos en la pestaña de versiones, recargar versiones también
          if (activeTab === "versions") {
            fetchVersions();
          }
        }
      }
      
      // 🔥 VERIFICAR CAMBIOS EN ARCHIVOS ESPECÍFICOS
      // DESHABILITADO: No actualizar automáticamente el contenido del editor
      // para evitar interferencias con el trabajo del usuario
      if (selectedFile) {
        try {
          const fileResponse = await api.get(`/projects/${projectId}/files/${selectedFile.name}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const updatedFileContent = fileResponse.data?.content;
          
          // Solo notificar si hay cambios pero NO actualizar automáticamente
          if (updatedFileContent && updatedFileContent !== editorContent) {
            // Verificar si hay cambios locales no guardados
            const localStorageKey = `project_${projectId}_file_${selectedFile.id}`;
            const savedData = localStorage.getItem(localStorageKey);
            let hasLocalChanges = false;
            
            if (savedData) {
              try {
                const parsed = JSON.parse(savedData);
                const localContent = parsed.content || "";
                // Si el contenido local es diferente al contenido del archivo original, hay cambios locales
                hasLocalChanges = localContent !== selectedFile.content;
              } catch {
                hasLocalChanges = false;
              }
            }
            
                      // Comentado: Notificaciones removidas por solicitud del usuario
          // if (hasLocalChanges) {
          //   toast(`⚠️ Hay cambios locales en ${selectedFile.name}. Los cambios del servidor no se aplicaron automáticamente.`, {
          //     duration: 5000,
          //     icon: '⚠️',
          //     style: { background: '#FFF3CD', color: '#856404' }
          //   });
          // } else {
          //   toast(`📝 ${selectedFile.name} tiene cambios disponibles en el servidor. Recarga para ver los cambios.`, {
          //     duration: 4000,
          //     icon: '📝',
          //     style: { background: '#E3F2FD', color: '#1565C0' }
          //   });
          // }
          }
        } catch (fileError) {
          console.error("Error checking file updates:", fileError);
        }
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  }, [projectId, token, project, lastUpdate, activeTab, fetchVersions, selectedFile, editorContent, user?.id]);

  // Cargar datos en paralelo para mejor rendimiento
  useEffect(() => {
    if (projectId && token) {
      Promise.all([fetchProject(), fetchFileTree()]).catch(console.error);
    }
  }, [fetchProject, fetchFileTree, projectId, token]);

  // Cargar versiones cuando se selecciona la pestaña
  useEffect(() => {
    if (activeTab === "versions" && projectId && token) {
      fetchVersions();
    }
  }, [activeTab, fetchVersions, projectId, token]);

  // 🔥 POLLING para colaboración en tiempo real (cada 5 segundos)
  useEffect(() => {
    if (!projectId || !token) return;

    const interval = setInterval(() => {
      checkForUpdates();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [checkForUpdates, projectId, token]);

  // Función para guardar automáticamente en localStorage
  const saveToLocalStorage = useCallback(
    (content: string) => {
      if (selectedFile) {
        const localStorageKey = `project_${projectId}_file_${selectedFile.id}`;
        const savedData = {
          content,
          timestamp: new Date().toISOString(),
          fileName: selectedFile.name,
        };
        localStorage.setItem(localStorageKey, JSON.stringify(savedData));

        // Mostrar indicador de guardado automático
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    },
    [selectedFile, projectId],
  );

  const getLanguageFromFile = (filename: string, content?: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
    };

    // Si tenemos contenido, intentar detectar el lenguaje por contenido
    if (typeof content === "string" && content.length > 0) {
      const contentLower = content.toLowerCase();

      if (contentLower.includes("<!doctype html") || contentLower.includes("<html")) {
        return "html";
      }

      // Verificar si es Python primero (más específico)
      if (
        contentLower.includes("def ") ||
        contentLower.includes("import ") ||
        contentLower.includes("print(") ||
        contentLower.includes("from ")
      ) {
        return "python";
      }

      // Verificar si es JavaScript/TypeScript
      if (contentLower.includes("console.log") || contentLower.includes("function ") || contentLower.includes("const ") || contentLower.includes("let ") || contentLower.includes("var ")) {
        return "javascript";
      }
    }

    return languageMap[ext || ""] || "javascript";
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpanded(newExpanded);
  };

  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);

    // Cargar contenido guardado en localStorage si existe
    const localStorageKey = `project_${projectId}_file_${file.id}`;
    const savedData = localStorage.getItem(localStorageKey);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const savedContent = parsed.content || "";
        const originalContent = file.content || "";
        
        // Si el contenido guardado es diferente al original, usar el guardado
        if (savedContent !== originalContent) {
          setEditorContent(savedContent);
          // Mostrar indicador de que hay cambios locales
          toast(`📝 Cargando cambios locales de ${file.name}`, {
            duration: 2000,
            icon: '💾',
            style: { background: '#E8F5E8', color: '#2E7D32' }
          });
        } else {
          // Si son iguales, limpiar localStorage y usar el contenido original
          localStorage.removeItem(localStorageKey);
          setEditorContent(originalContent);
        }
      } catch {
        setEditorContent(file.content || "");
      }
    } else {
      setEditorContent(file.content || "");
    }

    setIaAnalysis(null); // Limpiar análisis anterior
  };

  const analyzeWithIA = useCallback(async () => {
    if (!selectedFile) return;

    setLoadingIA(true);
    setShowIAModal(true);
    try {
      const response = await api.post(
        `/ai/optimize-code-with-n8n`,
        {
          projectId: parseInt(projectId),
          fileName: selectedFile.name,
          code: editorContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Procesar sugerencias y advertencias
      const suggestions: IASuggestion[] = [];
      let optimizedCodeResult = null;

      // Buscar código optimizado en la respuesta
      if (
        response.data.output?.optimizedCode &&
        typeof response.data.output.optimizedCode === "string"
      ) {
        optimizedCodeResult = response.data.output.optimizedCode;
      } else if (
        response.data.optimizedCode &&
        typeof response.data.optimizedCode === "string"
      ) {
        optimizedCodeResult = response.data.optimizedCode;
      } else if (
        response.data.iaAnalysis?.output?.optimizedCode &&
        typeof response.data.iaAnalysis.output.optimizedCode === "string"
      ) {
        optimizedCodeResult = response.data.iaAnalysis.output.optimizedCode;
      } else if (
        response.data.output?.optimizacion &&
        typeof response.data.output.optimizacion === "string"
      ) {
        optimizedCodeResult = response.data.output.optimizacion;
      } else if (
        response.data.optimizacion &&
        typeof response.data.optimizacion === "string"
      ) {
        optimizedCodeResult = response.data.optimizacion;
      }

      // Procesar sugerencias y advertencias
      const output = response.data.iaAnalysis?.output || response.data.output;

      if (output) {
        // Procesar sugerencias
        if (output.Sugerencias && Array.isArray(output.Sugerencias)) {
          output.Sugerencias.forEach((sugerencia: string, index: number) => {
            suggestions.push({
              id: `suggestion_${index}`,
              text: sugerencia,
              type: "suggestion",
            });
          });
        } else if (output.sugerencias && Array.isArray(output.sugerencias)) {
          output.sugerencias.forEach((sugerencia: string, index: number) => {
            suggestions.push({
              id: `suggestion_${index}`,
              text: sugerencia,
              type: "suggestion",
            });
          });
        }

        // Procesar advertencias
        if (output.Advertencias && Array.isArray(output.Advertencias)) {
          output.Advertencias.forEach((advertencia: string, index: number) => {
            suggestions.push({
              id: `warning_${index}`,
              text: advertencia,
              type: "warning",
            });
          });
        } else if (output.advertencias && Array.isArray(output.advertencias)) {
          output.advertencias.forEach((advertencia: string, index: number) => {
            suggestions.push({
              id: `warning_${index}`,
              text: advertencia,
              type: "warning",
            });
          });
        }
      }

      // Guardar el análisis de IA
      setIaAnalysis({
        output: response.data.iaAnalysis?.output || response.data.output,
      });

      if (suggestions.length > 0) {
        // Si hay sugerencias, mostrar el modal de sugerencias
        setIaSuggestions(suggestions);
        setOptimizedCode(optimizedCodeResult || editorContent);
        setShowSuggestionsModal(true);
      } else if (optimizedCodeResult) {
        // Si no hay sugerencias pero hay código optimizado, aplicarlo directamente
        setEditorContent(String(optimizedCodeResult));
        saveToLocalStorage(String(optimizedCodeResult));
        toast.success("Código optimizado aplicado");
      } else {
        toast.error("No se pudo obtener código optimizado");
      }
    } catch (error) {
      console.error("Error al optimizar código con IA:", error);
      toast.error("Error al optimizar código con IA");
    } finally {
      setLoadingIA(false);
      setShowIAModal(false);
    }
  }, [selectedFile, editorContent, projectId, token, saveToLocalStorage]);

  // Funciones para manejar sugerencias de IA
  const acceptSuggestion = useCallback((suggestionId: string) => {
    setIaSuggestions((prev) =>
      prev.map((s) =>
        s.id === suggestionId ? { ...s, accepted: true, rejected: false } : s,
      ),
    );
  }, []);

  const rejectSuggestion = useCallback((suggestionId: string) => {
    setIaSuggestions((prev) =>
      prev.map((s) =>
        s.id === suggestionId ? { ...s, rejected: true, accepted: false } : s,
      ),
    );
  }, []);

  const applyAcceptedSuggestions = useCallback(() => {
    if (optimizedCode) {
      // Aplicar el código optimizado
      if (selectedFile) {
        const localStorageKey = `project_${projectId}_file_${selectedFile.id}`;
        const savedData = {
          content: String(optimizedCode),
          timestamp: new Date().toISOString(),
          fileName: selectedFile.name,
        };
        localStorage.setItem(localStorageKey, JSON.stringify(savedData));
        setEditorContent(String(optimizedCode));
      }
    }
    setShowSuggestionsModal(false);
    setIaSuggestions([]);
    setOptimizedCode("");
  }, [optimizedCode, selectedFile, projectId]);

  const closeSuggestionsModal = useCallback(() => {
    setShowSuggestionsModal(false);
    setIaSuggestions([]);
    setOptimizedCode("");
  }, []);

  // Función para analizar archivos src/ con IA
  const analyzeSrcFileWithIA = async (file: FileNode) => {
    if (!file || file.type !== "file") return;

    setLoadingIA(true);
    setShowIAModal(true);

    try {
      const response = await api.post(
        `/ai/optimize-code-with-n8n`,
        {
          projectId: parseInt(projectId),
          fileName: file.name,
          code: file.content || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Procesar sugerencias y advertencias
      const suggestions: IASuggestion[] = [];
      let optimizedCodeResult = null;

      // Buscar código optimizado en la respuesta
      if (
        response.data.output?.optimizedCode &&
        typeof response.data.output.optimizedCode === "string"
      ) {
        optimizedCodeResult = response.data.output.optimizedCode;
      } else if (
        response.data.optimizedCode &&
        typeof response.data.optimizedCode === "string"
      ) {
        optimizedCodeResult = response.data.optimizedCode;
      } else if (
        response.data.iaAnalysis?.output?.optimizedCode &&
        typeof response.data.iaAnalysis.output.optimizedCode === "string"
      ) {
        optimizedCodeResult = response.data.iaAnalysis.output.optimizedCode;
      } else if (
        response.data.output?.optimizacion &&
        typeof response.data.output.optimizacion === "string"
      ) {
        optimizedCodeResult = response.data.output.optimizacion;
      } else if (
        response.data.optimizacion &&
        typeof response.data.optimizacion === "string"
      ) {
        optimizedCodeResult = response.data.optimizacion;
      }

      // Procesar sugerencias y advertencias
      const output = response.data.iaAnalysis?.output || response.data.output;

      if (output) {
        // Procesar sugerencias
        if (output.Sugerencias && Array.isArray(output.Sugerencias)) {
          output.Sugerencias.forEach((sugerencia: string, index: number) => {
            suggestions.push({
              id: `suggestion_${index}`,
              text: sugerencia,
              type: "suggestion",
            });
          });
        } else if (output.sugerencias && Array.isArray(output.sugerencias)) {
          output.sugerencias.forEach((sugerencia: string, index: number) => {
            suggestions.push({
              id: `suggestion_${index}`,
              text: sugerencia,
              type: "suggestion",
            });
          });
        }

        // Procesar advertencias
        if (output.Advertencias && Array.isArray(output.Advertencias)) {
          output.Advertencias.forEach((advertencia: string, index: number) => {
            suggestions.push({
              id: `warning_${index}`,
              text: advertencia,
              type: "warning",
            });
          });
        } else if (output.advertencias && Array.isArray(output.advertencias)) {
          output.advertencias.forEach((advertencia: string, index: number) => {
            suggestions.push({
              id: `warning_${index}`,
              text: advertencia,
              type: "warning",
            });
          });
        }
      }

      // Guardar el análisis de IA
      setIaAnalysis({
        output: response.data.iaAnalysis?.output || response.data.output,
      });

      if (suggestions.length > 0) {
        // Si hay sugerencias, mostrar el modal de sugerencias
        setIaSuggestions(suggestions);
        setOptimizedCode(optimizedCodeResult || file.content || "");
        setShowSuggestionsModal(true);
      } else if (optimizedCodeResult) {
        // Si no hay sugerencias pero hay código optimizado, aplicarlo directamente al fileTree
        const localStorageKey = `project_${projectId}_file_${file.id}`;
        const savedData = {
          content: String(optimizedCodeResult),
          timestamp: new Date().toISOString(),
          fileName: file.name,
        };
        localStorage.setItem(localStorageKey, JSON.stringify(savedData));

        // Actualizar el archivo en el árbol
        setFileTree((prevFiles) => {
          const updateFileInTree = (files: FileNode[]): FileNode[] => {
            return files.map((f) => {
              if (f.id === file.id) {
                return { ...f, content: String(optimizedCodeResult) };
              }
              if (f.children) {
                return { ...f, children: updateFileInTree(f.children) };
              }
              return f;
            });
          };
          return updateFileInTree(prevFiles);
        });

        toast.success("Código optimizado aplicado");
      } else {
        toast.error("No se pudo obtener código optimizado");
      }
    } catch (error) {
      console.error("Error al analizar archivo con IA:", error);
      toast.error("Error al analizar el archivo con IA");
    } finally {
      setLoadingIA(false);
      setShowIAModal(false);
    }
  };

  // Verificar autenticación
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
  }, [token, router]);

  // Efectos principales
  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchFileTree();
    }
  }, [projectId, fetchProject, fetchFileTree]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        // setShowPublicDropdown(false); // This state was removed
        // setShowAddFileDropdown(false); // This state was removed
        // setShowCodeDropdown(false); // This state was removed
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const saveFile = useCallback(async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      // ✅ CORREGIR ENDPOINT: Usar la ruta correcta sin filePath en URL
      const response = await api.put(
        `/projects/${projectId}/files`,
        {
          filePath: selectedFile.path,
          content: editorContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        // ✅ GUARDAR INFORMACIÓN SOBRE QUIÉN HIZO EL CAMBIO
        const lastModifiedBy = response.data.lastModifiedBy;
        const authorName = response.data.authorName;
        
        // 🔥 COLABORACIÓN: Actualizar timestamp después de guardar
        setLastUpdate(new Date());
        
        // ✅ NO ACTUALIZAR EL PROYECTO LOCALMENTE - DEJAR QUE EL POLLING LO HAGA
        // Esto evita que se muestre la notificación al usuario que guardó
        
        // ✅ NOTIFICACIÓN LOCAL: Solo mostrar al usuario que guardó
        toast.success("✅ Archivo guardado - Otros colaboradores verán los cambios");
        
        // 🔥 DELAY PARA EVITAR DETECCIÓN INMEDIATA DEL CAMBIO PROPIO
        setTimeout(() => {
          setLastUpdate(new Date());
        }, 2000); // Esperar 2 segundos antes de actualizar lastUpdate
        
        // 🔥 ACTUALIZAR VERSIONES SI ESTAMOS EN ESA PESTAÑA
        if (activeTab === "versions") {
          fetchVersions();
        }
      }
    } catch (error) {
      toast.error("Error al guardar el archivo");
    } finally {
      setSaving(false);
    }
  }, [selectedFile, editorContent, projectId, token, project, activeTab, fetchVersions]);

  const executeCode = useCallback(async () => {
    if (!selectedFile) return;

    setExecuting(true);
    setExecutionOutput("Ejecutando código...");

    try {
      const language = getLanguageFromFile(selectedFile.name, editorContent);
      const response = await api.post(
        `/projects/${projectId}/execute`,
        {
          filePath: selectedFile.path,
          content: editorContent,
          language: language,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setExecutionOutput(response.data.output);
        toast.success("Código ejecutado correctamente");
      } else {
        setExecutionOutput(
          `Error: ${response.data.error || "Error desconocido"}`,
        );
        toast.error("Error al ejecutar el código");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al ejecutar el código";
      setExecutionOutput(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setExecuting(false);
    }
  }, [selectedFile, editorContent, projectId, token]);

  const copyCode = () => {
    navigator.clipboard.writeText(editorContent);
    toast.success("Código copiado al portapapeles");
  };

  const createExecutableFile = () => {
    // Detectar el lenguaje basándose SOLO en el contenido del editor, no en el nombre del archivo
    let detectedLanguage = "javascript"; // Por defecto

    if (editorContent) {
      const content = editorContent.toLowerCase();

      // Detectar Python primero (más específico)
      if (
        content.includes("def ") ||
          content.includes("import ") ||
        content.includes("print(") ||
          content.includes("from ") ||
        content.includes("if __name__") ||
        (content.includes("class ") && content.includes(":"))
      ) {
        detectedLanguage = "python";
      }
      // Detectar HTML
      else if (
        content.includes("<!doctype html") ||
        content.includes("<html") ||
        content.includes("<head") ||
        content.includes("<body")
      ) {
        detectedLanguage = "html";
      }
      // JavaScript por defecto
      else {
        detectedLanguage = "javascript";
      }
    }

    let template = "";

    switch (detectedLanguage) {
      case "javascript":
        template = `// Código JavaScript ejecutable
console.log("¡Hola desde JavaScript!");

const suma = 2 + 2;
console.log("Resultado de la suma:", suma);

// Función simple
function saludar(nombre) {
  return \`¡Hola \${nombre}!\`;
}

const mensaje = saludar("Desarrollador");
console.log(mensaje);

// Array de números
const numeros = [1, 2, 3, 4, 5];
console.log("Array de números:", numeros);
console.log("Suma total:", numeros.reduce((a, b) => a + b, 0));`;
        break;
      case "python":
        template = `# Código Python ejecutable
print("¡Hola desde Python!")

# Calculadora simple
def suma(a, b):
    return a + b

resultado = suma(10, 5)
print(f"10 + 5 = {resultado}")

# Lista de números
numeros = [1, 2, 3, 4, 5]
print(f"Suma de números: {sum(numeros)}")`;
        break;
      case "html":
        template = `<!DOCTYPE html>
<html>
<head>
    <title>Mi Página</title>
</head>
<body>
    <h1>¡Hola Mundo!</h1>
    <p>Esta es una página HTML simple.</p>
                        <button onClick={() => toast.success('¡Funciona!')}>Click me</button>
</body>
</html>`;
        break;
      default:
        template = `// Código ejecutable
// Tu código aquí`;
    }

    // Crear un nuevo archivo ejecutable
    const newExecutableFile: FileNode = {
      id: `executable_${Date.now()}`,
      name: `ejecutable.${detectedLanguage === "javascript" ? "js" : detectedLanguage === "python" ? "py" : "html"}`,
      type: "file",
      path: `/ejecutable.${detectedLanguage === "javascript" ? "js" : detectedLanguage === "python" ? "py" : "html"}`,
      content: template,
      language: detectedLanguage,
    };

    // Agregar el archivo a la carpeta "ejecutables" en el fileTree
    setFileTree((prevFiles) => {
      const updateFileTree = (files: FileNode[]): FileNode[] => {
        // Buscar si ya existe la carpeta "ejecutables"
        const ejecutablesFolder = files.find(
          (f) => f.name === "ejecutables" && f.type === "folder",
        );

        if (ejecutablesFolder) {
          // Si existe, agregar el archivo a la carpeta
          return files.map((f) => {
            if (f.id === ejecutablesFolder.id) {
              return {
                ...f,
                children: [...(f.children || []), newExecutableFile],
              };
            }
            return f;
          });
        } else {
          // Si no existe, crear la carpeta y agregar el archivo
          const newEjecutablesFolder: FileNode = {
            id: `folder_ejecutables_${Date.now()}`,
            name: "ejecutables",
            type: "folder",
            path: "/ejecutables",
            children: [newExecutableFile],
          };
          return [...files, newEjecutablesFolder];
        }
      };

      return updateFileTree(prevFiles);
    });

    // Seleccionar automáticamente el nuevo archivo
    handleFileSelect(newExecutableFile);
    toast.success("Archivo ejecutable creado en carpeta 'ejecutables'");
  };

  const togglePreview = () => {
    if (
      getLanguageFromFile(selectedFile?.name || "", editorContent) === "html"
    ) {
      setPreviewContent(editorContent);
      setShowPreview(!showPreview);
    } else {
      toast("Previsualización solo disponible para archivos HTML", {
        icon: "ℹ️",
      });
    }
  };

  const handleBackToProjects = () => {
    router.push("/projects");
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 rounded ${
            selectedFile?.id === node.id
              ? "bg-green-50 text-green-600"
              : "text-gray-700"
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (node.type === "folder") {
              toggleExpanded(node.id);
            } else {
              handleFileSelect(node);
            }
          }}
        >
          {node.type === "folder" && (
            <>
              {expanded.has(node.id) ? (
                <ChevronDownIcon className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 mr-1" />
              )}
              <FolderIcon className="w-4 h-4 mr-2 text-green-500" />
            </>
          )}
          {node.type === "file" && (
            <DocumentIcon className="w-4 h-4 mr-2 text-gray-500 ml-5" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === "folder" && expanded.has(node.id) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };



  // Git mock state
  const [gitRepo, setGitRepo] = useState<GitRepository>({
    name: `${project?.name || 'project'}-repo`,
    url: `https://github.com/user/${project?.name || 'project'}-repo`,
    branch: 'main',
    lastSync: new Date().toISOString(),
    status: 'synced',
    commits: [
      {
        hash: 'a1b2c3d4',
        message: 'Initial commit - Project setup',
        author: project?.owner?.fullName || 'Owner',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        branch: 'main',
        files: ['package.json', 'README.md'],
        additions: 45,
        deletions: 0
      },
      {
        hash: 'e5f6g7h8',
        message: 'Add BFF pattern implementation',
        author: 'Carlos López',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        branch: 'feature/bff',
        files: ['src/bff/api.ts', 'src/bff/middleware.ts'],
        additions: 156,
        deletions: 12
      },
      {
        hash: 'i9j0k1l2',
        message: 'Add Sidecar service for logging',
        author: 'Ana Martínez',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        branch: 'feature/sidecar',
        files: ['src/sidecars/logging.ts', 'docker-compose.yml'],
        additions: 89,
        deletions: 5
      }
    ]
  });



  // Project sync function using real backend API
  const syncWithGit = async () => {
    setGitRepo(prev => ({ ...prev, status: 'pending' }));
    
    try {
      // Call real project sync API
      const syncResponse = await api.post(`/projects/${projectId}/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (syncResponse.data) {
        const newCommit: GitCommit = {
          hash: Math.random().toString(36).substring(2, 9),
          message: `Components sync: ${project?.components ? JSON.parse(project.components).map((c: any) => c.name).join(', ') : 'Project components'} updated`,
          author: project?.owner?.fullName || 'Owner',
          date: new Date().toISOString(),
          branch: gitRepo.branch,
          files: selectedFile ? [selectedFile.name] : ['project files'],
          additions: Math.floor(Math.random() * 50) + 10,
          deletions: Math.floor(Math.random() * 10)
        };
        
        setGitRepo(prev => ({
          ...prev,
          status: 'synced',
          lastSync: new Date().toISOString(),
          commits: [newCommit, ...prev.commits]
        }));
        
        toast.success('✅ Proyecto sincronizado correctamente');
      }
    } catch (error) {
      console.error('Project sync error:', error);
      setGitRepo(prev => ({ ...prev, status: 'error' }));
      toast.error('Error en sincronización del proyecto');
    }
  };

  const createNewBranch = (branchName: string) => {
    const newCommit: GitCommit = {
      hash: Math.random().toString(36).substring(2, 9),
      message: `Create branch: ${branchName}`,
      author: project?.owner?.fullName || 'Owner',
      date: new Date().toISOString(),
      branch: branchName,
      files: [],
      additions: 0,
      deletions: 0
    };
    
    setGitRepo(prev => ({
      ...prev,
      commits: [newCommit, ...prev.commits]
    }));
    
    toast.success(`Rama ${branchName} creada`);
  };

  const switchBranch = (branch: string) => {
    setGitRepo(prev => ({ ...prev, branch }));
    toast.success(`Cambiado a rama: ${branch}`);
  };

  // ✅ COLABORADORES FUNCIONALES
  const handleAddColab = async () => {
    if (!newColab.name.trim() || !newColab.email.trim()) {
      toast.error('Nombre y email son requeridos');
      return;
    }

    setLoadingCollaborators(true);
    try {
      // Agregar colaborador al proyecto (el backend creará el usuario si no existe)
      const collaboratorResponse = await api.post(
        `/projects/${projectId}/collaborators`,
        {
          email: newColab.email,
          name: newColab.name,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (collaboratorResponse.data) {
        // Actualizar la lista de colaboradores
        await fetchProject();
        
        // Crear carpeta sync para el nuevo colaborador
        const newCollaborator = collaboratorResponse.data.collaborator;
        if (newCollaborator?.user?.id) {
          await createCollaboratorSyncFolder(newCollaborator.user.id, newColab.name);
        }
        
        toast.success(`✅ ${newColab.name} agregado como colaborador`);
        setNewColab({ name: "", email: "", role: "Editor" });
        setShowAddColab(false);
      }
    } catch (error: any) {
      console.error('Error adding collaborator:', error);
      if (error.response?.status === 409) {
        toast.error('Este usuario ya es colaborador del proyecto');
      } else {
        toast.error('Error al agregar colaborador');
      }
    } finally {
      setLoadingCollaborators(false);
    }
  };

  const handleRoleChange = async (collaboratorId: number, newRole: string) => {
    // Encontrar el userId del colaborador
    const collaborator = project?.collaborators?.find(c => c.id === collaboratorId);
    if (!collaborator?.user?.id) {
      toast.error('Error: No se pudo encontrar el usuario');
      return;
    }

    try {
      await api.patch(
        `/projects/${projectId}/collaborators/${collaborator.user.id}`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Actualizar el estado local inmediatamente
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          collaborators: prev.collaborators?.map(colab =>
            colab.id === collaboratorId ? { ...colab, role: newRole } : colab
          ) || []
        };
      });

      // Actualizar también colabRoles
      setColabRoles(prev => ({
        ...prev,
        [collaboratorId]: newRole
      }));

      toast.success(`✅ Rol actualizado a ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar el rol');
    }
  };

  const handleRemoveColab = (collaboratorId: number) => {
    const collaborator = project?.collaborators?.find(c => c.id === collaboratorId);
    if (collaborator) {
      removeCollaborator(collaboratorId, collaborator.user?.fullName || collaborator.user?.name || 'Colaborador');
    }
  };

  const removeCollaborator = async (collaboratorId: number, collaboratorName: string) => {
    // Encontrar el userId del colaborador
    const collaborator = project?.collaborators?.find(c => c.id === collaboratorId);
    if (!collaborator?.user?.id) {
      toast.error('Error: No se pudo encontrar el usuario');
      return;
    }

    toast((t) => (
      <div className="flex flex-col gap-2">
        <span>¿Eliminar a {collaboratorName} del proyecto?</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.delete(`/projects/${projectId}/collaborators/${collaborator.user?.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                await fetchProject();
                toast.success(`${collaboratorName} eliminado del proyecto`);
              } catch (error) {
                console.error('Error removing collaborator:', error);
                toast.error('Error al eliminar colaborador');
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Eliminar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  // Crear carpeta sync para colaborador
  const createCollaboratorSyncFolder = async (userId: number, userName: string) => {
    try {
      const syncData = {
        userId,
        userName,
        projectId: parseInt(projectId),
        syncFiles: [],
        lastSync: new Date().toISOString(),
        changes: []
      };

      // Crear archivo JSON de sync para el colaborador
      await api.post(
        `/projects/${projectId}/sync-folder`,
        syncData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      
    } catch (error) {
      console.error('Error creating sync folder:', error);
      // No mostrar error al usuario, es interno
    }
  };

  // Function to create BFF/Sidecar components from project
  const createSyncComponent = async (type: 'bff' | 'sidecar') => {
    try {
      // Show toast input instead of prompt
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span className="font-medium">Nombre del {type.toUpperCase()}:</span>
          <input
            id="component-name-input"
            type="text"
            placeholder="Ej: API Gateway"
            className="px-3 py-2 border rounded text-black"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                const componentName = input.value.trim();
                if (componentName) {
                  toast.dismiss(t.id);
                  createComponentWithName(type, componentName);
                }
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                const input = document.getElementById('component-name-input') as HTMLInputElement;
                const componentName = input?.value.trim();
                if (componentName) {
                  toast.dismiss(t.id);
                  createComponentWithName(type, componentName);
                }
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Crear
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      ), { duration: 10000 });
    } catch (error) {
      console.error('Error creating sync component:', error);
      toast.error(`Error creando ${type.toUpperCase()}`);
    }
  };

  // Function to actually create the component with name
  const createComponentWithName = async (type: 'bff' | 'sidecar', componentName: string) => {
    try {
      const response = await api.post('/sync/create', {
        name: `${project?.name} - ${componentName}`,
        description: `${type.toUpperCase()} component for ${project?.name}`,
        pattern: type,
        language: project?.language || 'javascript'
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success(`✅ ${type.toUpperCase()} "${componentName}" creado - Disponible en Sincronización`);
        
        // Show link to sync page
        setTimeout(() => {
          toast((t) => (
            <div className="flex items-center">
              <span className="mr-3">¿Ir a la página de Sincronización para configurarlo?</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/sync');
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2"
              >
                Sí
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
              >
                No
              </button>
            </div>
          ), { duration: 6000 });
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating sync component:', error);
      toast.error(`Error creando ${type.toUpperCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Proyecto no encontrado
          </h2>
          <Button onClick={handleBackToProjects}>Volver a Proyectos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header existente */}
      <DashboardHeader />

      <div className="flex">
        {/* Sidebar existente */}
        <Sidebar />

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Header interno con pestañas como en Figma */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-4">
              {/* Botón volver - solo flecha */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToProjects}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* Información del proyecto */}
              <div className="mb-4">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  {project.name}
                </h1>
                <p className="text-gray-600 mb-3">
                  {project.description || "Sin descripción"}
                </p>
                
                {/* Información de propietario y colaboradores */}
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    <span>Propietario: <strong className="text-gray-700">{project.owner?.fullName || project.owner?.email}</strong></span>
                  </div>
                  {project.collaborators && project.collaborators.length > 0 && (
                    <div className="flex items-center">
                      <UserGroupIcon className="w-4 h-4 mr-1" />
                      <span>{project.collaborators.length} colaborador{project.collaborators.length !== 1 ? 'es' : ''}</span>
                    </div>
                  )}
                  {/* Mostrar si el usuario actual es colaborador */}
                  {user && project.collaborators?.some(collab => collab.user?.id === user.id) && (
                    <div className="flex items-center text-green-600">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      <span>Eres colaborador ({project.collaborators.find(collab => collab.user?.id === user.id)?.role || 'Usuario'})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pestañas - Responsive */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeTab === "code"
                      ? "bg-green-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <CodeBracketIcon className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Código</span>
                  <span className="sm:hidden">Code</span>
                </button>
                <button
                  onClick={() => setActiveTab("collaborators")}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeTab === "collaborators"
                      ? "bg-green-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <UserGroupIcon className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Colaboradores</span>
                  <span className="sm:hidden">Colab</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeTab === "settings"
                      ? "bg-green-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Cog6ToothIcon className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Configuración</span>
                  <span className="sm:hidden">Config</span>
                </button>
                <button
                  onClick={() => setActiveTab("versions")}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeTab === "versions"
                      ? "bg-green-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ClipboardDocumentIcon className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Historial</span>
                  <span className="sm:hidden">Hist</span>
                </button>
              </div>

              {/* Raya gris debajo de las pestañas */}
              <div className="border-b border-gray-200 mb-4"></div>

             

              {/* Badges en fila separada - solo en vista de código */}
              {activeTab === "code" && (
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-2 text-sm font-medium text-gray-900 flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-2"></div>
                    Generador de paletas de colores
                  </span>
                  <span className="px-3 py-2 text-sm font-medium bg-green-500 text-white rounded-full flex items-center">
                    <LockOpenIcon className="w-4 h-4 mr-2" />
                    Público
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contenido de las pestañas */}
          {activeTab === "code" && (
            <div className="flex-1 flex flex-col bg-white">
              {/* Barra de controles Git - fondo blanco - Responsive */}
              <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 lg:space-x-6">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                    {/* Selector de ramas */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <select
                        value={currentBranch}
                        onChange={(e) => setCurrentBranch(e.target.value)}
                        className="text-black px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                      >
                        <option value="main">Principal</option>
                        <option value="develop">develop</option>
                        <option value="feature/new-component">
                          feature/new-component
                        </option>
                      </select>
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">
                        <span className="hidden sm:inline">6 Branches</span>
                        <span className="sm:hidden">6</span>
                      </span>
                    </div>

                    {/* Buscador */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="relative">
                        <MagnifyingGlassIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Ir al archivo..."
                          className="text-black pl-7 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm w-full sm:w-80 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                      onClick={() => {
                        toast((t) => (
                          <div className="flex flex-col gap-3">
                            <span className="font-medium">Tipo de componente:</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  toast.dismiss(t.id);
                                  createSyncComponent('bff');
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded text-sm flex-1"
                              >
                                🔗 BFF (Backend for Frontend)
                              </button>
                              <button
                                onClick={() => {
                                  toast.dismiss(t.id);
                                  createSyncComponent('sidecar');
                                }}
                                className="bg-green-500 text-white px-4 py-2 rounded text-sm flex-1"
                              >
                                🔧 Sidecar (Servicio auxiliar)
                              </button>
                            </div>
                            <button
                              onClick={() => toast.dismiss(t.id)}
                              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ), { duration: 8000 });
                      }}
                    >
                      <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Crear {project?.pattern === 'microservices' ? 'Componente' : 'Servicio'}</span>
                      <span className="sm:hidden">Crear</span>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm"
                      onClick={syncWithGit}
                      disabled={gitRepo.status === 'pending'}
                    >
                      {gitRepo.status === 'pending' ? (
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                      ) : (
                      <CodeBracketIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">{gitRepo.status === 'pending' ? 'Sincronizando...' : 'Sincronizar Proyecto'}</span>
                      <span className="sm:hidden">{gitRepo.status === 'pending' ? 'Sync...' : 'Sync'}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        toast((t) => (
                          <div className="flex flex-col gap-2">
                            <span className="font-medium">URL del repositorio Git:</span>
                            <input
                              id="git-url-input"
                              type="text"
                              placeholder="https://github.com/usuario/repo.git"
                              className="px-3 py-2 border rounded text-black"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.target as HTMLInputElement;
                                  const repoUrl = input.value.trim();
                                  if (repoUrl) {
                                    toast.dismiss(t.id);
                                    toast.success('🔗 Repositorio conectado: ' + repoUrl);
                                  }
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const input = document.getElementById('git-url-input') as HTMLInputElement;
                                  const repoUrl = input?.value.trim();
                                  if (repoUrl) {
                                    toast.dismiss(t.id);
                                    toast.success('🔗 Repositorio conectado: ' + repoUrl);
                                  }
                                }}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Conectar
                              </button>
                              <button
                                onClick={() => toast.dismiss(t.id)}
                                className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ), { duration: 10000 });
                      }}
                    >
                      <CodeBracketIcon className="w-4 h-4 mr-2" />
                      Conectar Git
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3 py-1.5 text-sm"
                      onClick={() => {
                        toast((t) => (
                          <div className="flex flex-col gap-2">
                            <span className="font-medium">Nombre de la nueva rama:</span>
                            <input
                              id="branch-name-input"
                              type="text"
                              placeholder="feature/nueva-funcionalidad"
                              className="px-3 py-2 border rounded text-black"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.target as HTMLInputElement;
                                  const branchName = input.value.trim();
                                  if (branchName) {
                                    toast.dismiss(t.id);
                                    createNewBranch(branchName);
                                  }
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const input = document.getElementById('branch-name-input') as HTMLInputElement;
                                  const branchName = input?.value.trim();
                                  if (branchName) {
                                    toast.dismiss(t.id);
                                    createNewBranch(branchName);
                                  }
                                }}
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Crear Rama
                              </button>
                              <button
                                onClick={() => toast.dismiss(t.id)}
                                className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ), { duration: 10000 });
                      }}
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Nueva Rama
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mensaje de actividad Git - fondo del footer */}
              <div className="bg-[#E9F9EC] border-b border-green-200 px-6 py-3">
                <div className="flex items-center justify-between">
                <p className="text-sm text-gray-900 font-medium">
                    {gitRepo.status === 'synced' ? (
                      `✅ Proyecto sincronizado - Último cambio: ${gitRepo.commits[0]?.message || 'N/A'}`
                    ) : gitRepo.status === 'pending' ? (
                      '🔄 Sincronizando proyecto...'
                    ) : (
                      '❌ Error en sincronización'
                    )}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>Rama: {gitRepo.branch}</span>
                    <span>Commits: {gitRepo.commits.length}</span>
                    <span>Último sync: {new Date(gitRepo.lastSync).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Área principal del editor - Responsive */}
              <div className="flex-1 flex flex-col xl:flex-row mb-6">
                {/* Sidebar - File Explorer en card */}
                <div className="w-full xl:w-80 bg-white border-r border-gray-200 overflow-y-auto">
                  <div className="p-3 sm:p-4">
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-3">
                        <span className="hidden sm:inline">Explorador de Archivos</span>
                        <span className="sm:hidden">Archivos</span>
                      </h3>
                      <div className="space-y-1">
                        {renderFileTree(fileTree)}
                      </div>
                    </div>




                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {selectedFile ? (
                    <>
                      {/* File Header - Responsive */}
                      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                          <div className="flex items-center">
                            <DocumentIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-gray-500" />
                            <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {selectedFile.name}
                            </span>
                            <span className="ml-1 sm:ml-2 text-xs text-gray-500 hidden sm:inline">
                              {selectedFile.path}
                            </span>
                            {autoSaved && (
                              <span className="ml-1 sm:ml-2 text-xs text-green-600 bg-green-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                <span className="hidden sm:inline">Guardado</span>
                                <span className="sm:hidden">✓</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyCode}
                              disabled={!editorContent}
                              className="text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              <ClipboardDocumentIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Copiar</span>
                              <span className="sm:hidden">Copy</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={createExecutableFile}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              <CodeBracketIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Agregar Archivo</span>
                              <span className="sm:hidden">Ejec</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={saveFile}
                              disabled={saving}
                              className="text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              <BookmarkIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">{saving ? "Guardando..." : "Guardar"}</span>
                              <span className="sm:hidden">{saving ? "..." : "Save"}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (selectedFile) {
                                  const localStorageKey = `project_${projectId}_file_${selectedFile.id}`;
                                  localStorage.removeItem(localStorageKey);
                                  setEditorContent(selectedFile.content || "");
                                  toast.success("Datos locales limpiados");
                                }
                              }}
                              className="text-xs text-orange-600 border-orange-300 hover:bg-orange-50 px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              <span className="hidden sm:inline">Limpiar Local</span>
                              <span className="sm:hidden">Limpiar</span>
                            </Button>
                            {getLanguageFromFile(
                              selectedFile.name,
                              editorContent,
                            ) === "html" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={togglePreview}
                                disabled={!editorContent}
                                className="text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                              >
                                <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">{showPreview ? "Ocultar" : "Vista Previa"}</span>
                                <span className="sm:hidden">{showPreview ? "Ocultar" : "Vista"}</span>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={executeCode}
                              disabled={executing}
                              className="text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">{executing ? "Ejecutando..." : "Ejecutar"}</span>
                              <span className="sm:hidden">{executing ? "..." : "Run"}</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={analyzeWithIA}
                              disabled={loadingIA}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              <span className="hidden sm:inline">{loadingIA ? "Optimizando..." : "Optimizar con IA"}</span>
                              <span className="sm:hidden">{loadingIA ? "..." : "IA"}</span>
                            </Button>
                            {selectedFile.name.startsWith("src/") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => analyzeSrcFileWithIA(selectedFile)}
                                disabled={loadingIA}
                                className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                              >
                                <Cog6ToothIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Analizar con IA</span>
                                <span className="sm:hidden">Analizar</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 flex">
                        {/* Editor */}
                        <div className="flex-1 flex flex-col">
                          {/* 🔥 INDICADOR SIMPLE DE COLABORACIÓN - Responsive */}
                          {project?.collaborators && project.collaborators.length > 0 && (
                            <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1 sm:mr-2"></div>
                                  <span className="text-xs sm:text-sm font-medium text-blue-800">
                                    <span className="hidden sm:inline">Proyecto colaborativo</span>
                                    <span className="sm:hidden">Colaborativo</span>
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <span className="text-xs sm:text-sm text-blue-600">
                                    <span className="hidden sm:inline">Colaboradores:</span>
                                    <span className="sm:hidden">Colab:</span>
                                  </span>
                                  {project.collaborators.slice(0, 2).map((collab, index) => (
                                    <div key={collab.id} className="flex items-center">
                                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                                        {(collab.user?.fullName || collab.user?.email || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <span className="ml-1 text-xs text-blue-700 hidden sm:inline">{collab.user?.fullName || collab.user?.email}</span>
                                    </div>
                                  ))}
                                  {project.collaborators.length > 2 && (
                                    <span className="text-xs text-blue-600">+{project.collaborators.length - 2}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-blue-600">
                                <span className="hidden sm:inline">Los cambios se verifican cada 5 segundos</span>
                                <span className="sm:hidden">Verificando cambios...</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex-1 relative">
                            <Suspense fallback={<EditorLoading />}>
                              <Editor
                                height="100%"
                                language={getLanguageFromFile(
                                  selectedFile.name,
                                  editorContent,
                                )}
                                value={editorContent}
                                onChange={(value) => {
                                  setEditorContent(value || "");
                                  saveToLocalStorage(value || "");
                                }}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  automaticLayout: true,
                                  theme: "vs-light",
                                  // Optimizaciones adicionales
                                  renderWhitespace: "none",
                                  wordWrap: "on",
                                  scrollBeyondLastLine: false,
                                  smoothScrolling: true,
                                  cursorBlinking: "smooth",
                                }}
                                onMount={() => {}}
                              />
                            </Suspense>

                            {/* Modal de Loader de IA - Flotante dentro del editor */}
                            {showIAModal && (
                              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10">
                                <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-200 max-w-md w-full mx-4">
                                  <div className="text-center">
                                    {/* Spinner principal con SVG */}
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

                                    {/* Título principal */}
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                      Analizando código con IA
                                    </h3>

                                    {/* Mensaje específico */}
                                    <p className="text-gray-600 font-medium mb-4">
                                      Analizando archivo:{" "}
                                      {selectedFile?.name ||
                                        "archivo seleccionado"}
                                    </p>

                                    {/* Descripción del proceso */}
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                      La IA está revisando tu código para
                                      detectar oportunidades de mejora,
                                      optimizaciones y mejores prácticas. Esto
                                      puede tomar unos segundos...
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Panel - Output & IA Analysis */}
                        <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col">
                          {/* Output Section */}
                          <div className="h-1/2 border-b border-gray-200">
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-900">
                                  Salida del Código
                                </h3>
                                <div className="flex items-center space-x-2">
                                  {getLanguageFromFile(
                                    selectedFile?.name || "",
                                    editorContent,
                                  ) === "html" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={togglePreview}
                                      className="text-xs px-2 py-1"
                                    >
                                      {showPreview ? "Ocultar" : "Vista Previa"}
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExecutionOutput("")}
                                    className="text-xs px-2 py-1"
                                  >
                                    Limpiar
                                  </Button>
                                </div>
                              </div>

                              {showPreview &&
                              getLanguageFromFile(selectedFile?.name || "") ===
                                "html" ? (
                                <div className="bg-white border border-gray-200 rounded-lg h-40 overflow-hidden">
                                  <iframe
                                    srcDoc={previewContent}
                                    className="w-full h-full"
                                    title="HTML Preview"
                                    sandbox="allow-scripts allow-same-origin"
                                  />
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-lg p-3 h-40 overflow-y-auto">
                                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {executionOutput ||
                                      "Ejecuta el código para ver la salida..."}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* IA Analysis Section */}
                          <div className="h-1/2 overflow-y-auto">
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2 text-purple-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                Análisis de IA
                              </h3>
                              </div>
                              {iaAnalysis ? (
                                <div className="space-y-4">
                                  {/* Estructura real de n8n (071-maqueta) */}
                                  {iaAnalysis.output && (
                                    <>
                                      {/* Sugerencias */}
                                      {iaAnalysis.output?.Sugerencias &&
                                        iaAnalysis.output.Sugerencias.length >
                                          0 && (
                                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center mb-3">
                                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <svg
                                                  className="w-4 h-4 text-blue-600"
                                                  fill="currentColor"
                                                  viewBox="0 0 20 20"
                                                >
                                                  <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clipRule="evenodd"
                                                  />
                                                </svg>
                                              </div>
                                              <h4 className="text-sm font-semibold text-blue-900">
                                              Sugerencias
                                            </h4>
                                            </div>
                                            <div className="space-y-3">
                                              {iaAnalysis.output.Sugerencias.map(
                                                (sugerencia, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-start"
                                                  >
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                    <p className="text-sm text-blue-800 leading-relaxed">
                                                      {sugerencia}
                                                  </p>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {/* Advertencias */}
                                      {iaAnalysis.output?.Advertencias &&
                                        iaAnalysis.output.Advertencias.length >
                                          0 && (
                                          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center mb-3">
                                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                                <svg
                                                  className="w-4 h-4 text-red-600"
                                                  fill="currentColor"
                                                  viewBox="0 0 20 20"
                                                >
                                                  <path
                                                    fillRule="evenodd"
                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                  />
                                                </svg>
                                              </div>
                                              <h4 className="text-sm font-semibold text-red-900">
                                              Advertencias
                                            </h4>
                                            </div>
                                            <div className="space-y-3">
                                              {iaAnalysis.output.Advertencias.map(
                                                (advertencia, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-start"
                                                  >
                                                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                    <p className="text-sm text-red-800 leading-relaxed">
                                                      {advertencia}
                                                  </p>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </>
                                  )}

                                  {/* Análisis de Rendimiento (estructura anterior) */}
                                  {iaAnalysis.performance && (
                                    <Card className="p-3">
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                                        Rendimiento (
                                        {iaAnalysis.performance.score || 0}/100)
                                      </h4>
                                      <div className="space-y-1">
                                        {iaAnalysis.performance.suggestions &&
                                          iaAnalysis.performance.suggestions.map(
                                            (suggestion, idx) => (
                                              <p
                                                key={idx}
                                                className="text-xs text-gray-600"
                                              >
                                                • {suggestion}
                                              </p>
                                            ),
                                          )}
                                      </div>
                                    </Card>
                                  )}

                                  {/* Análisis de Seguridad (estructura anterior) */}
                                  {iaAnalysis.security && (
                                    <Card className="p-3">
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                                        Seguridad (
                                        {iaAnalysis.security.score || 0}
                                        /100)
                                      </h4>
                                      <div className="space-y-1">
                                        {iaAnalysis.security.risks &&
                                          iaAnalysis.security.risks.map(
                                            (risk, idx) => (
                                              <p
                                                key={idx}
                                                className="text-xs text-red-600"
                                              >
                                                ⚠ {risk}
                                              </p>
                                            ),
                                          )}
                                      </div>
                                    </Card>
                                  )}

                                  {/* Análisis de Mejores Prácticas (estructura anterior) */}
                                  {iaAnalysis.bestPractices && (
                                    <Card className="p-3">
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                                        Mejores Prácticas (
                                        {iaAnalysis.bestPractices.score || 0}
                                        /100)
                                      </h4>
                                      <div className="space-y-1">
                                        {iaAnalysis.bestPractices.issues &&
                                          iaAnalysis.bestPractices.issues.map(
                                            (issue, idx) => (
                                              <p
                                                key={idx}
                                                className="text-xs text-yellow-600"
                                              >
                                                ↻ {issue}
                                              </p>
                                            ),
                                          )}
                                      </div>
                                    </Card>
                                  )}

                                  {/* Si no hay estructura específica, mostrar el análisis como texto */}
                                  {!iaAnalysis.output &&
                                    !iaAnalysis.performance &&
                                    !iaAnalysis.security &&
                                    !iaAnalysis.bestPractices && (
                                      <Card className="p-3">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                                          Análisis de IA
                                        </h4>
                                        <div className="space-y-1">
                                          <p className="text-xs text-gray-600">
                                            {typeof iaAnalysis === "string"
                                              ? iaAnalysis
                                              : JSON.stringify(
                                                  iaAnalysis,
                                                  null,
                                                  2,
                                                )}
                                          </p>
                                        </div>
                                      </Card>
                                    )}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <p className="text-sm text-gray-500">
                                    Haz clic en &quot;Optimizar con IA&quot;
                                    para obtener código optimizado
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // No file selected
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <DocumentIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Selecciona un archivo
                        </h3>
                        <p className="text-sm text-gray-500">
                          Elige un archivo del explorador para comenzar a editar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "collaborators" && (
            <div className="flex-1 bg-white p-6">
              <div className="w-full relative">
                {/* Explicación del Sistema de Colaboradores */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    🤝 ¿Cómo funciona el Sistema de Colaboradores?
                  </h3>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p><strong>1. Agregar:</strong> Invita usuarios por email (se crean automáticamente si no existen)</p>
                    <p><strong>2. Roles:</strong> Admin (todo), Editor (código), Viewer (solo lectura)</p>
                    <p><strong>3. Sync:</strong> Cuando un colaborador edita → aparece en tu historial de versiones</p>
                    <p><strong>4. Carpetas Sync:</strong> Cada colaborador tiene su JSON con cambios en /sync/</p>
                  </div>
                </div>
                <div className="flex justify-end items-center mb-6 gap-3">
                  {isEditingCollaborators ? (
                    <Button
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      onClick={() => setIsEditingCollaborators(false)}
                    >
                      Cancelar edición
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => setIsEditingCollaborators(true)}
                    >
                      Editar roles
                    </Button>
                  )}
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => setShowAddColab(true)}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
                {showAddColab && (
                  <div className="absolute left-1/2 top-0 transform -translate-x-1/2 z-50">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm border border-green-200">
                      <h3 className="text-lg font-bold mb-4 text-green-700">
                        Agregar colaborador
                      </h3>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={newColab.name}
                        onChange={(e) =>
                          setNewColab({ ...newColab, name: e.target.value })
                        }
                        className="text-black w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newColab.email}
                        onChange={(e) =>
                          setNewColab({ ...newColab, email: e.target.value })
                        }
                        className="text-black w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      />
                      <select
                        value={newColab.role}
                        onChange={(e) =>
                          setNewColab({ ...newColab, role: e.target.value })
                        }
                        className="text-black w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      >
                        <option value="Editor">Editor</option>
                        <option value="Admin">Admin</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddColab(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={handleAddColab}
                          disabled={loadingCollaborators}
                        >
                          {loadingCollaborators ? "Agregando..." : "Agregar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Colaboradores
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider align-top">
                          Rol
                        </th>
                        <th className="px-8 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider align-top"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(Array.isArray(project.collaborators)
                        ? project.collaborators
                        : []
                      ).map((colab, idx) => {
                        const user = colab.user;
                        return (
                          <tr key={colab.id}>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-green-600">
                                    {user?.fullName?.charAt(0) ||
                                      user?.name?.charAt(0) ||
                                      "?"}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="flex items-center">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user?.fullName ||
                                      user?.name ||
                                      "Sin nombre"}
                                    </div>
                                    {colab.role === 'Admin' && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                        Admin
                                      </span>
                                    )}
                                    {colab.role === 'Editor' && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Editor
                                      </span>
                                    )}
                                    <div className="ml-2 w-2 h-2 bg-green-400 rounded-full" title="Activo"></div>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user?.email || "Sin email"}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Último acceso: hace 2 horas
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap align-middle">
                              <select
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                                disabled={!isEditingCollaborators}
                                value={colabRoles[colab.id] || colab.role || "Usuario"}
                                onChange={(e) =>
                                  handleRoleChange(colab.id, e.target.value)
                                }
                              >
                                <option value="Usuario">Usuario</option>
                                <option value="Admin">Admin</option>
                                <option value="Editor">Editor</option>
                              </select>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap text-right align-middle">
                              <div className="flex gap-2">
                                {isEditingCollaborators ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                                    onClick={() => setIsEditingCollaborators(false)}
                                >
                                  Cancelar
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => handleRemoveColab(colab.id)}
                                >
                                  Eliminar
                                </Button>
                              )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex-1 bg-white p-6">
              <div className="w-full">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dueño <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={
                          project.owner?.fullName || project.owner?.name || ""
                        }
                        readOnly
                        className="text-black w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del repositorio{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editConfig.name}
                        onChange={handleConfigChange}
                        className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        readOnly={!isEditingConfig}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={editConfig.description}
                      onChange={handleConfigChange}
                      rows={4}
                      className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      readOnly={!isEditingConfig}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="public"
                        name="visibility"
                        defaultChecked
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <label
                        htmlFor="public"
                        className="ml-3 flex items-center text-sm text-gray-900"
                      >
                        <LockOpenIcon className="w-5 h-5 mr-2 text-green-500" />
                        Público
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="private"
                        name="visibility"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <label
                        htmlFor="private"
                        className="ml-3 flex items-center text-sm text-gray-900"
                      >
                        <LockClosedIcon className="w-5 h-5 mr-2 text-gray-500" />
                        Privado
                      </label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="readme"
                      defaultChecked
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <label
                        htmlFor="readme"
                        className="text-sm font-medium text-gray-900"
                      >
                        Agregar un archivo README
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Aquí puedes escribir una descripción detallada de tu
                        proyecto.
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Estás creando un repositorio público en tu cuenta personal.
                  </div>
                </div>

                <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                    {isEditingConfig ? (
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={handleConfigSave}
                      >
                        Guardar cambios
                      </Button>
                    ) : (
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => setIsEditingConfig(true)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nueva pestaña: Historial de Versiones */}
          {activeTab === "versions" && (
            <div className="flex-1 bg-white p-6">
              <div className="w-full relative">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    🕒 Historial de Versiones
                  </h3>
                  <p className="text-gray-600">
                    Aquí puedes ver todos los cambios realizados en el proyecto por colaboradores y propietarios.
                  </p>
                </div>

                {loadingVersions ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-3 text-gray-600">Cargando historial...</span>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardDocumentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sin historial de versiones
                    </h3>
                    <p className="text-gray-600">
                      Los cambios aparecerán aquí cuando los colaboradores editen el código.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {versions.map((version, index) => (
                      <div key={version.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                {version.hash}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                version.status === 'deployed' ? 'bg-green-100 text-green-700' :
                                version.status === 'testing' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {version.status}
                              </span>
                            </div>
                            <p className="text-gray-900 font-medium mb-1">
                              {version.message}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <UserIcon className="w-4 h-4 mr-1" />
                                {version.author}
                              </span>
                              <span>{new Date(version.date).toLocaleString()}</span>
                              <span className="flex items-center">
                                <DocumentIcon className="w-4 h-4 mr-1" />
                                {version.filesChanged?.length || 0} archivo{(version.filesChanged?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {version.filesChanged && version.filesChanged.length > 0 && (
                              <div className="mt-2">
                                <details>
                                  <summary className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                                    Ver archivos modificados
                                  </summary>
                                  <div className="mt-1 pl-4 text-sm text-gray-600">
                                    {version.filesChanged.map((file: string, fileIndex: number) => (
                                      <div key={fileIndex} className="flex items-center">
                                        <DocumentIcon className="w-3 h-3 mr-1 text-gray-400" />
                                        {file}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer existente */}
      <Footer />

      {/* Modal de Sugerencias de IA */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Sugerencias de IA
              </h3>
              <button
                onClick={closeSuggestionsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {iaSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border ${
                    suggestion.type === "warning"
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {suggestion.type === "warning" ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <LightBulbIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-sm ${
                            suggestion.type === "warning"
                              ? "text-red-800"
                              : "text-blue-800"
                          }`}
                        >
                          {suggestion.text}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => acceptSuggestion(suggestion.id)}
                        className={`p-1 rounded-full ${
                          suggestion.accepted
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600"
                        }`}
                        disabled={suggestion.rejected}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectSuggestion(suggestion.id)}
                        className={`p-1 rounded-full ${
                          suggestion.rejected
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                        }`}
                        disabled={suggestion.accepted}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={closeSuggestionsModal}
                className="text-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={applyAcceptedSuggestions}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Aplicar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
