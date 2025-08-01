/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

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

// Importar ApexCharts dinámicamente (usado en el futuro)
// const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Importar Monaco Editor dinámicamente para evitar errores de SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

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
  const [ setN8nAnalysis] = useState<any>(null); // Usado en el futuro
  const [analyzingMetrics, setAnalyzingMetrics] = useState(false);
  const [ setMetricsAnalysis] = useState<any>(null); // Usado en el futuro
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisType, setAnalysisType] = useState<"ai" | "metrics" | null>(
    null,
  );
  const [processedAnalysis, setProcessedAnalysis] = useState<any>(null);
  const [processedMetrics, setProcessedMetrics] = useState<any>(null);

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

  // Función para cargar archivos reales del proyecto
  const loadProjectFiles = async (projectId: number) => {
    if (!token) return;

    try {
      const response = await api.get(`/ai/projects/${projectId}/files`);
      const files = response.data;
      setProjectFiles(files);

      // Extraer nombres de archivos disponibles
      const fileNames = extractFileNames(files);
      setAvailableFiles(fileNames);

      return files;
    } catch (error) {
      console.error("Error loading project files:", error);
    }
  };

  // Función para extraer nombres de archivos de la estructura de archivos
  const extractFileNames = (files: FileNode[]): string[] => {
    const fileNames: string[] = [];

    const traverseFiles = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (node.type === "file") {
          fileNames.push(node.name);
        } else if (node.children) {
          traverseFiles(node.children);
        }
      });
    };

    traverseFiles(files);
    return fileNames;
  };

  // Función para encontrar contenido de archivo por nombre
  const findFileContent = (
    files: FileNode[],
    fileName: string,
  ): string | null => {
    const findFile = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.type === "file" && node.name === fileName) {
          return node;
        } else if (node.children) {
          const found = findFile(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(files);
    return file?.content || null;
  };

  // Función para procesar respuesta de IA
  const processAIResponse = (rawResponse: any) => {
    try {
      console.log("Raw AI Response:", rawResponse);

      // Extraer datos de diferentes formatos posibles
      const output =
        rawResponse?.output || rawResponse?.analysis || rawResponse;

      // Buscar sugerencias en diferentes formatos - extraer solo el texto limpio
      let suggestions: string[] = [];
      if (output?.Sugerencias && Array.isArray(output.Sugerencias)) {
        suggestions = output.Sugerencias.filter(
          (item: any) => typeof item === "string",
        );
      } else if (output?.sugerencias && Array.isArray(output.sugerencias)) {
        suggestions = output.sugerencias.filter(
          (item: any) => typeof item === "string",
        );
      } else if (output?.suggestions && Array.isArray(output.suggestions)) {
        suggestions = output.suggestions.filter(
          (item: any) => typeof item === "string",
        );
      }

      // Buscar advertencias en diferentes formatos - extraer solo el texto limpio
      let warnings: string[] = [];
      if (output?.Advertencias && Array.isArray(output.Advertencias)) {
        warnings = output.Advertencias.filter(
          (item: any) => typeof item === "string",
        );
      } else if (output?.advertencias && Array.isArray(output.advertencias)) {
        warnings = output.advertencias.filter(
          (item: any) => typeof item === "string",
        );
      } else if (output?.warnings && Array.isArray(output.warnings)) {
        warnings = output.warnings.filter(
          (item: any) => typeof item === "string",
        );
      }

      // Si no hay sugerencias/advertencias estructuradas, buscar en la respuesta completa
      if (suggestions.length === 0 && warnings.length === 0) {
        // Buscar en el texto completo de la respuesta
        const fullText = JSON.stringify(rawResponse);
        if (
          fullText.includes("Sugerencias") ||
          fullText.includes("sugerencias")
        ) {
          // Extraer sugerencias del texto
          const sugMatches = fullText.match(/"Sugerencias":\s*\[(.*?)\]/);
          if (sugMatches) {
            suggestions = sugMatches[1]
              .split(",")
              .map((s) => s.replace(/"/g, "").trim())
              .filter((s) => s.length > 0);
          }
        }
        if (
          fullText.includes("Advertencias") ||
          fullText.includes("advertencias")
        ) {
          // Extraer advertencias del texto
          const warnMatches = fullText.match(/"Advertencias":\s*\[(.*?)\]/);
          if (warnMatches) {
            warnings = warnMatches[1]
              .split(",")
              .map((s) => s.replace(/"/g, "").trim())
              .filter((s) => s.length > 0);
          }
        }
      }

      console.log("Final processed suggestions:", suggestions);
      console.log("Final processed warnings:", warnings);
      console.log("Raw response structure:", Object.keys(rawResponse));
      if (rawResponse.output) {
        console.log("Output structure:", Object.keys(rawResponse.output));
      }

      return {
        suggestions,
        warnings,
        language: rawResponse?.language || "javascript",
        fileName: selectedFile,
        rawData: rawResponse,
      };
    } catch (error) {
      console.error("Error processing AI response:", error);
      return {
        suggestions: [],
        warnings: [],
        language: "javascript",
        fileName: selectedFile,
        rawData: rawResponse,
      };
    }
  };

  // Función para procesar métricas
  const processMetricsResponse = (rawResponse: any) => {
    try {
      console.log("Raw Metrics Response:", rawResponse);

      // Extraer datos de diferentes formatos posibles
      const output =
        rawResponse?.output || rawResponse?.analysis || rawResponse;

      // Buscar sugerencias en diferentes formatos - extraer solo el texto limpio
      let suggestions: string[] = [];
      if (output?.Sugerencias && Array.isArray(output.Sugerencias)) {
        suggestions = output.Sugerencias.filter(
          (item: any) => typeof item === "string",
        );
      } else if (output?.sugerencias && Array.isArray(output.sugerencias)) {
        suggestions = output.sugerencias.filter(
          (item: any) => typeof item === "string",
        );
      } else if (output?.suggestions && Array.isArray(output.suggestions)) {
        suggestions = output.suggestions.filter(
          (item: any) => typeof item === "string",
        );
      }

      // Buscar advertencias en diferentes formatos - extraer solo el texto limpio
      let warnings: string[] = [];
      if (output?.Advertencias && Array.isArray(output.Advertencias)) {
        warnings = output.Advertencias.filter(
          (item: any) => typeof item === "string",
        );
      } else if (output?.advertencias && Array.isArray(output.advertencias)) {
        warnings = output.advertencias.filter(
          (item: any) => typeof item === "string",
        );
      } else if (output?.warnings && Array.isArray(output.warnings)) {
        warnings = output.warnings.filter(
          (item: any) => typeof item === "string",
        );
      }

      // Buscar métricas en diferentes formatos - extraer números reales
      let complexity = 0;
      if (output?.Complejidad !== undefined)
        complexity = parseInt(output.Complejidad);
      else if (output?.complejidad !== undefined)
        complexity = parseInt(output.complejidad);
      else if (output?.Complejida !== undefined)
        complexity = parseInt(output.Complejida);
      else if (output?.complexity !== undefined)
        complexity = parseInt(output.complexity);
      else if (output?.Complexity !== undefined)
        complexity = parseInt(output.Complexity);

      let scalability = 0;
      if (output?.Escalabilidad !== undefined)
        scalability = parseInt(output.Escalabilidad);
      else if (output?.escalabilidad !== undefined)
        scalability = parseInt(output.escalabilidad);
      else if (output?.Scalability !== undefined)
        scalability = parseInt(output.Scalability);

      let security = 0;
      if (output?.Seguridad !== undefined)
        security = parseInt(output.Seguridad);
      else if (output?.seguridad !== undefined)
        security = parseInt(output.seguridad);
      else if (output?.Security !== undefined)
        security = parseInt(output.Security);

      let performance = 0;
      if (output?.Rendimiento !== undefined)
        performance = parseInt(output.Rendimiento);
      else if (output?.rendimiento !== undefined)
        performance = parseInt(output.rendimiento);
      else if (output?.Performance !== undefined)
        performance = parseInt(output.Performance);

      // Si no hay métricas estructuradas, buscar en la respuesta completa
      if (
        complexity === 0 &&
        scalability === 0 &&
        security === 0 &&
        performance === 0
      ) {
        const fullText = JSON.stringify(rawResponse);
        console.log("Searching for metrics in full text:", fullText);

        // Buscar métricas en el texto con diferentes patrones
        const complexityMatch =
          fullText.match(/"Complejidad":\s*(\d+)/) ||
          fullText.match(/"complejidad":\s*(\d+)/) ||
          fullText.match(/"Complejida":\s*(\d+)/) ||
          fullText.match(/"complexity":\s*(\d+)/) ||
          fullText.match(/"Complexity":\s*(\d+)/);
        if (complexityMatch) {
          complexity = parseInt(complexityMatch[1]);
          console.log("Found complexity:", complexity);
        }

        const scalabilityMatch =
          fullText.match(/"Escalabilidad":\s*(\d+)/) ||
          fullText.match(/"escalabilidad":\s*(\d+)/) ||
          fullText.match(/"Scalability":\s*(\d+)/);
        if (scalabilityMatch) {
          scalability = parseInt(scalabilityMatch[1]);
          console.log("Found scalability:", scalability);
        }

        const securityMatch =
          fullText.match(/"Seguridad":\s*(\d+)/) ||
          fullText.match(/"seguridad":\s*(\d+)/) ||
          fullText.match(/"Security":\s*(\d+)/);
        if (securityMatch) {
          security = parseInt(securityMatch[1]);
          console.log("Found security:", security);
        }

        const performanceMatch =
          fullText.match(/"Rendimiento":\s*(\d+)/) ||
          fullText.match(/"rendimiento":\s*(\d+)/) ||
          fullText.match(/"Performance":\s*(\d+)/);
        if (performanceMatch) {
          performance = parseInt(performanceMatch[1]);
          console.log("Found performance:", performance);
        }

        // Si aún no encontramos, buscar en el output anidado
        if (
          complexity === 0 &&
          scalability === 0 &&
          security === 0 &&
          performance === 0
        ) {
          const outputMatch = fullText.match(/"output":\s*\{([^}]+)\}/);
          if (outputMatch) {
            const outputText = outputMatch[1];
            console.log("Searching in output:", outputText);

            const complexityInOutput =
              outputText.match(/"Complejidad":\s*(\d+)/) ||
              outputText.match(/"complejidad":\s*(\d+)/) ||
              outputText.match(/"Complejida":\s*(\d+)/) ||
              outputText.match(/"complexity":\s*(\d+)/);
            if (complexityInOutput)
              complexity = parseInt(complexityInOutput[1]);

            const scalabilityInOutput =
              outputText.match(/"Escalabilidad":\s*(\d+)/) ||
              outputText.match(/"escalabilidad":\s*(\d+)/);
            if (scalabilityInOutput)
              scalability = parseInt(scalabilityInOutput[1]);

            const securityInOutput =
              outputText.match(/"Seguridad":\s*(\d+)/) ||
              outputText.match(/"seguridad":\s*(\d+)/);
            if (securityInOutput) security = parseInt(securityInOutput[1]);

            const performanceInOutput =
              outputText.match(/"Rendimiento":\s*(\d+)/) ||
              outputText.match(/"rendimiento":\s*(\d+)/);
            if (performanceInOutput)
              performance = parseInt(performanceInOutput[1]);
          }
        }
      }

      // Si no hay sugerencias/advertencias estructuradas, buscar en la respuesta completa
      if (suggestions.length === 0 && warnings.length === 0) {
        const fullText = JSON.stringify(rawResponse);
        if (
          fullText.includes("Sugerencias") ||
          fullText.includes("sugerencias")
        ) {
          const sugMatches = fullText.match(/"Sugerencias":\s*\[(.*?)\]/);
          if (sugMatches) {
            suggestions = sugMatches[1]
              .split(",")
              .map((s) => s.replace(/"/g, "").trim())
              .filter((s) => s.length > 0);
          }
        }
        if (
          fullText.includes("Advertencias") ||
          fullText.includes("advertencias")
        ) {
          const warnMatches = fullText.match(/"Advertencias":\s*\[(.*?)\]/);
          if (warnMatches) {
            warnings = warnMatches[1]
              .split(",")
              .map((s) => s.replace(/"/g, "").trim())
              .filter((s) => s.length > 0);
          }
        }
      }

      const metrics = {
        complexity: complexity || 0,
        scalability: scalability || 0,
        security: security || 0,
        performance: performance || 0,
      };

      console.log("Final processed metrics:", metrics);
      console.log("Final processed suggestions:", suggestions);
      console.log("Final processed warnings:", warnings);
      console.log("Raw response structure:", Object.keys(rawResponse));
      if (rawResponse.output) {
        console.log("Output structure:", Object.keys(rawResponse.output));
      }

      return {
        suggestions,
        warnings,
        metrics,
        language: rawResponse?.language || "javascript",
        fileName: selectedFile,
        rawData: rawResponse,
      };
    } catch (error) {
      console.error("Error processing metrics response:", error);
      return {
        suggestions: [],
        warnings: [],
        metrics: {
          complexity: 0,
          scalability: 0,
          security: 0,
          performance: 0,
        },
        language: "javascript",
        fileName: selectedFile,
        rawData: rawResponse,
      };
    }
  };

  // Función para analizar código con n8n
  const analyzeWithN8n = async () => {
    if (!selectedProject || !selectedFile || !codeContent || !token) return;

    try {
      setAnalyzingWithN8n(true);
      setShowAnalysisModal(true);
      setAnalysisType("ai");

      const response = await api.post("/ai/analyze-with-n8n", {
        projectId: selectedProject.id,
        fileName: selectedFile,
        code: codeContent,
      });

      setN8nAnalysis(response.data);
      const processed = processAIResponse(response.data);
      setProcessedAnalysis(processed);
      console.log("Análisis de n8n:", response.data);
    } catch (error) {
      console.error("Error analyzing with n8n:", error);
      // Aquí podrías mostrar una notificación de error
    } finally {
      setAnalyzingWithN8n(false);
      setShowAnalysisModal(false);
      setAnalysisType(null);
    }
  };

  // Función para analizar métricas con n8n_v2
  const analyzeMetricsWithN8n = async () => {
    if (!selectedProject || !selectedFile || !codeContent || !token) return;

    try {
      setAnalyzingMetrics(true);
      setShowAnalysisModal(true);
      setAnalysisType("metrics");

      const response = await api.post("/ai/analyze-metrics-with-n8n", {
        projectId: selectedProject.id,
        fileName: selectedFile,
        code: codeContent,
      });

      setMetricsAnalysis(response.data);
      const processed = processMetricsResponse(response.data);
      setProcessedMetrics(processed);
      console.log("Análisis de métricas de n8n:", response.data);
    } catch (error) {
      console.error("Error analyzing metrics with n8n:", error);
      // Aquí podrías mostrar una notificación de error
    } finally {
      setAnalyzingMetrics(false);
      setShowAnalysisModal(false);
      setAnalysisType(null);
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
          const firstProject = projects[0];
          setSelectedProject(firstProject);

          // Cargar archivos reales del proyecto
          await loadProjectFiles(firstProject.id);

          // Establecer el primer archivo disponible o un archivo por defecto
          const files = await loadProjectFiles(firstProject.id);
          if (files && files.length > 0) {
            const firstFile = extractFileNames(files)[0];
            setSelectedFile(firstFile || "main.js");
          } else {
            setSelectedFile("main.js");
          }
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };

    fetchProjects();
  }, [token]);

  // Actualizar código cuando cambie el archivo seleccionado o los archivos del proyecto
  useEffect(() => {
    if (selectedProject && selectedFile && projectFiles.length > 0) {
      // Buscar contenido real del archivo en los archivos del proyecto
      const realFileContent = findFileContent(projectFiles, selectedFile);

      if (realFileContent) {
        // Usar contenido real del archivo
        setCodeContent(realFileContent);
      } else {
        // Fallback: generar código nuevo si no se encuentra el archivo real
        setCodeContent(generateProjectCode(selectedProject, selectedFile));
      }
    }
  }, [selectedProject, selectedFile, projectFiles]);

  // Cargar archivos cuando cambie el proyecto seleccionado
  useEffect(() => {
    if (selectedProject) {
      loadProjectFiles(selectedProject.id);
    }
  }, [selectedProject]);

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
      // Usar el nuevo endpoint de chat con n8n
      const response = await api.post("/ai/chat-with-n8n", {
        projectId: selectedProject.id,
        fileName: selectedFile,
        code: codeContent,
        query: currentQuery,
      });

      if (response.data && response.data.response) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: response.data.response,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      } else {
        // Fallback a respuesta local si n8n falla
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
          {/* Modal de Loader de Análisis - Flotante sobre la sección */}
          {showAnalysisModal && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
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
                    {analysisType === "ai"
                      ? "Analizando código con IA"
                      : "Analizando métricas"}
                  </h3>

                  {/* Mensaje específico */}
                  <p className="text-gray-600 font-medium mb-4">
                    {analysisType === "ai"
                      ? `Analizando archivo: ${selectedFile}`
                      : `Calculando métricas de: ${selectedFile}`}
                  </p>

                  {/* Descripción del proceso */}
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {analysisType === "ai"
                      ? "La IA está revisando tu código para detectar oportunidades de mejora, optimizaciones y mejores prácticas. Esto puede tomar unos segundos..."
                      : "Calculando métricas de complejidad, escalabilidad, seguridad y rendimiento de tu código. Esto puede tomar unos segundos..."}
                  </p>
                </div>
              </div>
            </div>
          )}
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
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                >
                  <option value="">Selecciona un archivo</option>
                  {availableFiles.map((fileName) => (
                    <option key={fileName} value={fileName}>
                      {fileName}
                    </option>
                  ))}
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
            {(processedAnalysis || processedMetrics) && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Análisis de IA */}
                {processedAnalysis && (
                  <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center">
                      <MagnifyingGlassIcon className="w-5 h-5 text-blue-500 mr-2" />
                      Análisis de IA
                    </h3>
                    {processedAnalysis.suggestions.length === 0 &&
                    processedAnalysis.warnings.length === 0 ? (
                      <div className="text-gray-500 text-sm py-4 text-center">
                        No se encontraron sugerencias ni advertencias para este
                        archivo.
                      </div>
                    ) : (
                      <>
                        {processedAnalysis.suggestions.length > 0 && (
                          <div className="mb-4">
                            <div className="font-semibold text-blue-700 mb-2 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                              </svg>
                              Sugerencias
                            </div>
                            <ul className="space-y-2">
                              {processedAnalysis.suggestions.map(
                                (s: string, i: number) => (
                                  <li
                                    key={i}
                                    className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-900 flex items-start"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-2 flex-shrink-0"></span>
                                    <span>{s}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                        {processedAnalysis.warnings.length > 0 && (
                          <div>
                            <div className="font-semibold text-red-700 mb-2 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                              </svg>
                              Advertencias
                            </div>
                            <ul className="space-y-2">
                              {processedAnalysis.warnings.map(
                                (w: string, i: number) => (
                                  <li
                                    key={i}
                                    className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-900 flex items-start"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-red-400 mt-2 mr-2 flex-shrink-0"></span>
                                    <span>{w}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {/* Métricas */}
                {processedMetrics && (
                  <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center">
                      <LightBulbIcon className="w-5 h-5 text-purple-500 mr-2" />
                      Análisis de Métricas
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-800">
                          Complejidad
                        </span>
                        <span className="text-sm font-bold text-purple-900">
                          {processedMetrics.metrics.complexity}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${processedMetrics.metrics.complexity}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-800">
                          Escalabilidad
                        </span>
                        <span className="text-sm font-bold text-purple-900">
                          {processedMetrics.metrics.scalability}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${processedMetrics.metrics.scalability}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-800">
                          Seguridad
                        </span>
                        <span className="text-sm font-bold text-purple-900">
                          {processedMetrics.metrics.security}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${processedMetrics.metrics.security}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-800">
                          Rendimiento
                        </span>
                        <span className="text-sm font-bold text-purple-900">
                          {processedMetrics.metrics.performance}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${processedMetrics.metrics.performance}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    {(processedMetrics.suggestions.length > 0 ||
                      processedMetrics.warnings.length > 0) && (
                      <div className="mt-6">
                        {processedMetrics.suggestions.length > 0 && (
                          <div className="mb-4">
                            <div className="font-semibold text-blue-700 mb-2 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                              </svg>
                              Sugerencias
                            </div>
                            <ul className="space-y-2">
                              {processedMetrics.suggestions.map(
                                (s: string, i: number) => (
                                  <li
                                    key={i}
                                    className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-900 flex items-start"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-2 flex-shrink-0"></span>
                                    <span>{s}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                        {processedMetrics.warnings.length > 0 && (
                          <div>
                            <div className="font-semibold text-red-700 mb-2 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                              </svg>
                              Advertencias
                            </div>
                            <ul className="space-y-2">
                              {processedMetrics.warnings.map(
                                (w: string, i: number) => (
                                  <li
                                    key={i}
                                    className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-900 flex items-start"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-red-400 mt-2 mr-2 flex-shrink-0"></span>
                                    <span>{w}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
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
