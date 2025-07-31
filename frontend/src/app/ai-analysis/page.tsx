/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  CodeBracketIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

// Importar Monaco Editor dinámicamente para evitar errores de SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface Project {
  id: number;
  name: string;
  language: string;
  files?: string[];
  pattern?: "monolith" | "microservices" | "Standard" | "BFF" | "Sidecar";
}

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  code?: string;
}

export default function AIAnalysisPage() {
  const { token } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [codeContent, setCodeContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [analyzingWithN8n, setAnalyzingWithN8n] = useState(false);
  const [n8nAnalysis, setN8nAnalysis] = useState<any>(null);
  const [analyzingMetrics, setAnalyzingMetrics] = useState(false);
  const [metricsAnalysis, setMetricsAnalysis] = useState<any>(null);

  // Función para guardar código en la base de datos
  const saveCodeToDatabase = async (
    projectId: number,
    fileName: string,
    code: string,
  ) => {
    if (!token) return;

    try {
      setSaving(true);
      await api.post("/ai/save-code", {
        projectId,
        fileName,
        code,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving code:", error);
      // Aquí podrías mostrar una notificación de error
    } finally {
      setSaving(false);
    }
  };

  // Función para cargar código guardado desde la base de datos
  const loadCodeFromDatabase = async (projectId: number, fileName: string) => {
    if (!token) return null;

    try {
      const response = await api.get(`/ai/load-code/${projectId}/${fileName}`);
      return response.data.code;
    } catch (error) {
      console.error("Error loading code:", error);
      return null;
    }
  };

  // Función para analizar código con n8n
  const analyzeWithN8n = async () => {
    if (!selectedProject || !selectedFile || !codeContent || !token) return;

    try {
      setAnalyzingWithN8n(true);
      const response = await api.post("/ai/analyze-with-n8n", {
        projectId: selectedProject.id,
        fileName: selectedFile,
        code: codeContent,
      });

      setN8nAnalysis(response.data);
      console.log("Análisis de n8n:", response.data);
    } catch (error) {
      console.error("Error analyzing with n8n:", error);
      // Aquí podrías mostrar una notificación de error
    } finally {
      setAnalyzingWithN8n(false);
    }
  };

  // Función para analizar métricas con n8n_v2
  const analyzeMetricsWithN8n = async () => {
    if (!selectedProject || !selectedFile || !codeContent || !token) return;

    try {
      setAnalyzingMetrics(true);
      const response = await api.post("/ai/analyze-metrics-with-n8n", {
        projectId: selectedProject.id,
        fileName: selectedFile,
        code: codeContent,
      });

      setMetricsAnalysis(response.data);
      console.log("Análisis de métricas de n8n:", response.data);
    } catch (error) {
      console.error("Error analyzing metrics with n8n:", error);
      // Aquí podrías mostrar una notificación de error
    } finally {
      setAnalyzingMetrics(false);
    }
  };

  // Debounce para guardado automático
  useEffect(() => {
    if (!selectedProject || !selectedFile || !codeContent) return;

    const timeoutId = setTimeout(() => {
      saveCodeToDatabase(selectedProject.id, selectedFile, codeContent);
    }, 2000); // Guardar 2 segundos después de dejar de escribir

    return () => clearTimeout(timeoutId);
  }, [codeContent, selectedProject, selectedFile, token]);

  // Cargar proyectos disponibles
  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) return;

      try {
        const response = await api.get("/ai/projects");
        const projects = response.data;

        setProjects(projects);
        if (projects.length > 0) {
          setSelectedProject(projects[0]);
          setSelectedFile("main.js");
          // El código se cargará automáticamente en el useEffect que maneja selectedProject y selectedFile
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };

    fetchProjects();
  }, [token]);

  // Actualizar código cuando cambie el archivo seleccionado
  useEffect(() => {
    if (selectedProject && selectedFile) {
      // Primero intentar cargar código guardado desde la base de datos
      loadCodeFromDatabase(selectedProject.id, selectedFile).then(
        (savedCode) => {
          if (savedCode) {
            // Si hay código guardado, usarlo
            setCodeContent(savedCode);
          } else {
            // Si no hay código guardado, generar código nuevo
            setCodeContent(generateProjectCode(selectedProject, selectedFile));
          }
        },
      );
    }
  }, [selectedProject, selectedFile]);

  const generateProjectCode = (project: Project, fileName: string) => {
    // Código específico para cada archivo
    if (fileName === "main.js") {
      return `// Archivo principal - ${project.name}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configuración de rutas
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(\`Servidor corriendo en puerto \${PORT}\`);
  console.log(\`Ambiente: \${process.env.NODE_ENV}\`);
});`;
    } else if (fileName === "App.tsx") {
      return `// Componente principal de React - ${project.name}
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Componentes
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar autenticación al cargar
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header user={user} />
              <main className="flex-1 p-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;`;
    } else if (fileName === "server.js") {
      return `// Servidor Express - ${project.name}
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de base de datos
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// Middleware de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
});
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(\`Servidor corriendo en puerto \${PORT}\`);
  console.log(\`Ambiente: \${process.env.NODE_ENV}\`);
});`;
    } else {
      // Código por defecto para otros archivos
      return `// Archivo: ${fileName} - Proyecto: ${project.name}
// Este es un archivo de ejemplo para ${fileName}

console.log('Archivo cargado:', '${fileName}');
console.log('Proyecto:', '${project.name}');

// Función de ejemplo
function procesarDatos(datos) {
  return datos.map(item => ({
    ...item,
    procesado: true,
    timestamp: new Date().toISOString()
  }));
}

// Exportar función
module.exports = {
  procesarDatos
};`;
    }
  };

  const sendQuery = async () => {
    if (!userQuery.trim() || !selectedProject) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: userQuery,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    const currentQuery = userQuery;
    setUserQuery("");

    try {
      // Conectar con el backend real
      const response = await fetch("http://localhost:3001/api/ai/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          query: currentQuery,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: data.response,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      } else {
        // Fallback a respuesta local si el backend falla
        const aiResponse = generateAIResponse(currentQuery, selectedProject);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: aiResponse,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error sending query:", error);
      // Fallback a respuesta local
      const aiResponse = generateAIResponse(currentQuery, selectedProject);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    }
  };

  const generateAIResponse = (query: string, project: Project) => {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes("optimizar") ||
      lowerQuery.includes("performance")
    ) {
      return `Para optimizar el rendimiento de "${project.name}", te recomiendo:
1. Implementar caché con Redis para consultas frecuentes
2. Usar lazy loading para componentes pesados
3. Optimizar las consultas a la base de datos
4. Implementar compresión gzip para respuestas HTTP`;
    }

    if (lowerQuery.includes("seguridad") || lowerQuery.includes("security")) {
      return `Recomendaciones de seguridad para "${project.name}":
1. Implementar autenticación JWT
2. Validar todos los inputs del usuario
3. Usar HTTPS en producción
4. Implementar rate limiting
5. Sanitizar datos antes de mostrarlos`;
    }

    if (
      lowerQuery.includes("estructura") ||
      lowerQuery.includes("arquitectura")
    ) {
      return `Para mejorar la arquitectura de "${project.name}":
1. Separar responsabilidades en capas
2. Implementar el patrón Repository
3. Usar inyección de dependencias
4. Aplicar principios SOLID`;
    }

    return `Entiendo tu pregunta sobre "${project.name}". ¿Podrías ser más específico sobre qué aspecto del código te gustaría analizar?`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="flex">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-white p-6">
            {/* Header de la sección */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Análisis de IA
              </h1>
              <p className="text-gray-600">
                Analiza tu código con inteligencia artificial para
                optimizaciones y mejoras
              </p>
            </div>

            {/* Selector de proyecto y archivo */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Proyecto
                </label>
                <select
                  value={selectedProject?.id || ""}
                  onChange={(e) => {
                    const project = projects.find(
                      (p) => p.id === parseInt(e.target.value),
                    );
                    setSelectedProject(project || null);
                    if (project) {
                      setSelectedFile("main.js");
                      setCodeContent(generateProjectCode(project, "main.js"));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                >
                  <option value="">Selecciona un proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.language})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo
                </label>
                <select
                  value={selectedFile}
                  onChange={(e) => {
                    setSelectedFile(e.target.value);
                    if (selectedProject && e.target.value) {
                      setCodeContent(
                        generateProjectCode(selectedProject, e.target.value),
                      );
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                >
                  <option value="">Selecciona un archivo</option>
                  <option value="main.js">main.js</option>
                  <option value="App.tsx">App.tsx</option>
                  <option value="server.js">server.js</option>
                </select>
              </div>
            </div>

            {selectedProject && selectedFile && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor de código */}
                <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-[600px]">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center">
                      <DocumentIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {selectedFile}
                      </span>
                      {saving && (
                        <div className="ml-3 flex items-center text-xs text-gray-500">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1"></div>
                          Guardando...
                        </div>
                      )}
                      {lastSaved && !saving && (
                        <div className="ml-3 text-xs text-green-600">
                          Guardado {lastSaved.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={analyzeWithN8n}
                        disabled={
                          analyzingWithN8n ||
                          analyzingMetrics ||
                          !selectedProject ||
                          !selectedFile ||
                          !codeContent
                        }
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {analyzingWithN8n ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Analizando...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                            Análisis IA
                          </div>
                        )}
                      </Button>
                      <Button
                        onClick={analyzeMetricsWithN8n}
                        disabled={
                          analyzingWithN8n ||
                          analyzingMetrics ||
                          !selectedProject ||
                          !selectedFile ||
                          !codeContent
                        }
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        {analyzingMetrics ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Analizando...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <LightBulbIcon className="w-4 h-4 mr-2" />
                            Métricas
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <MonacoEditor
                      height="100%"
                      language="javascript"
                      theme="vs-light"
                      value={codeContent}
                      onChange={(value) => setCodeContent(value || "")}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>

                {/* Panel de chat */}
                <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-[600px]">
                  <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chat con IA
                    </h3>
                    <p className="text-sm text-gray-600">
                      Haz preguntas sobre tu código y obtén respuestas
                      inteligentes
                    </p>
                  </div>

                  {/* Historial de chat */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <LightBulbIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Inicia una conversación
                        </h3>
                        <p className="text-gray-600">
                          Escribe una pregunta sobre tu código para comenzar
                        </p>
                      </div>
                    ) : (
                      chatHistory.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.type === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.type === "user"
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input de chat */}
                  <div className="p-4 border-t border-gray-200 flex-shrink-0">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendQuery()}
                        placeholder="Escribe tu pregunta..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <Button
                        onClick={sendQuery}
                        disabled={!userQuery.trim()}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <PaperAirplaneIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resultados de análisis */}
            {(n8nAnalysis || metricsAnalysis) && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Análisis principal */}
                {n8nAnalysis && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MagnifyingGlassIcon className="w-5 h-5 text-blue-500 mr-2" />
                      Análisis de IA
                    </h3>
                    <div className="space-y-4">
                      {n8nAnalysis.analysis ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">
                            Respuesta del IA Agent
                          </h4>
                          <div className="text-sm text-blue-800 whitespace-pre-wrap">
                            {typeof n8nAnalysis.analysis === "string"
                              ? n8nAnalysis.analysis
                              : JSON.stringify(n8nAnalysis.analysis, null, 2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-600">
                            No se recibió respuesta del análisis
                          </p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        <p>
                          Lenguaje detectado:{" "}
                          <span className="font-medium">
                            {n8nAnalysis.language}
                          </span>
                        </p>
                        <p>
                          Archivo analizado:{" "}
                          <span className="font-medium">{selectedFile}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Análisis de métricas */}
                {metricsAnalysis && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <LightBulbIcon className="w-5 h-5 text-purple-500 mr-2" />
                      Métricas Detalladas
                    </h3>
                    <div className="space-y-4">
                      {metricsAnalysis.analysis ? (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-purple-900 mb-2">
                            Análisis de Métricas
                          </h4>
                          <div className="text-sm text-purple-800 whitespace-pre-wrap">
                            {typeof metricsAnalysis.analysis === "string"
                              ? metricsAnalysis.analysis
                              : JSON.stringify(
                                  metricsAnalysis.analysis,
                                  null,
                                  2,
                                )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-600">
                            No se recibió respuesta del análisis
                          </p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        <p>
                          Lenguaje detectado:{" "}
                          <span className="font-medium">
                            {metricsAnalysis.language}
                          </span>
                        </p>
                        <p>
                          Archivo analizado:{" "}
                          <span className="font-medium">{selectedFile}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!selectedProject && (
              <div className="text-center py-12">
                <CodeBracketIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona un proyecto
                </h3>
                <p className="text-gray-600">
                  Elige un proyecto para comenzar el análisis de IA
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
