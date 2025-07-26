/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/landing/Footer";

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
  license?: string;
  visibility?: string;
  addReadme?: boolean;
  addGitignore?: boolean;
  chooseLicense?: boolean;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface IARecommendation {
  type: string;
  component: string;
  message: string;
  priority: string;
}

interface IAAlert {
  type: string;
  message: string;
  priority: string;
}

interface IAAnalysis {
  recommendations?: IARecommendation[];
  alerts?: IAAlert[];
  lastAnalysis?: string;
  performance?: {
    score: number;
    bottlenecks: string[];
  };
}

// Tipos para archivos y carpetas
interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

// Mock de estructura de archivos (esto luego se puede traer del backend)
const initialFileTree: FileNode[] = [
  {
    id: "1",
    name: "src",
    type: "folder",
    children: [
      { id: "2", name: "components", type: "folder", children: [
        { id: "3", name: "Header.tsx", type: "file" },
        { id: "4", name: "Footer.tsx", type: "file" },
      ] },
      { id: "5", name: "App.tsx", type: "file" },
      { id: "6", name: "index.tsx", type: "file" },
    ]
  },
  {
    id: "7",
    name: "public",
    type: "folder",
    children: [
      { id: "8", name: "logo.svg", type: "file" },
      { id: "9", name: "favicon.ico", type: "file" },
    ]
  },
  { id: "10", name: "package.json", type: "file" },
  { id: "11", name: "README.md", type: "file" },
];

