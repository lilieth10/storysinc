/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  CodeBracketIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  DocumentIcon,
  FolderIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Importar Monaco Editor dinámicamente para evitar errores de SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface AIAnalysis {
  id: number;
  projectId: number;
  code: string;
  language: string;
  suggestions: Array<{
    type: "optimization" | "security" | "best-practice" | "performance";
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
    line?: number;
    code?: string;
  }>;
  metrics: {
    complexity: number;
    maintainability: number;
    security: number;
    performance: number;
  };
  createdAt: string;
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [codeContent, setCodeContent] = useState("");

  // Cargar proyectos disponibles
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching projects from /api/ai/projects...");
        const token = localStorage.getItem("token");
        console.log("Token:", token ? "Present" : "Missing");

        // Usar directamente el endpoint que funciona
        const response = await fetch("http://localhost:3001/projects-test", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Projects loaded:", data);
          setProjects(data);
          if (data.length > 0) {
            setSelectedProject(data[0]);
            // Cargar código específico del proyecto
            setCodeContent(generateProjectCode(data[0]));
            setSelectedFile("main.js");
          } else {
            console.log("No projects found");
          }
        } else {
          console.error("Error response:", response.status);
          const errorText = await response.text();
          console.error("Error details:", errorText);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  // Generar código específico según el proyecto
  const generateProjectCode = (project: Project) => {
    switch (project.pattern) {
      case "BFF":
        return `// Backend for Frontend (BFF) - ${project.name}
const express = require('express');
const app = express();

// Rate limiting para BFF
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests
});
app.use('/api/', limiter);

// Endpoint principal del BFF
app.get('/api/user-data', async (req, res) => {
  try {
    // Agregar validación de inputs
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Simular llamada a microservicios
    const userData = await fetchUserData(userId);
    const userPreferences = await fetchUserPreferences(userId);
    
    // Combinar datos para el frontend
    const response = {
      user: userData,
      preferences: userPreferences,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function fetchUserData(userId) {
  // Simular llamada a microservicio de usuarios
  return { id: userId, name: 'Usuario Ejemplo', email: 'user@example.com' };
}

async function fetchUserPreferences(userId) {
  // Simular llamada a microservicio de preferencias
  return { theme: 'dark', language: 'es', notifications: true };
}

app.listen(3000, () => {
  console.log('BFF corriendo en puerto 3000');
});`;

      case "Sidecar":
        return `// Sidecar Pattern - ${project.name}
const express = require('express');
const app = express();

// Health check para el sidecar
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    service: 'sidecar'
  };
  res.status(200).json(health);
});

// Logging sidecar
app.post('/logs', (req, res) => {
  const { level, message, metadata } = req.body;
  
  // Validar inputs
  if (!level || !message) {
    return res.status(400).json({ 
      error: 'level y message son requeridos' 
    });
  }

  // Sanitizar datos antes de loggear
  const sanitizedMessage = message.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '');
  
  console.log(\`[\${level.toUpperCase()}] \${sanitizedMessage}\`, metadata);
  
  res.json({ 
    success: true, 
    logged: true,
    timestamp: new Date().toISOString()
  });
});

// Métricas sidecar
app.get('/metrics', (req, res) => {
  const metrics = {
    requests: Math.floor(Math.random() * 1000),
    errors: Math.floor(Math.random() * 10),
    responseTime: Math.random() * 100,
    timestamp: new Date().toISOString()
  };
  
  res.json(metrics);
});

app.listen(3001, () => {
  console.log('Sidecar corriendo en puerto 3001');
});`;

      case "Standard":
        return `// Monolito Standard - ${project.name}
const express = require('express');
const app = express();

// Middleware de seguridad
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Validación de inputs
const { body, validationResult } = require('express-validator');

// Endpoint de usuarios
app.post('/api/users', [
  body('email').isEmail().normalizeEmail(),
  body('name').isLength({ min: 2, max: 50 }),
  body('age').isInt({ min: 0, max: 120 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Lógica de negocio
  const { email, name, age } = req.body;
  
  // Simular base de datos
  const user = {
    id: Date.now(),
    email,
    name,
    age,
    createdAt: new Date().toISOString()
  };

  res.status(201).json(user);
});

// Endpoint de productos
app.get('/api/products', async (req, res) => {
  try {
    // Simular caché
    const cached = await getCachedData('products');
    if (cached) {
      return res.json(cached);
    }

    // Simular consulta a base de datos
    const products = [
      { id: 1, name: 'Producto 1', price: 100 },
      { id: 2, name: 'Producto 2', price: 200 }
    ];

    // Guardar en caché
    await setCachedData('products', products, 3600);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function getCachedData(key) {
  // Simular Redis
  return null;
}

async function setCachedData(key, data, ttl) {
  // Simular Redis
  console.log('Guardando en caché:', key);
}

app.listen(3000, () => {
  console.log('Monolito corriendo en puerto 3000');
});`;

      default:
        return `// Código base - ${project.name}
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint básico
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: 'Hola desde el servidor',
    timestamp: new Date().toISOString()
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});`;
    }
  };

  // Actualizar código cuando cambie el proyecto
  useEffect(() => {
    if (selectedProject) {
      setCodeContent(generateProjectCode(selectedProject));
      setSelectedFile("main.js");
    }
  }, [selectedProject]);

  // Analizar código con IA
  const analyzeCode = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      // Simular análisis real basado en el proyecto
      const analysisData: AIAnalysis = {
        id: Date.now(),
        projectId: selectedProject.id,
        language: selectedProject.language || "javascript",
        code: codeContent,
        suggestions: generateSuggestions(selectedProject),
        metrics: generateMetrics(selectedProject),
        createdAt: new Date().toISOString(),
      };

      // Simular delay para que se vea el loader
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setAnalysis(analysisData);
    } catch (error) {
      console.error("Error analyzing code:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = (project: Project) => {
    const suggestions: Array<{
      type: "optimization" | "best-practice" | "performance" | "security";
      title: string;
      description: string;
      severity: "low" | "medium" | "high";
      line?: number;
      code?: string;
    }> = [];

    if (project.pattern === "Standard") {
      suggestions.push({
        type: "optimization",
        title: "Refactorización a Microservicios",
        description:
          "Este monolito tiene alta complejidad. Considera dividirlo en microservicios para mejorar escalabilidad y mantenimiento",
        severity: "medium",
        line: 1,
        code: `// Antes: Monolito
class MonolithicApp {
  handleUserRequest() { /* lógica compleja */ }
  handlePayment() { /* lógica compleja */ }
  handleInventory() { /* lógica compleja */ }
}

// Después: Microservicios
class UserService { handleUserRequest() { /* lógica específica */ } }
class PaymentService { handlePayment() { /* lógica específica */ } }
class InventoryService { handleInventory() { /* lógica específica */ } }`,
      });
    }

    if (project.pattern === "BFF") {
      suggestions.push({
        type: "performance",
        title: "Optimización de BFF",
        description:
          "Implementa rate limiting y caché para mejorar el rendimiento del BFF",
        severity: "medium",
        line: 15,
        code: `// Agregar rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
});
app.use('/api/', limiter);`,
      });

      suggestions.push({
        type: "security",
        title: "Validación de Inputs en BFF",
        description:
          "Agrega validación robusta de inputs para prevenir ataques",
        severity: "high",
        line: 8,
        code: `// Validación de inputs
const { body, validationResult } = require('express-validator');
app.post('/api/data', [
  body('email').isEmail(),
  body('age').isInt({ min: 0, max: 120 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
});`,
      });
    }

    if (project.pattern === "Sidecar") {
      suggestions.push({
        type: "best-practice",
        title: "Health Checks para Sidecar",
        description:
          "Implementa health checks para monitorear el estado del sidecar",
        severity: "medium",
        code: `// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  res.status(200).json(health);
});`,
      });
    }

    // Sugerencias de seguridad universales
    suggestions.push({
      type: "security",
      title: "Sanitización de Datos",
      description:
        "Implementa sanitización de datos para prevenir XSS y inyecciones",
      severity: "high",
      line: 8,
      code: `// Sanitización de inputs
const DOMPurify = require('dompurify');
const userInput = req.body.content;
const sanitizedInput = DOMPurify.sanitize(userInput);`,
    });

    // Sugerencias de rendimiento
    suggestions.push({
      type: "performance",
      title: "Implementar Caché",
      description:
        "Agrega caché para consultas frecuentes y mejorar el rendimiento",
      severity: "medium",
      code: `// Implementar Redis cache
const redis = require('redis');
const client = redis.createClient();

async function getCachedData(key) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFromDatabase();
  await client.setex(key, 3600, JSON.stringify(data));
  return data;
}`,
    });

    return suggestions;
  };

  const generateMetrics = (project: Project) => {
    const baseComplexity = project.pattern === "Standard" ? 75 : 45;
    const baseMaintainability = project.pattern === "microservices" ? 85 : 60;
    const baseSecurity = 70;
    const basePerformance = 65;

    return {
      complexity: Math.min(
        100,
        baseComplexity + Math.floor(Math.random() * 20),
      ),
      maintainability: Math.min(
        100,
        baseMaintainability + Math.floor(Math.random() * 15),
      ),
      security: Math.min(100, baseSecurity + Math.floor(Math.random() * 25)),
      performance: Math.min(
        100,
        basePerformance + Math.floor(Math.random() * 20),
      ),
    };
  };

  // Enviar consulta a IA
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
4. Crear interfaces claras entre módulos`;
    }

    if (lowerQuery.includes("test") || lowerQuery.includes("testing")) {
      return `Estrategia de testing para "${project.name}":
1. Implementar tests unitarios con Jest
2. Crear tests de integración
3. Usar tests end-to-end con Cypress
4. Implementar coverage mínimo del 80%`;
    }

    // Respuesta por defecto
    return `Para "${project.name}", basándome en tu consulta, te recomiendo revisar la documentación del proyecto y considerar las mejores prácticas del lenguaje que estás usando. ¿Hay algo específico que te gustaría optimizar?`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 border-red-200 text-red-800";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "low":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case "medium":
        return <LightBulbIcon className="w-5 h-5 text-yellow-600" />;
      case "low":
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <CodeBracketIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Cargar historial de chat cuando se selecciona un proyecto
  useEffect(() => {
    if (selectedProject) {
      loadChatHistory();
    }
  }, [selectedProject]);

  const loadChatHistory = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/ai/chat/${selectedProject.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const history = await response.json();
        const formattedHistory: ChatMessage[] = history.map(
          (msg: {
            id: number;
            isAI: boolean;
            message: string;
            timestamp: string;
          }) => ({
            id: msg.id.toString(),
            type: msg.isAI ? "ai" : "user",
            content: msg.message,
            timestamp: new Date(msg.timestamp),
          }),
        );
        setChatHistory(formattedHistory);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
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
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Selecciona un archivo</option>
                  <option value="Archivo.js">Archivo.js</option>
                  <option value="Componente.tsx">Componente.tsx</option>
                  <option value="Servicio.ts">Servicio.ts</option>
                </select>
              </div>
            </div>

            {selectedProject && selectedFile && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor de código */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <DocumentIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {selectedFile}
                      </span>
                    </div>
                    <Button
                      onClick={analyzeCode}
                      disabled={loading}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Analizando...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CodeBracketIcon className="w-4 h-4 mr-2" />
                          Analizar
                        </div>
                      )}
                    </Button>
                  </div>
                  <div className="h-96">
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

                {/* Panel de chat con IA */}
                <div className="bg-white border border-gray-200 rounded-lg flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Consulta a IA
                    </h3>
                    <p className="text-sm text-gray-600">
                      Escribe tus preguntas basándote en el código
                    </p>
                  </div>

                  {/* Historial de chat */}
                  <div className="flex-1 p-4 overflow-y-auto max-h-64">
                    {chatHistory.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <LightBulbIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Inicia una conversación con la IA</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
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
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input para consulta */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={userQuery}
                          onChange={(e) => setUserQuery(e.target.value)}
                          placeholder="Escribe tus preguntas basándote en el código..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              sendQuery();
                            }
                          }}
                        />
                      </div>
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

            {/* Resultados del análisis */}
            {analysis && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sugerencias de IA */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sugerencias de IA
                  </h3>
                  <div className="space-y-4">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getSeverityColor(suggestion.severity)}`}
                      >
                        <div className="flex items-start">
                          {getSeverityIcon(suggestion.severity)}
                          <div className="ml-3 flex-1">
                            <h4 className="font-medium">{suggestion.title}</h4>
                            <p className="text-sm mt-1">
                              {suggestion.description}
                            </p>
                            {suggestion.line && (
                              <p className="text-xs mt-2 opacity-75">
                                Línea {suggestion.line}
                              </p>
                            )}
                            {suggestion.code && (
                              <div className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs font-mono">
                                <pre>{suggestion.code}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Métricas de calidad */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Métricas de Calidad
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Complejidad</span>
                        <span>{analysis.metrics.complexity}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${analysis.metrics.complexity}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mantenibilidad</span>
                        <span>{analysis.metrics.maintainability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${analysis.metrics.maintainability}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Seguridad</span>
                        <span>{analysis.metrics.security}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${analysis.metrics.security}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Rendimiento</span>
                        <span>{analysis.metrics.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${analysis.metrics.performance}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
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
