 
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
        // Simular carga de proyectos
        const mockProjects: Project[] = [
          {
            id: 1,
            name: "E-commerce React",
            language: "typescript",
            pattern: "BFF",
            files: ["App.tsx", "components/", "hooks/", "api/"]
          },
          {
            id: 2,
            name: "API REST Node.js",
            language: "javascript",
            pattern: "Standard",
            files: ["server.js", "routes/", "middleware/", "models/"]
          },
          {
            id: 3,
            name: "Dashboard Admin",
            language: "typescript",
            pattern: "Sidecar",
            files: ["Dashboard.tsx", "components/", "services/", "utils/"]
          }
        ];

        setProjects(mockProjects);
        if (mockProjects.length > 0) {
          setSelectedProject(mockProjects[0]);
          setCodeContent(generateProjectCode(mockProjects[0]));
          setSelectedFile("main.js");
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };

    fetchProjects();
  }, []);

  const generateProjectCode = (project: Project) => {
    if (project.name.includes("API REST")) {
      return `const express = require('express');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validación de entrada
const validateUser = [
  body('name').isLength({ min: 2 }).withMessage('Nombre debe tener al menos 2 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('age').isInt({ min: 18 }).withMessage('Edad debe ser mayor a 18')
];

// Rutas
app.get('/api/users', (req, res) => {
  res.json({ message: 'Lista de usuarios' });
});

app.post('/api/users', validateUser, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  res.status(201).json({ message: 'Usuario creado' });
});

app.listen(PORT, () => {
  console.log(\`Servidor corriendo en puerto \${PORT}\`);
});`;
    } else if (project.name.includes("E-commerce")) {
      return `import React, { useState, useEffect } from 'react';
import { useCart } from './hooks/useCart';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id} className="border rounded p-4">
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <p>\${product.price}</p>
          <button onClick={() => addToCart(product)}>
            Agregar al carrito
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProductList;`;
    } else {
      return `// Código de ejemplo para ${project.name}
console.log('Hola desde ${project.name}');

function saludar(nombre) {
  return \`¡Hola \${nombre}!\`;
}

const resultado = saludar('Usuario');
console.log(resultado);`;
    }
  };

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
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setAnalysis(analysisData);
      
      // Agregar mensaje de chat automático
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: `✅ Análisis completado para ${selectedProject.name}. Encontré ${analysisData.suggestions.length} sugerencias de mejora.`,
        timestamp: new Date(),
        code: codeContent
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error analyzing code:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = (project: Project) => {
    const suggestions = [];

    if (project.name.includes("API REST")) {
      suggestions.push(
        {
          type: "security" as const,
          title: "Implementar rate limiting",
          description: "Agregar rate limiting para prevenir ataques de fuerza bruta",
          severity: "high" as const,
          line: 15,
          code: "const rateLimit = require('express-rate-limit');"
        },
        {
          type: "optimization" as const,
          title: "Usar async/await",
          description: "Convertir callbacks a async/await para mejor legibilidad",
          severity: "medium" as const,
          line: 20
        },
        {
          type: "best-practice" as const,
          title: "Agregar logging",
          description: "Implementar sistema de logging para debugging",
          severity: "low" as const,
          line: 5
        }
      );
    } else if (project.name.includes("E-commerce")) {
      suggestions.push(
        {
          type: "performance" as const,
          title: "Implementar React.memo",
          description: "Usar React.memo para evitar re-renders innecesarios",
          severity: "medium" as const,
          line: 8
        },
        {
          type: "optimization" as const,
          title: "Agregar error handling",
          description: "Mejorar el manejo de errores en fetchProducts",
          severity: "high" as const,
          line: 25
        }
      );
    }

    return suggestions;
  };

  const generateMetrics = (project: Project) => {
    const baseComplexity = 60;
    const baseMaintainability = 75;
    const baseSecurity = 70;
    const basePerformance = 80;

    return {
      complexity: Math.min(
        100,
        baseComplexity + Math.floor(Math.random() * 20),
      ),
      maintainability: Math.min(
        100,
        baseMaintainability + Math.floor(Math.random() * 15),
      ),
      security: Math.min(
        100,
        baseSecurity + Math.floor(Math.random() * 25),
      ),
      performance: Math.min(
        100,
        basePerformance + Math.floor(Math.random() * 20),
      ),
    };
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case "medium":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case "low":
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <MagnifyingGlassIcon className="w-4 h-4" />;
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
                    if (project) {
                      setCodeContent(generateProjectCode(project));
                      setSelectedFile("main.js");
                    }
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
                  <option value="main.js">main.js</option>
                  <option value="App.tsx">App.tsx</option>
                  <option value="server.js">server.js</option>
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

                {/* Panel de chat */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chat con IA
                    </h3>
                    <p className="text-sm text-gray-600">
                      Haz preguntas sobre tu código y obtén respuestas inteligentes
                    </p>
                  </div>
                  
                  {/* Historial de chat */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
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
                            message.type === "user" ? "justify-end" : "justify-start"
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
                  <div className="p-4 border-t border-gray-200">
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

            {/* Resultados del análisis */}
            {analysis && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sugerencias */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sugerencias de Mejora
                  </h3>
                  <div className="space-y-4">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          suggestion.severity === "high"
                            ? "border-red-500 bg-red-50"
                            : suggestion.severity === "medium"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-green-500 bg-green-50"
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`p-2 rounded-full ${getSeverityColor(suggestion.severity)}`}>
                            {getSeverityIcon(suggestion.severity)}
                          </div>
                          <div className="ml-3 flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {suggestion.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
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