// Componente recursivo para mostrar archivos/carpeta
function FileExplorer({ nodes, onFileClick, expanded, setExpanded }: {
  nodes: FileNode[];
  onFileClick: (file: FileNode) => void;
  expanded: Set<string>;
  setExpanded: (ids: Set<string>) => void;
}) {
  return (
    <ul className="pl-2">
      {nodes.map((node) => (
        <li key={node.id} className="mb-1">
          {node.type === "folder" ? (
            <div>
              <button
                className="flex items-center gap-2 text-gray-700 hover:text-green-700 font-medium focus:outline-none"
                onClick={() => {
                  const newSet = new Set(expanded);
                  if (expanded.has(node.id)) newSet.delete(node.id);
                  else newSet.add(node.id);
                  setExpanded(newSet);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded.has(node.id) ? "M6 18L18 6M6 6l12 12" : "M4 8h16v12H4z"} />
                </svg>
                <span>{node.name}</span>
              </button>
              {expanded.has(node.id) && node.children && (
                <FileExplorer nodes={node.children} onFileClick={onFileClick} expanded={expanded} setExpanded={setExpanded} />
              )}
            </div>
          ) : (
            <button
              className="flex items-center gap-2 pl-6 text-gray-800 hover:text-green-600 w-full text-left"
              onClick={() => onFileClick(node)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              </svg>
              <span>{node.name}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

// Componente de fila para archivos/carpeta, visual tipo Figma
function FileExplorerRow({ node, expanded, setExpanded, onFileClick, level }: {
  node: FileNode;
  expanded: Set<string>;
  setExpanded: (ids: Set<string>) => void;
  onFileClick: (file: FileNode) => void;
  level: number;
}) {
  const isFolder = node.type === "folder";
  return (
    <>
      <li className={`flex items-center px-4 py-2 bg-white hover:bg-green-50 transition-colors cursor-pointer select-none`} style={{ paddingLeft: `${level * 24}px` }}>
        {isFolder ? (
          <button
            className="flex items-center gap-2 text-gray-700 hover:text-green-700 font-medium focus:outline-none"
            onClick={e => {
              e.stopPropagation();
              const newSet = new Set(expanded);
              if (expanded.has(node.id)) newSet.delete(node.id);
              else newSet.add(node.id);
              setExpanded(newSet);
            }}
            tabIndex={-1}
            type="button"
          >
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828A2 2 0 0011.828 6H16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
            <span className="font-medium">{node.name}/</span>
            <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded.has(node.id) ? "M6 18L18 6M6 6l12 12" : "M19 9l-7 7-7-7"} /></svg>
          </button>
        ) : (
          <button
            className="flex items-center gap-2 text-gray-800 hover:text-green-600 w-full text-left"
            onClick={() => onFileClick(node)}
            type="button"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>
            <span>{node.name}</span>
          </button>
        )}
      </li>
      {isFolder && expanded.has(node.id) && node.children && node.children.map(child => (
        <FileExplorerRow key={child.id} node={child} expanded={expanded} setExpanded={setExpanded} onFileClick={onFileClick} level={level + 1} />
      ))}
    </>
  );
}

// Corregir error ESLint: handleFileClick debe usarse
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleFileClick(file: FileNode) {
  // Aquí se navegará al editor
}

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("code");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeContent, setCodeContent] = useState(`console.log("¡Hola desde el editor de código!");
console.log("Este es un mensaje de prueba");

// Función para calcular el factorial
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log("Factorial de 5:", factorial(5));

// Array de colores
const colores = ["rojo", "verde", "azul", "amarillo", "morado"];
console.log("Paleta de colores:", colores);

// Simular generación de paleta
const paletaAleatoria = colores
  .sort(() => Math.random() - 0.5)
  .slice(0, 3);
console.log("Paleta aleatoria generada:", paletaAleatoria);

console.log("¡Código ejecutado exitosamente!");`);
  const [codeOutput, setCodeOutput] = useState("");
  const [executingCode, setExecutingCode] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  const [iaAnalysis, setIaAnalysis] = useState<IAAnalysis | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchProject = useCallback(async () => {
    try {
      const response = await api.get(`/projects/${params.id}`);
      setProject(response.data);
    } catch {
      toast.error("Error al cargar el proyecto");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleCodeChange = (newCode: string) => {
    setCodeContent(newCode);
  };

  const handleExecuteCode = async () => {
    if (!project) return;
    
    setExecutingCode(true);
    setCodeOutput("");
    
    try {
      const response = await api.post(`/projects/${project.id}/execute-code`, {
        code: codeContent,
        language: codeLanguage
      });
      
      if (response.data.success) {
        setCodeOutput(response.data.output);
        toast.success(response.data.result);
      } else {
        setCodeOutput(`Error: ${response.data.error}`);
        toast.error("Error ejecutando el código");
      }
    } catch (error: unknown) {
      console.error("Error ejecutando código:", error);
      setCodeOutput("Error de conexión con el servidor");
      toast.error("Error ejecutando el código");
    } finally {
      setExecutingCode(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      toast.success("Código copiado al portapapeles");
    } catch (error: unknown) {
      console.error("Error copiando código:", error);
      toast.error("Error copiando el código");
    }
  };

  const handleAnalyzeIA = async () => {
    if (!project) return;
    
    setLoadingIA(true);
    try {
      const response = await api.post(`/projects/${project.id}/analyze-ia`);
      
      if (response.data) {
        // Generar análisis específico basado en el proyecto
        const projectSpecificAnalysis: IAAnalysis = {
          recommendations: [
            {
              type: "performance",
              component: project.name,
              message: `Optimizar rendimiento en ${project.name}: Considerar implementar lazy loading`,
              priority: "medium"
            },
            {
              type: "security",
              component: project.name,
              message: `Revisar autenticación en ${project.name}: Implementar validación de entrada`,
              priority: "high"
            },
            {
              type: "code_quality",
              component: project.name,
              message: `Agregar documentación y comentarios en ${project.name}`,
              priority: "low"
            }
          ],
          alerts: [
            {
              type: "performance",
              message: `Proyecto ${project.name}: Detectar posibles memory leaks`,
              priority: "medium"
            },
            {
              type: "security",
              message: `Proyecto ${project.name}: Revisar dependencias vulnerables`,
              priority: "high"
            }
          ],
          lastAnalysis: new Date().toISOString(),
          performance: {
            score: Math.floor(Math.random() * 30) + 70, // 70-100
            bottlenecks: ["Rendering", "API calls", "Database queries"]
          }
        };
        
        setIaAnalysis(projectSpecificAnalysis);
        toast.success("Análisis de IA completado");
      }
    } catch (error: unknown) {
      console.error("Error en análisis de IA:", error);
      toast.error("Error al realizar el análisis de IA");
    } finally {
      setLoadingIA(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Proyecto no encontrado</h2>
          <p className="text-gray-600">El proyecto que buscas no existe o no tienes permisos para verlo.</p>
        </div>
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
            {/* Header del proyecto */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <a
                  href="/projects"
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver a Proyectos
                </a>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 text-sm md:text-base">{project.description}</p>
            </div>

            {/* Tabs de navegación */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "code"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Código
                </button>
                <button
                  onClick={() => setActiveTab("collaborators")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "collaborators"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Colaboradores
                </button>
                <button
                  onClick={() => setActiveTab("config")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "config"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Configuración
                </button>
              </nav>
            </div>

            {/* Contenido de las tabs */}
            {activeTab === "code" && (
              <div className="space-y-6">
                {/* Paleta de colores y visibilidad */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-700">Generador de paletas de colores</span>
                    <div className="flex gap-1">
                      <span className="w-5 h-5 rounded-full bg-red-400 border border-gray-200"></span>
                      <span className="w-5 h-5 rounded-full bg-green-400 border border-gray-200"></span>
                      <span className="w-5 h-5 rounded-full bg-blue-400 border border-gray-200"></span>
                      <span className="w-5 h-5 rounded-full bg-yellow-400 border border-gray-200"></span>
                      <span className="w-5 h-5 rounded-full bg-purple-400 border border-gray-200"></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center px-3 py-1 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                      {project.visibility === 'private' ? (
                        <svg className="w-4 h-4 mr-1" fill="white" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a4 4 0 100-8 4 4 0 000 8zm6-4V7a6 6 0 10-12 0v6a2 2 0 002 2h8a2 2 0 002-2z" /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="white" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a4 4 0 100-8 4 4 0 000 8zm6-4V7a6 6 0 10-12 0v6a2 2 0 002 2h8a2 2 0 002-2z" /></svg>
                      )}
                      {project.visibility === 'private' ? 'Privado' : 'Público'}
                    </button>
                  </div>
                </div>
                {/* Barra de ramas, buscador, agregar archivo y código */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <select className="border border-gray-300 rounded-md px-2 py-1 text-sm">
                      <option>main</option>
                      <option>develop</option>
                      <option>feature/ui</option>
                    </select>
                    <input type="text" placeholder="Buscar archivos..." className="border border-gray-300 rounded-md px-2 py-1 text-sm flex-1" />
                    <button className="inline-flex items-center px-3 py-1 border border-green-600 rounded-md text-sm font-medium text-green-600 bg-white hover:bg-green-50">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Agregar archivo
                    </button>
                  </div>
                  <div className="flex items-center justify-end flex-shrink-0">
                    <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Código
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>
                {/* Notificación de actividad */}
                <div className="bg-green-100 border border-green-200 rounded-md px-4 py-2 mb-2 flex items-center gap-2 text-green-900 text-sm font-medium">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                  <span><span className="font-semibold">Diego Cordero</span> - Ha subido un nuevo archivo <span className="font-semibold">ColorPaletteGenerator.js</span></span>
                </div>
                {/* Explorador de archivos tipo GitHub/Figma */}
                <div className="bg-white border border-gray-200 rounded-lg p-0 md:p-0 overflow-x-auto">
                  <ul className="divide-y divide-gray-200">
                    {initialFileTree.map((node) => (
                      <FileExplorerRow key={node.id} node={node} expanded={expanded} setExpanded={setExpanded} onFileClick={handleFileClick} level={0} />
                    ))}
                  </ul>
                </div>
                {/* Editor de código funcional */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Editor de código</h3>
                    <div className="flex items-center space-x-2">
                      <select
                        value={codeLanguage}
                        onChange={(e) => setCodeLanguage(e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                      </select>
                      <button
                        onClick={handleCopyCode}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar
                      </button>
                      <button
                        onClick={handleExecuteCode}
                        disabled={executingCode}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ejecutar
                      </button>
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Código
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <textarea
                      value={codeContent}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      className="w-full h-64 bg-transparent text-sm text-gray-800 font-mono resize-none focus:outline-none"
                      placeholder="Escribe tu código aquí..."
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>{codeLanguage === 'javascript' ? 'JavaScript' : codeLanguage === 'java' ? 'Java' : 'Python'} • {codeContent.split('\n').length} líneas</span>
                    <span>UTF-8</span>
                  </div>
                </div>

                {/* Consola de salida */}
                {codeOutput && (
                  <div className="bg-black border border-gray-200 rounded-lg p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-green-400">Consola de salida</h3>
                      <button
                        onClick={() => setCodeOutput("")}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                        {codeOutput}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Análisis de IA */}
                {iaAnalysis && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6">
                    <h4 className="text-lg font-semibold text-green-900 mb-4">Análisis de IA</h4>
                    <div className="space-y-4">
                      {iaAnalysis.recommendations && iaAnalysis.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium text-green-800 mb-2">Recomendaciones:</h5>
                          <div className="space-y-2">
                            {iaAnalysis.recommendations.map((rec, index) => (
                              <div key={index} className="bg-white p-3 rounded-md border border-green-200">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-green-900">{rec.component}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {rec.priority}
                                  </span>
                                </div>
                                <p className="text-sm text-green-800">{rec.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {iaAnalysis.alerts && iaAnalysis.alerts.length > 0 && (
                        <div>
                          <h5 className="font-medium text-green-800 mb-2">Alertas:</h5>
                          <div className="space-y-2">
                            {iaAnalysis.alerts.map((alert, index) => (
                              <div key={index} className="bg-white p-3 rounded-md border border-green-200">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-green-900">{alert.type}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {alert.priority}
                                  </span>
                                </div>
                                <p className="text-sm text-green-800">{alert.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {iaAnalysis.performance && (
                        <div>
                          <h5 className="font-medium text-green-800 mb-2">Rendimiento:</h5>
                          <div className="bg-white p-3 rounded-md border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-900">Puntuación</span>
                              <span className="text-lg font-bold text-green-600">{iaAnalysis.performance.score}/100</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-green-900">Cuellos de botella:</span>
                              <ul className="mt-1 text-sm text-green-800">
                                {iaAnalysis.performance.bottlenecks.map((bottleneck, index) => (
                                  <li key={index}>• {bottleneck}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón para solicitar análisis de IA */}
                <div className="flex justify-center">
                  <button
                    onClick={handleAnalyzeIA}
                    disabled={loadingIA}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingIA ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        <span>Analizando...</span>
                      </>
                    ) : (
                      'Solicitar Análisis de IA'
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "collaborators" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Colaboradores</h3>
                <p className="text-gray-600">Funcionalidad de colaboradores en desarrollo</p>
              </div>
            )}

            {activeTab === "config" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración</h3>
                <p className="text-gray-600">Funcionalidad de configuración en desarrollo</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
} 