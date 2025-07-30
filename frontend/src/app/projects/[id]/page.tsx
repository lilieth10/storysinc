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
  owner: {
    id: number;
    name: string;
    email: string;
    fullName?: string;
  };
  createdAt: string;
  collaborators?: ProjectCollaborator[];
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

interface IAAnalysis {
  performance: {
    score: number;
    suggestions: string[];
  };
  security: {
    risks: string[];
    score: number;
  };
  bestPractices: {
    issues: string[];
    score: number;
  };
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
  const { token } = useAuth();
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
  const [activeTab, setActiveTab] = useState<
    "code" | "collaborators" | "settings"
  >("code");
  const [currentBranch, setCurrentBranch] = useState("main");
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");

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

  // Cargar datos en paralelo para mejor rendimiento
  useEffect(() => {
    if (projectId && token) {
      Promise.all([fetchProject(), fetchFileTree()]).catch(console.error);
    }
  }, [fetchProject, fetchFileTree, projectId, token]);

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
      await api.put(
        `/projects/${projectId}/files`,
        {
          filePath: selectedFile.path,
          content: editorContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Archivo guardado correctamente");
    } catch (error) {
      toast.error("Error al guardar el archivo");
    } finally {
      setSaving(false);
    }
  }, [selectedFile, editorContent, projectId, token]);

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
      const errorMessage = error instanceof Error ? error.message : "Error al ejecutar el código";
      setExecutionOutput(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setExecuting(false);
    }
  }, [selectedFile, editorContent, projectId, token]);

  const analyzeWithIA = useCallback(async () => {
    if (!selectedFile) return;

    setLoadingIA(true);
    try {
      const response = await api.post(
        `/projects/${projectId}/analyze`,
        {
          filePath: selectedFile.path,
          content: editorContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setIaAnalysis(response.data);
      toast.success("Análisis de IA completado");
    } catch (error) {
      toast.error("Error al analizar con IA");
    } finally {
      setLoadingIA(false);
    }
  }, [selectedFile, editorContent, projectId, token]);

  // Funciones auxiliares
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
    setEditorContent(file.content || "");
  };

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
    if (content) {
      const firstLine = content.trim().split('\n')[0].toLowerCase();
      
      // Detectar archivos de proyecto React/TypeScript PRIMERO
      if (content.includes('import React') || content.includes('ReactDOM.render') ||
          content.includes('export default') || content.includes('from \'react') ||
          content.includes('from "react') || content.includes('<React.StrictMode>') ||
          content.includes('document.getElementById') || content.includes('JSX.Element')) {
        return "typescript"; // Para archivos .tsx/.ts
      }
      
      // Detectar Python por palabras clave (solo si NO es React)
      if ((content.includes('def ') || content.includes('print(') || 
          content.includes('import ') || content.includes('from ') ||
          firstLine.includes('python') || content.includes('if __name__')) &&
          !content.includes('import React') && !content.includes('ReactDOM')) {
        return "python";
      }
      
      // Detectar JavaScript puro (solo si NO es React)
      if ((content.includes('function ') || content.includes('const ') || 
          content.includes('let ') || content.includes('var ') ||
          content.includes('console.log')) &&
          !content.includes('import React') && !content.includes('ReactDOM')) {
        return ext === 'ts' || ext === 'tsx' ? "typescript" : "javascript";
      }
      
      // Detectar HTML
      if (content.includes('<!DOCTYPE html>') || content.includes('<html>') ||
          content.includes('<head>') || content.includes('<body>')) {
        return "html";
      }
      
      // Detectar CSS
      if (content.includes('{') && content.includes('}') && 
          (content.includes(':') || content.includes('@media'))) {
        return "css";
      }
      
      // Detectar JSON
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        try {
          JSON.parse(content);
          return "json";
        } catch {
          // No es JSON válido
        }
      }
    }

    return languageMap[ext || ""] || "plaintext";
  };

  const copyCode = () => {
    navigator.clipboard.writeText(editorContent);
    toast.success("Código copiado al portapapeles");
  };

  const createExecutableFile = () => {
    const language = getLanguageFromFile(selectedFile?.name || "", editorContent);
    let template = "";
    
    switch (language) {
      case "javascript":
        template = `// Código JavaScript ejecutable
console.log("¡Hola mundo!");
const suma = 2 + 2;
console.log("Resultado:", suma);

// Función simple
function saludar(nombre) {
  return \`¡Hola \${nombre}!\`;
}

console.log(saludar("Desarrollador"));`;
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
    <button onclick="alert('¡Funciona!')">Click me</button>
</body>
</html>`;
        break;
      default:
        template = `// Código ejecutable
console.log("¡Hola mundo!");`;
    }
    
    setEditorContent(template);
    toast.success("Plantilla de código ejecutable creada");
  };

  const togglePreview = () => {
    if (getLanguageFromFile(selectedFile?.name || "", editorContent) === "html") {
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

  // Estado para agregar colaborador
  const [showAddColab, setShowAddColab] = useState(false);
  const [newColab, setNewColab] = useState({ email: "", name: "" });
  const handleAddColab = async () => {
    try {
      await api.post(`/projects/${projectId}/collaborators`, newColab, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Colaborador agregado");
      setShowAddColab(false);
      setNewColab({ email: "", name: "" });
      fetchProject();
    } catch {
      toast.error("Error al agregar colaborador");
    }
  };

  // Estado para roles de colaboradores
  const [colabRoles, setColabRoles] = useState<Record<number, string>>({});
  useEffect(() => {
    if (project && Array.isArray(project.collaborators)) {
      const roles: Record<number, string> = {};
      project.collaborators.forEach((colab) => {
        roles[colab.id] = colab.role || "Usuario";
      });
      setColabRoles(roles);
    }
  }, [project]);

  const handleRoleChange = async (colabId: number, newRole: string) => {
    setColabRoles((prev) => ({ ...prev, [colabId]: newRole }));
    try {
      await api.patch(
        `/projects/${projectId}/collaborators/${colabId}`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Rol actualizado");
      fetchProject();
    } catch {
      toast.error("Error al actualizar el rol");
    }
  };

  const handleRemoveColab = (colabId: number) => {
    toast(
      (t) => (
        <span>
          ¿Seguro que quieres eliminar este colaborador?
          <div className="mt-2 flex gap-2 justify-end">
            <button
              className="px-3 py-1 rounded bg-red-500 text-white text-xs"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.delete(
                    `/projects/${projectId}/collaborators/${colabId}`,
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    },
                  );
                  fetchProject();
                  toast.success("Colaborador eliminado");
                } catch {
                  toast.error("Error al eliminar colaborador");
                }
              }}
            >
              Sí, eliminar
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </button>
          </div>
        </span>
      ),
      { duration: 6000 },
    );
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
                <p className="text-gray-600">
                  {project.description || "Sin descripción"}
                </p>
              </div>

              {/* Pestañas */}
              <div className="flex space-x-8 mb-4">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "code"
                      ? "bg-green-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <CodeBracketIcon className="w-4 h-4 inline mr-2" />
                  Código
                </button>
                <button
                  onClick={() => setActiveTab("collaborators")}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "collaborators"
                      ? "bg-green-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <UserGroupIcon className="w-4 h-4 inline mr-2" />
                  Colaboradores
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "settings"
                      ? "bg-green-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Cog6ToothIcon className="w-4 h-4 inline mr-2" />
                  Configuración
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
              {/* Barra de controles Git - fondo blanco */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                    {/* Selector de ramas */}
                    <div className="flex items-center space-x-3">
                      <select
                        value={currentBranch}
                        onChange={(e) => setCurrentBranch(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                      >
                        <option value="main">Principal</option>
                        <option value="develop">develop</option>
                        <option value="feature/new-component">
                          feature/new-component
                        </option>
                      </select>
                      <span className="text-sm text-gray-600 font-medium">
                        6 Branches
                      </span>
                    </div>

                    {/* Buscador */}
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Ir al archivo..."
                          className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm w-full sm:w-80 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3 py-1.5 text-sm"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Agregar archivo
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 px-3 py-1.5 text-sm"
                    >
                      <CodeBracketIcon className="w-4 h-4 mr-2" />
                      Código
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mensaje de actividad Git - fondo del footer */}
              <div className="bg-[#E9F9EC] border-b border-green-200 px-6 py-3">
                <p className="text-sm text-gray-900 font-medium">
                  Diego Cordero ha subido un nuevo archivo hace 2 horas
                </p>
              </div>

              {/* Área principal del editor */}
              <div className="flex-1 flex flex-col lg:flex-row mb-6">
                {/* Sidebar - File Explorer en card */}
                <div className="w-full lg:w-80 bg-white border-r border-gray-200 overflow-y-auto">
                  <div className="p-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        Explorador de Archivos
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
                      {/* File Header */}
                      <div className="bg-white border-b border-gray-200 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DocumentIcon className="w-5 h-5 mr-2 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {selectedFile.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {selectedFile.path}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyCode}
                              disabled={!editorContent}
                              className="text-xs"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Copiar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={createExecutableFile}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs"
                            >
                              <CodeBracketIcon className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Crear Ejecutable</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={saveFile}
                              disabled={saving}
                              className="text-xs"
                            >
                              <BookmarkIcon className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">{saving ? "Guardando..." : "Guardar"}</span>
                            </Button>
                            {getLanguageFromFile(selectedFile.name, editorContent) ===
                              "html" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={togglePreview}
                                disabled={!editorContent}
                                className="text-xs"
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">{showPreview ? "Ocultar" : "Vista Previa"}</span>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={executeCode}
                              disabled={executing}
                              className="text-xs"
                            >
                              <PlayIcon className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">{executing ? "Ejecutando..." : "Ejecutar"}</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={analyzeWithIA}
                              disabled={loadingIA}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs"
                            >
                              <span className="hidden sm:inline">{loadingIA ? "Analizando..." : "Analizar con IA"}</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 flex">
                        {/* Editor */}
                        <div className="flex-1 flex flex-col">
                          <div className="flex-1 relative">
                            <Suspense fallback={<EditorLoading />}>
                              <Editor
                                height="100%"
                                language={getLanguageFromFile(
                                  selectedFile.name,
                                  editorContent,
                                )}
                                value={editorContent}
                                onChange={(value) =>
                                  setEditorContent(value || "")
                                }
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
                          </div>
                        </div>

                        {/* Right Panel - Output & IA Analysis */}
                        <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col">
                          {/* Output Section */}
                          <div className="flex-1 border-b border-gray-200">
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
                                <div className="bg-white border border-gray-200 rounded-lg h-48 overflow-hidden">
                                  <iframe
                                    srcDoc={previewContent}
                                    className="w-full h-full"
                                    title="HTML Preview"
                                    sandbox="allow-scripts allow-same-origin"
                                  />
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-lg p-3 h-48 overflow-y-auto">
                                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {executionOutput ||
                                      "Ejecuta el código para ver la salida..."}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* IA Analysis Section */}
                          <div className="flex-1">
                            <div className="p-4">
                              <h3 className="text-sm font-medium text-gray-900 mb-3">
                                Análisis de IA
                              </h3>
                              {iaAnalysis ? (
                                <div className="space-y-4">
                                  <Card className="p-3">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                      Rendimiento (
                                      {iaAnalysis.performance.score}/100)
                                    </h4>
                                    <div className="space-y-1">
                                      {iaAnalysis.performance.suggestions.map(
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

                                  <Card className="p-3">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                      Seguridad ({iaAnalysis.security.score}
                                      /100)
                                    </h4>
                                    <div className="space-y-1">
                                      {iaAnalysis.security.risks.map(
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

                                  <Card className="p-3">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                      Mejores Prácticas (
                                      {iaAnalysis.bestPractices.score}/100)
                                    </h4>
                                    <div className="space-y-1">
                                      {iaAnalysis.bestPractices.issues.map(
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
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <p className="text-sm text-gray-500">
                                    Haz clic en &quot;Analizar con IA&quot; para
                                    obtener sugerencias de mejora
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
                <div className="flex justify-end items-center mb-6">
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
                        className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newColab.email}
                        onChange={(e) =>
                          setNewColab({ ...newColab, email: e.target.value })
                        }
                        className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      />
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
                        >
                          Agregar
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
                                  <div className="text-sm font-medium text-gray-900">
                                    {user?.fullName ||
                                      user?.name ||
                                      "Sin nombre"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user?.email || "Sin email"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap align-middle">
                              <select
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                disabled={!isEditingConfig}
                                value={colab.role || "Usuario"}
                                onChange={(e) =>
                                  handleRoleChange(colab.id, e.target.value)
                                }
                              >
                                <option>Usuario</option>
                                <option>Admin</option>
                                <option>Editor</option>
                              </select>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap text-right align-middle">
                              {isEditingConfig ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                                  onClick={() => setIsEditingConfig(false)}
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
        </div>
      </div>

      {/* Footer existente */}
      <Footer />
    </div>
  );
}
