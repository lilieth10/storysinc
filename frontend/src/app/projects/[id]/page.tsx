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
  // Eliminado: codeContent y setCodeContent, ahora se usa editorContent
  const [codeOutput, setCodeOutput] = useState("");
  // Eliminados: estados de carga no usados
  // Listener para recibir mensajes del iframe y actualizar el estado
  useEffect(() => {
    function handleCodeOutput(event: CustomEvent) {
      setCodeOutput(event.detail);
    }
    function handleIaAnalysis(event: CustomEvent) {
      setIaAnalysis(event.detail);
    }
    window.addEventListener('codeOutput', handleCodeOutput as EventListener);
    window.addEventListener('iaAnalysis', handleIaAnalysis as EventListener);
    return () => {
      window.removeEventListener('codeOutput', handleCodeOutput as EventListener);
      window.removeEventListener('iaAnalysis', handleIaAnalysis as EventListener);
    };
  }, []);
  const [iaAnalysis, setIaAnalysis] = useState<IAAnalysis | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [editorLanguage, setEditorLanguage] = useState<string>("javascript");

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


  // Eliminado: handleExecuteCode, ahora la ejecución se maneja vía iframe


  // Eliminado: handleAnalyzeIA, ahora el análisis IA se maneja vía iframe

  function handleFileClick(file: FileNode) {
    setSelectedFile(file);
    const content = "// Código de ejemplo para " + file.name + "\nconsole.log('Hello, World!');";
    let lang = "plaintext";
    if (file.name.endsWith('.js') || file.name.endsWith('.ts')) lang = "javascript";
    else if (file.name.endsWith('.py')) lang = "python";
    else if (file.name.endsWith('.java')) lang = "java";
    setEditorContent(content);
    setEditorLanguage(lang);
    // Enviar el contenido y lenguaje al iframe si ya está cargado
    setTimeout(() => {
      const iframe = document.getElementById('editor-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'sync', code: content, language: lang, projectId: project?.id }, '*');
      }
    }, 300);
  }

  function handleBackToRepo() {
    setSelectedFile(null);
    setCodeOutput("");
    setIaAnalysis(null);
  }

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
                {selectedFile ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={handleBackToRepo} className="text-green-600 hover:underline font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Volver al repositorio
                      </button>
                      <span className="text-sm text-gray-500 font-mono">{selectedFile.name}</span>
                    </div>
                    <div className="mb-4">
                      {/* Editor aislado en iframe, diseño responsivo y seguro */}
                      <iframe
                        id="editor-iframe"
                        title="Editor de código seguro"
                        src={`/projects/${project.id}/editor-iframe?file=${selectedFile?.name ?? ''}&lang=${editorLanguage}`}
                        style={{ width: '100%', height: '350px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff' }}
                        className="shadow-sm"
                        allow="clipboard-read; clipboard-write"
                        onLoad={() => {
                          // Enviar el contenido y lenguaje al iframe al cargar
                          const iframe = document.getElementById('editor-iframe') as HTMLIFrameElement;
                          if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({ type: 'sync', code: editorContent, language: editorLanguage, projectId: project.id }, '*');
                          }
                        }}
                        onError={(e) => {
                          const container = document.createElement('div');
                          container.style.textAlign = 'center';
                          container.style.color = '#b91c1c';
                          container.style.padding = '40px';
                          container.innerText = 'No se pudo cargar el editor. Verifica que el frontend esté corriendo y la ruta sea válida.';
                          e.target.replaceWith(container);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      {/* Botones envían mensajes al iframe para ejecutar código y análisis IA */}
                      <button
                        onClick={() => {
                          const iframe = document.getElementById('editor-iframe') as HTMLIFrameElement;
                          if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({ type: 'execute', code: editorContent, language: editorLanguage, projectId: project.id }, '*');
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Ejecutar
                      </button>
                      <button
                        onClick={() => {
                          const iframe = document.getElementById('editor-iframe') as HTMLIFrameElement;
                          if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({ type: 'analyze-ia', code: editorContent, language: editorLanguage, projectId: project.id }, '*');
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 font-semibold rounded-md border border-green-600 hover:bg-green-100"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Analizar IA
                      </button>
                    </div>
                    {codeOutput && (
                      <div className="bg-black text-green-400 font-mono rounded-md p-4 mb-4 whitespace-pre-wrap text-sm">
                        {codeOutput}
                      </div>
                    )}
                    {/* Listener para recibir mensajes del iframe con el resultado de ejecución o análisis IA */}
                    <script dangerouslySetInnerHTML={{
                      __html: `
                        window.addEventListener('message', function(event) {
                          if (event.data && event.data.type === 'code-output') {
                            window.dispatchEvent(new CustomEvent('codeOutput', { detail: event.data.output }));
                          }
                          if (event.data && event.data.type === 'ia-analysis') {
                            window.dispatchEvent(new CustomEvent('iaAnalysis', { detail: event.data.analysis }));
                          }
                        });
                      `
                    }} />
                    {iaAnalysis && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
                        <h4 className="text-base font-semibold text-green-900 mb-2">Análisis de IA</h4>
                        <div className="space-y-2">
                          {iaAnalysis.recommendations?.map((rec, i) => (
                            <div key={i} className="bg-white p-2 rounded-md border border-green-200 flex items-center justify-between">
                              <span className="text-green-900 font-medium">{rec.message}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${rec.priority === 'high' ? 'bg-red-100 text-red-800' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{rec.priority}</span>
                            </div>
                          ))}
                          {iaAnalysis.alerts?.map((alert, i) => (
                            <div key={i} className="bg-white p-2 rounded-md border border-green-200 flex items-center justify-between">
                              <span className="text-green-900 font-medium">{alert.message}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${alert.priority === 'high' ? 'bg-red-100 text-red-800' : alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{alert.priority}</span>
                            </div>
                          ))}
                          {iaAnalysis.performance && (
                            <div className="bg-white p-2 rounded-md border border-green-200">
                              <span className="text-green-900 font-medium">Puntuación: {iaAnalysis.performance.score}/100</span>
                              <div className="text-green-800 text-xs mt-1">Cuellos de botella: {iaAnalysis.performance.bottlenecks.join(", ")}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Explorador de archivos tipo GitHub/Figma
                  <div className="bg-white border border-gray-200 rounded-lg p-0 md:p-0 overflow-x-auto">
                    <ul className="divide-y divide-gray-200">
                      {initialFileTree.map((node) => (
                        <FileExplorerRow key={node.id} node={node} expanded={expanded} setExpanded={setExpanded} onFileClick={handleFileClick} level={0} />
                      ))}
                    </ul>
                  </div>
                )}
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