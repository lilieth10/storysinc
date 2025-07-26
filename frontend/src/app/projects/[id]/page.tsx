'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, DocumentIcon, PlayIcon, BookmarkIcon, ArrowLeftIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

// Monaco Editor dinámico para evitar SSR
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
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
  };
  createdAt: string;
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

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const projectId = params.id as string;

  // Estados principales
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'codigo' | 'colaboradores' | 'configuracion'>('codigo');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string>('');
  const [iaAnalysis, setIaAnalysis] = useState<IAAnalysis | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [showPublicDropdown, setShowPublicDropdown] = useState(false);
  const [showAddFileDropdown, setShowAddFileDropdown] = useState(false);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Efectos principales
  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (projectId) {
      fetchProject();
      fetchFileTree();
    }
  }, [token, projectId, router]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowPublicDropdown(false);
        setShowAddFileDropdown(false);
        setShowCodeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Funciones de API
  const fetchProject = useCallback(async () => {
    try {
      const response = await api.get(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(response.data);
    } catch (error) {
      toast.error('Error al cargar el proyecto');
      router.push('/projects');
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
      // Si falla, crear estructura ejemplo
      const exampleTree: FileNode[] = [
        {
          id: '1',
          name: 'src',
          type: 'folder',
          path: '/src',
          children: [
            {
              id: '2',
              name: 'components',
              type: 'folder',
              path: '/src/components',
              children: [
                {
                  id: '3',
                  name: 'Button.tsx',
                  type: 'file',
                  path: '/src/components/Button.tsx',
                  content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`btn btn-\${variant} \${disabled ? 'opacity-50' : ''}\`}
    >
      {children}
    </button>
  );
};`,
                  language: 'typescript'
                }
              ]
            },
            {
              id: '4',
              name: 'utils',
              type: 'folder',
              path: '/src/utils',
              children: [
                {
                  id: '5',
                  name: 'api.ts',
                  type: 'file',
                  path: '/src/utils/api.ts',
                  content: `export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
      method: 'GET',
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return response.json();
  }

  async post<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return response.json();
  }
}

export const apiClient = new ApiClient();`,
                  language: 'typescript'
                }
              ]
            }
          ]
        },
        {
          id: '6',
          name: 'package.json',
          type: 'file',
          path: '/package.json',
          content: `{
  "name": "${project?.name || 'my-project'}",
  "version": "1.0.0",
  "description": "${project?.description || 'Project description'}",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}`,
          language: 'json'
        }
      ];
      setFileTree(exampleTree);
    }
  }, [projectId, token, project]);

  const saveFile = useCallback(async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/files`, {
        filePath: selectedFile.path,
        content: editorContent,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Archivo guardado correctamente');
    } catch (error) {
      toast.error('Error al guardar el archivo');
    } finally {
      setSaving(false);
    }
  }, [selectedFile, editorContent, projectId, token]);

  const executeCode = useCallback(async () => {
    if (!selectedFile) return;

    setExecuting(true);
    setExecutionOutput('Ejecutando código...\n');

    try {
      const response = await api.post<ExecutionResult>(`/projects/${projectId}/execute`, {
        filePath: selectedFile.path,
        content: editorContent,
        language: selectedFile.language || 'javascript',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setExecutionOutput(response.data.output);
      } else {
        setExecutionOutput(`Error: ${response.data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      setExecutionOutput('Error: No se pudo ejecutar el código');
    } finally {
      setExecuting(false);
    }
  }, [selectedFile, editorContent, projectId, token]);

  const analyzeWithIA = useCallback(async () => {
    if (!selectedFile || !editorContent) return;

    setLoadingIA(true);
    try {
      const response = await api.post<IAAnalysis>(`/projects/${projectId}/analyze`, {
        filePath: selectedFile.path,
        content: editorContent,
        language: selectedFile.language || 'javascript',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIaAnalysis(response.data);
      toast.success('Análisis de IA completado');
    } catch (error) {
      toast.error('Error al analizar con IA');
    } finally {
      setLoadingIA(false);
    }
  }, [selectedFile, editorContent, projectId, token]);

  // Funciones de interfaz
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
    if (file.type === 'file') {
      setSelectedFile(file);
      setEditorContent(file.content || '');
      setExecutionOutput('');
      setIaAnalysis(null);
    }
  };

  const getLanguageFromFile = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  const copyCode = () => {
    navigator.clipboard.writeText(editorContent);
    toast.success('Código copiado al portapapeles');
  };

  const handleBackToProjects = () => {
    router.push('/projects');
  };

  const handleSearchFiles = (query: string) => {
    setSearchQuery(query);
    // Función para buscar archivos en el árbol
    if (query.trim()) {
      const searchInTree = (nodes: FileNode[]): FileNode[] => {
        const results: FileNode[] = [];
        for (const node of nodes) {
          if (node.name.toLowerCase().includes(query.toLowerCase())) {
            results.push(node);
          }
          if (node.children) {
            results.push(...searchInTree(node.children));
          }
        }
        return results;
      };
      const results = searchInTree(fileTree);
      if (results.length > 0) {
        handleFileSelect(results[0]); // Selecciona el primer resultado
      }
    }
  };

  const createNewFile = () => {
    const fileName = prompt('Nombre del nuevo archivo:');
    if (fileName) {
      const newFile: FileNode = {
        id: `new-${Date.now()}`,
        name: fileName,
        type: 'file',
        path: `/${fileName}`,
        content: '// Nuevo archivo\n',
        language: getLanguageFromFile(fileName)
      };
      setFileTree([...fileTree, newFile]);
      handleFileSelect(newFile);
      toast.success(`Archivo ${fileName} creado`);
    }
    setShowAddFileDropdown(false);
  };

  const cloneRepository = () => {
    if (project?.owner?.name && project?.name) {
      navigator.clipboard.writeText(`git clone https://github.com/${project.owner.name}/${project.name}.git`);
      toast.success('Comando de clonación copiado al portapapeles');
    } else {
      toast.error('Error: información del proyecto no disponible');
    }
    setShowCodeDropdown(false);
  };

  const downloadZip = () => {
    toast.success('Descarga de archivo ZIP iniciada');
    setShowCodeDropdown(false);
  };

  // Función recursiva para renderizar el árbol de archivos
  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${
            selectedFile?.id === node.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleExpanded(node.id);
            } else {
              handleFileSelect(node);
            }
          }}
        >
          {node.type === 'folder' && (
            <>
              {expanded.has(node.id) ? (
                <ChevronDownIcon className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 mr-1" />
              )}
              <FolderIcon className="w-4 h-4 mr-2 text-blue-500" />
            </>
          )}
          {node.type === 'file' && (
            <DocumentIcon className="w-4 h-4 mr-2 text-gray-500 ml-5" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === 'folder' && expanded.has(node.id) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Proyecto no encontrado
          </h2>
          <Button onClick={handleBackToProjects}>
            Volver a Proyectos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToProjects}
                className="mr-4"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project.description || 'Sin descripción'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                project.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
                {project.status}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                {project.pattern}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('codigo')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'codigo'
                  ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📝 Código
            </button>
            <button
              onClick={() => setActiveTab('colaboradores')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'colaboradores'
                  ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              👥 Colaboradores
            </button>
            <button
              onClick={() => setActiveTab('configuracion')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'configuracion'
                  ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              ⚙️ Configuración
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'codigo' && (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {/* Figma-style Header - Two Rows */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                         {/* Primera fila - Título del proyecto y botón Public */}
             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
               <div className="flex items-center">
                 <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                   <span className="text-sm font-medium text-gray-600 dark:text-gray-300">GP</span>
                 </div>
                 <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                   Generador de Paletas de Colores
                 </h2>
               </div>
              <div className="flex items-center space-x-3">
                {/* Botón Public verde con candadito */}
                <div className="relative dropdown-container">
                  <button 
                    onClick={() => setShowPublicDropdown(!showPublicDropdown)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md border border-green-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1C5.03 1 1 5.03 1 10s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM9 5a3 3 0 113 3c0 .31-.06.6-.17.87L12 9v1a1 1 0 01-1 1H9v1a1 1 0 01-1 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-2.59l4.83-4.83c.27-.11.56-.17.87-.17H9z" clipRule="evenodd" />
                    </svg>
                    Public
                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                  </button>
                  {showPublicDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                      <div className="p-3">
                        <div className="flex items-center mb-2">
                          <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 1C5.03 1 1 5.03 1 10s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM9 5a3 3 0 113 3c0 .31-.06.6-.17.87L12 9v1a1 1 0 01-1 1H9v1a1 1 0 01-1 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-2.59l4.83-4.83c.27-.11.56-.17.87-.17H9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium text-gray-900 dark:text-white">Público</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Cualquier persona en Internet puede ver este repositorio
                        </p>
                        <button 
                          onClick={() => setShowPublicDropdown(false)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Cambiar a privado
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

                         {/* Segunda fila - 5 elementos de navegación */}
             <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-700">
               <div className="flex items-center space-x-4">
                 {/* 1. Branch Selector - Principal */}
                 <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 717 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                   </svg>
                   <span>Principal</span>
                   <ChevronDownIcon className="w-4 h-4 ml-1" />
                 </button>

                 {/* 2. Branches info */}
                 <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                   <span className="font-medium text-gray-900 dark:text-white">6 Branches</span>
                 </div>
               </div>

               <div className="flex items-center space-x-3">
                 {/* 3. Buscador */}
                 <div className="relative">
                   <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                   </svg>
                   <input
                     type="text"
                     placeholder="Ir al archivo"
                     value={searchQuery}
                     onChange={(e) => handleSearchFiles(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         handleSearchFiles(searchQuery);
                       }
                       if (e.key === 'Escape') {
                         setSearchQuery('');
                       }
                     }}
                     className="w-52 pl-10 pr-8 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                   />
                   <kbd className="absolute right-2 top-1/2 transform -translate-y-1/2 px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-500 rounded font-mono">
                     t
                   </kbd>
                 </div>

                 {/* 4. Add file desplegable */}
                 <div className="relative dropdown-container">
                   <button 
                     onClick={() => setShowAddFileDropdown(!showAddFileDropdown)}
                     className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                   >
                     <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                     </svg>
                     Agregar archivo
                     <ChevronDownIcon className="w-4 h-4 ml-1" />
                   </button>
                   {showAddFileDropdown && (
                     <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                       <div className="py-1">
                         <button 
                           onClick={createNewFile}
                           className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                         >
                           <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                           </svg>
                           Crear nuevo archivo
                         </button>
                         <button 
                           onClick={() => {
                             const folderName = prompt('Nombre de la nueva carpeta:');
                             if (folderName) {
                               toast.success(`Carpeta ${folderName} creada`);
                             }
                             setShowAddFileDropdown(false);
                           }}
                           className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                         >
                           <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                           </svg>
                           Crear nueva carpeta
                         </button>
                         <hr className="my-1 border-gray-200 dark:border-gray-700" />
                         <button 
                           onClick={() => {
                             const input = document.createElement('input');
                             input.type = 'file';
                             input.onchange = (e) => {
                               const file = (e.target as HTMLInputElement).files?.[0];
                               if (file) {
                                 toast.success(`Archivo ${file.name} subido`);
                               }
                             };
                             input.click();
                             setShowAddFileDropdown(false);
                           }}
                           className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                         >
                           <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                           </svg>
                           Subir archivos
                         </button>
                       </div>
                     </div>
                   )}
                 </div>

                 {/* 5. Code desplegable verde */}
                 <div className="relative dropdown-container">
                   <div className="flex items-center">
                     <button 
                       onClick={cloneRepository}
                       className="flex items-center px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-l-md border border-green-600 transition-colors"
                     >
                       <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 11-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                       </svg>
                       Código
                     </button>
                     <button 
                       onClick={() => setShowCodeDropdown(!showCodeDropdown)}
                       className="px-2 py-1.5 text-white bg-green-600 hover:bg-green-700 border border-l-0 border-green-600 rounded-r-md transition-colors"
                     >
                       <ChevronDownIcon className="w-4 h-4" />
                     </button>
                   </div>
                   {showCodeDropdown && (
                     <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                       <div className="p-4">
                         <div className="mb-4">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             Clonar con HTTPS
                           </label>
                           <div className="flex items-center">
                             <input
                               type="text"
                               readOnly
                               value={`https://github.com/${project?.owner?.name || 'usuario'}/${project?.name || 'proyecto'}.git`}
                               className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md font-mono"
                             />
                             <button
                               onClick={cloneRepository}
                               className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-200 dark:hover:bg-gray-500"
                               title="Copiar URL"
                             >
                               <ClipboardDocumentIcon className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <button
                             onClick={downloadZip}
                             className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center"
                           >
                             <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                             </svg>
                             Descargar ZIP
                           </button>
                           <button
                             onClick={() => {
                               toast.success('Abriendo con GitHub Desktop...');
                               setShowCodeDropdown(false);
                             }}
                             className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center"
                           >
                             <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                             </svg>
                             Abrir con GitHub Desktop
                           </button>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
                          </div>
           </div>

           {/* Commit info bar - Barra verde del último commit */}
           <div className="bg-green-100 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-6 py-3">
             <div className="flex items-center">
               <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                 <span className="text-sm font-medium text-gray-600 dark:text-gray-300">DC</span>
               </div>
               <div className="flex-1">
                 <span className="text-sm font-medium text-gray-900 dark:text-white">Diego Cordero</span>
                 <span className="text-sm text-gray-600 dark:text-gray-400 mx-2">-</span>
                 <span className="text-sm text-gray-700 dark:text-gray-300">Ha subido un nuevo archivo ColorPaletteGenerator.js</span>
               </div>
               <div className="text-sm text-gray-500 dark:text-gray-400">
                 hace 2 horas
               </div>
             </div>
           </div>

           {/* Main Content Area */}
          <div className="flex flex-1">
            {/* Sidebar - File Explorer */}
            <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Explorador de Archivos
                </h3>
                <div className="space-y-1">
                  {renderFileTree(fileTree)}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {selectedFile ? (
                <>
                  {/* File Header */}
                  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentIcon className="w-5 h-5 mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedFile.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {selectedFile.path}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyCode}
                          disabled={!editorContent}
                        >
                          <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                          Copiar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={saveFile}
                          disabled={saving}
                        >
                          <BookmarkIcon className="w-4 h-4 mr-1" />
                          {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={executeCode}
                          disabled={executing}
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          {executing ? 'Ejecutando...' : 'Ejecutar'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={analyzeWithIA}
                          disabled={loadingIA}
                        >
                          {loadingIA ? 'Analizando...' : 'Analizar con IA'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex">
                    {/* Editor */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 relative">
                        <MonacoEditor
                          height="100%"
                          language={getLanguageFromFile(selectedFile.name)}
                          value={editorContent}
                          theme="vs-light"
                          options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            renderWhitespace: 'selection',
                            scrollBeyondLastLine: false,
                            readOnly: false,
                            formatOnType: true,
                            formatOnPaste: true,
                          }}
                          onChange={(value) => setEditorContent(value || '')}
                          onMount={() => setIsEditorReady(true)}
                        />
                      </div>
                    </div>

                    {/* Right Panel - Output & IA Analysis */}
                    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                      {/* Output Section */}
                      <div className="flex-1 border-b border-gray-200 dark:border-gray-700">
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Salida del Código
                          </h3>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 h-48 overflow-y-auto">
                            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {executionOutput || 'Ejecuta el código para ver la salida...'}
                            </pre>
                          </div>
                        </div>
                      </div>

                      {/* IA Analysis Section */}
                      <div className="flex-1">
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Análisis de IA
                          </h3>
                          {iaAnalysis ? (
                            <div className="space-y-4">
                              <Card className="p-3">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  Rendimiento ({iaAnalysis.performance.score}/100)
                                </h4>
                                <div className="space-y-1">
                                  {iaAnalysis.performance.suggestions.map((suggestion, idx) => (
                                    <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                      • {suggestion}
                                    </p>
                                  ))}
                                </div>
                              </Card>

                              <Card className="p-3">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  Seguridad ({iaAnalysis.security.score}/100)
                                </h4>
                                <div className="space-y-1">
                                  {iaAnalysis.security.risks.map((risk, idx) => (
                                    <p key={idx} className="text-xs text-red-600 dark:text-red-400">
                                      ⚠ {risk}
                                    </p>
                                  ))}
                                </div>
                              </Card>

                              <Card className="p-3">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  Mejores Prácticas ({iaAnalysis.bestPractices.score}/100)
                                </h4>
                                <div className="space-y-1">
                                  {iaAnalysis.bestPractices.issues.map((issue, idx) => (
                                    <p key={idx} className="text-xs text-yellow-600 dark:text-yellow-400">
                                      ↻ {issue}
                                    </p>
                                  ))}
                                </div>
                              </Card>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Haz clic en "Analizar con IA" para obtener sugerencias de mejora
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
                    <DocumentIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Selecciona un archivo
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Elige un archivo del explorador para comenzar a editar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Colaboradores Tab */}
      {activeTab === 'colaboradores' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Colaboradores del Proyecto
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Gestiona quién puede acceder y modificar este proyecto
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  + Invitar Colaborador
                </Button>
              </div>

              {/* Owner */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Propietario
                </h3>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {project?.owner?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {project?.owner?.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {project?.owner?.email || 'usuario@ejemplo.com'}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 px-2 py-1 rounded-full">
                      Propietario
                    </span>
                  </div>
                </div>
              </div>

              {/* Colaboradores */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Colaboradores
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-25" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                  <p>No hay colaboradores aún</p>
                  <p className="text-xs mt-1">Invita a tu equipo para trabajar juntos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuración Tab */}
      {activeTab === 'configuracion' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Configuración del Proyecto
              </h2>

              <div className="space-y-6">
                {/* Información Básica */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Información Básica
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Proyecto
                      </label>
                      <input
                        type="text"
                        defaultValue={project?.name}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Patrón Arquitectónico
                      </label>
                      <select
                        defaultValue={project?.pattern}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="monolith">Monolito</option>
                        <option value="microservices">Microservicios</option>
                        <option value="serverless">Serverless</option>
                        <option value="event-driven">Event-Driven</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      defaultValue={project?.description}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Describe tu proyecto..."
                    />
                  </div>
                </div>

                {/* Configuración Avanzada */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Configuración Avanzada
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Análisis automático de IA
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Permitir que la IA analice el código automáticamente
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Sincronización automática
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sincronizar cambios automáticamente con el repositorio
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-6">
                  <div className="flex justify-between">
                    <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                      Eliminar Proyecto
                    </Button>
                    <div className="flex space-x-3">
                      <Button variant="outline">
                        Cancelar
                      </Button>
                      <Button>
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 