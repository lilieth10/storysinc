"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/landing/Footer";
import { AILoader } from "@/components/ui/ai-loader";
import { useAuth } from "@/store/auth";
import toast from "react-hot-toast";
import {
  ClockIcon,
  UserIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface Version {
  id: string;
  hash: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
  branch: string;
  status: "deployed" | "testing" | "conflict" | "failed";
  filesChanged: string[];
  projectId: number;
  projectName: string;
  stats: {
    additions: number;
    deletions: number;
    files: number;
  };
  ciStatus: "success" | "failed" | "pending";
  diff?: {
    file: string;
    additions: string[];
    deletions: string[];
  }[];
}

interface VersionFilters {
  author: string;
  dateRange: {
    start: string;
    end: string;
  };
  branch: string;
  searchTerm: string;
  status: string;
}

export default function VersionHistoryPage() {
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [analyzingWithAI, setAnalyzingWithAI] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [showAnalysisLoader, setShowAnalysisLoader] = useState<boolean>(false);
  const [filters, setFilters] = useState<VersionFilters>({
    author: "",
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
    branch: "",
    searchTerm: "",
    status: "",
  });

  // Datos simulados realistas
  const mockVersions: Version[] = [
    {
      id: "1",
      hash: "a1b2c3d4",
      message: "feat: implement user authentication system",
      author: "María López",
      authorAvatar: "ML",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      branch: "main",
      status: "deployed",
      projectId: 1,
      projectName: "E-commerce React",
      filesChanged: [
        "src/auth/AuthProvider.tsx",
        "src/components/Login.tsx",
        "src/api/auth.ts",
      ],
      stats: { additions: 145, deletions: 23, files: 3 },
      ciStatus: "success",
      diff: [
        {
          file: "src/auth/AuthProvider.tsx",
          additions: [
            "+ import { createContext, useContext, useState } from 'react';",
            "+ export const AuthContext = createContext();",
            "+ export const useAuth = () => useContext(AuthContext);",
          ],
          deletions: ["- const auth = { user: null };"],
        },
      ],
    },
    {
      id: "2",
      hash: "e5f6g7h8",
      message: "fix: resolve image loading performance issue",
      author: "Carlos Rodríguez",
      authorAvatar: "CR",
      date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      branch: "feature/performance",
      status: "testing",
      projectId: 1,
      projectName: "E-commerce React",
      filesChanged: [
        "src/components/ImageLoader.tsx",
        "src/utils/imageOptimization.ts",
      ],
      stats: { additions: 67, deletions: 12, files: 2 },
      ciStatus: "success",
      diff: [
        {
          file: "src/components/ImageLoader.tsx",
          additions: [
            "+ const [isLoading, setIsLoading] = useState(true);",
            "+ const handleLoad = () => setIsLoading(false);",
          ],
          deletions: ["- const image = new Image();"],
        },
      ],
    },
    {
      id: "3",
      hash: "i9j0k1l2",
      message: "refactor: optimize database queries",
      author: "Ana Martínez",
      authorAvatar: "AM",
      date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      branch: "main",
      status: "deployed",
      projectId: 2,
      projectName: "API REST Node.js",
      filesChanged: [
        "src/models/User.js",
        "src/controllers/userController.js",
        "src/database/queries.js",
      ],
      stats: { additions: 89, deletions: 45, files: 3 },
      ciStatus: "success",
      diff: [
        {
          file: "src/models/User.js",
          additions: [
            "+ const userSchema = new Schema({",
            "+   email: { type: String, required: true, unique: true },",
            "+   name: { type: String, required: true }",
          ],
          deletions: ["- const user = { email: '', name: '' };"],
        },
      ],
    },
    {
      id: "4",
      hash: "m3n4o5p6",
      message: "feat: add dark mode support",
      author: "Luis García",
      authorAvatar: "LG",
      date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      branch: "feature/dark-mode",
      status: "conflict",
      projectId: 1,
      projectName: "E-commerce React",
      filesChanged: [
        "src/components/ThemeProvider.tsx",
        "src/styles/theme.css",
        "src/hooks/useTheme.ts",
      ],
      stats: { additions: 234, deletions: 67, files: 3 },
      ciStatus: "failed",
      diff: [
        {
          file: "src/components/ThemeProvider.tsx",
          additions: [
            "+ const ThemeContext = createContext();",
            "+ export const ThemeProvider = ({ children }) => {",
            "+   const [theme, setTheme] = useState('light');",
          ],
          deletions: ["- const theme = 'light';"],
        },
      ],
    },
    {
      id: "5",
      hash: "q7r8s9t0",
      message: "fix: security vulnerability in authentication",
      author: "María López",
      authorAvatar: "ML",
      date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      branch: "hotfix/security",
      status: "deployed",
      projectId: 2,
      projectName: "API REST Node.js",
      filesChanged: ["src/middleware/auth.js", "src/utils/encryption.js"],
      stats: { additions: 23, deletions: 8, files: 2 },
      ciStatus: "success",
      diff: [
        {
          file: "src/middleware/auth.js",
          additions: [
            "+ const jwt = require('jsonwebtoken');",
            "+ const validateToken = (token) => {",
            "+   try { return jwt.verify(token, process.env.JWT_SECRET); }",
            "+   catch (error) { return null; }",
          ],
          deletions: ["- const token = req.headers.authorization;"],
        },
      ],
    },
  ];

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Usar datos simulados por ahora
      setVersions(mockVersions);
    } catch {
      console.error("Error fetching versions");
      toast.error("Error al cargar el historial de versiones");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return "✅";
      case "testing":
        return "⚠️";
      case "conflict":
        return "🔄";
      case "failed":
        return "❌";
      default:
        return "❓";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "deployed":
        return "Desplegado en producción";
      case "testing":
        return "En pruebas";
      case "conflict":
        return "En conflicto";
      case "failed":
        return "Falló el despliegue";
      default:
        return "Desconocido";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "text-green-600 bg-green-100";
      case "testing":
        return "text-yellow-600 bg-yellow-100";
      case "conflict":
        return "text-red-600 bg-red-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-black bg-gray-100";
    }
  };

  const getCIStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✅";
      case "failed":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "❓";
    }
  };

  const getCIStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-black bg-gray-100";
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const commitDate = new Date(date);
    const diffInHours = Math.floor(
      (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Hace menos de 1 hora";
    if (diffInHours === 1) return "Hace 1 hora";
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hace 1 día";
    return `Hace ${diffInDays} días`;
  };

  const handleAnalyzeWithAI = async (version: Version) => {
    setAnalyzingWithAI(version.id);
    setAiAnalysis("");
    setAnalysisProgress(0);
    setShowAnalysisLoader(true);

    try {
      // Simular progreso real de análisis de IA
      const steps = [
        { progress: 20, message: "Analizando código..." },
        { progress: 40, message: "Detectando patrones..." },
        { progress: 60, message: "Evaluando seguridad..." },
        { progress: 80, message: "Generando recomendaciones..." },
        { progress: 100, message: "Completando análisis..." },
      ];

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setAnalysisProgress(step.progress);
      }

      // Análisis único y personalizado basado en el contenido específico del commit
      const analysis = generateUniqueAnalysis(version);

      setAiAnalysis(analysis);
      toast.success(`✅ Análisis de ${version.hash} completado`);
    } catch {
      console.error("Error analyzing version");
      toast.error("❌ Error en el análisis de IA");
    } finally {
      setAnalyzingWithAI(null);
      setAnalysisProgress(0);
      setShowAnalysisLoader(false);
    }
  };

  const generateUniqueAnalysis = (version: Version) => {
    // Análisis específico basado en el contenido real del commit
    const message = version.message.toLowerCase();
    const files = version.filesChanged;
    const stats = version.stats;

    // Detectar patrones específicos en el mensaje
    const isSecurity =
      /security|auth|jwt|token|password|encrypt|vulnerability/i.test(message);
    const isPerformance =
      /performance|optimize|speed|fast|cache|lazy|loading/i.test(message);
    const isBugFix = /fix|bug|error|issue|problem|resolve/i.test(message);
    const isFeature = /feat|feature|add|new|implement|support/i.test(message);
    const isDarkMode = /dark|theme|mode|color/i.test(message);
    const isImageRelated = /image|img|photo|picture|media/i.test(message);
    const isAuthRelated = /auth|login|register|user|session/i.test(message);

    // Análisis específico por tipo de archivo
    const hasReactFiles = files.some(
      (f) => f.includes(".tsx") || f.includes(".jsx"),
    );
    const hasStyleFiles = files.some(
      (f) => f.includes(".css") || f.includes(".scss"),
    );
    const hasUtilFiles = files.some(
      (f) => f.includes("utils") || f.includes("helpers"),
    );
    const hasComponentFiles = files.some((f) => f.includes("components"));
    const hasHookFiles = files.some((f) => f.includes("hooks"));

    // Generar análisis único
    let analysisType = "📊 Análisis General";
    let score = Math.floor(Math.random() * 20) + 75;
    const specificInsights = [];
    const recommendations = [];
    const warnings = [];
    const strengths = [];

    // Análisis específico por tipo de cambio
    if (isSecurity) {
      analysisType = "🔒 Análisis de Seguridad";
      score = 85 + Math.floor(Math.random() * 10);
      specificInsights.push("• Implementación de JWT tokens detectada");
      specificInsights.push("• Validación de inputs robusta");
      recommendations.push("• Agregar rate limiting (máx 100 req/min)");
      recommendations.push("• Implementar 2FA para usuarios admin");
      recommendations.push("• Revisar políticas de contraseñas");
      strengths.push("• Autenticación segura implementada");
    }

    if (isPerformance && isImageRelated) {
      analysisType = "⚡ Análisis de Rendimiento - Imágenes";
      score = 88 + Math.floor(Math.random() * 8);
      specificInsights.push("• Optimización de carga de imágenes detectada");
      specificInsights.push("• Lazy loading implementado");
      specificInsights.push("• Compresión de imágenes activa");
      recommendations.push("• Implementar WebP format para mejor compresión");
      recommendations.push("• Agregar placeholder blur mientras cargan");
      recommendations.push("• Considerar CDN para imágenes");
      strengths.push("• Mejora significativa en tiempo de carga");
      strengths.push("• Optimización de recursos detectada");
    }

    if (isDarkMode) {
      analysisType = "🌙 Análisis de Dark Mode";
      score = 82 + Math.floor(Math.random() * 12);
      specificInsights.push("• Implementación de tema oscuro detectada");
      specificInsights.push("• Sistema de temas dinámico");
      specificInsights.push("• Persistencia de preferencias");
      recommendations.push("• Agregar transiciones suaves entre temas");
      recommendations.push("• Considerar preferencias del sistema");
      recommendations.push("• Testear en diferentes dispositivos");
      strengths.push("• UX mejorada con opciones de tema");
      warnings.push("• Verificar contraste en modo oscuro");
    }

    if (isAuthRelated) {
      analysisType = "👤 Análisis de Autenticación";
      score = 87 + Math.floor(Math.random() * 8);
      specificInsights.push("• Sistema de autenticación implementado");
      specificInsights.push("• Manejo de sesiones detectado");
      specificInsights.push("• Validación de usuarios activa");
      recommendations.push("• Implementar refresh tokens");
      recommendations.push("• Agregar logout automático por inactividad");
      recommendations.push("• Considerar OAuth para terceros");
      strengths.push("• Autenticación robusta implementada");
    }

    if (isBugFix) {
      analysisType = "🐛 Análisis de Corrección";
      score = 90 + Math.floor(Math.random() * 6);
      specificInsights.push("• Corrección de bug crítico detectada");
      specificInsights.push("• Problema de rendimiento resuelto");
      specificInsights.push("• Validación mejorada");
      recommendations.push("• Agregar tests para prevenir regresiones");
      recommendations.push("• Documentar el problema y la solución");
      recommendations.push("• Revisar código relacionado");
      strengths.push("• Bug crítico resuelto exitosamente");
    }

    if (isFeature) {
      analysisType = "✨ Análisis de Nueva Funcionalidad";
      score = 80 + Math.floor(Math.random() * 15);
      specificInsights.push("• Nueva funcionalidad implementada");
      specificInsights.push("• Código bien estructurado");
      specificInsights.push("• Integración exitosa");
      recommendations.push("• Agregar tests unitarios");
      recommendations.push("• Documentar la nueva funcionalidad");
      recommendations.push("• Considerar feedback de usuarios");
      strengths.push("• Feature implementada correctamente");
    }

    // Análisis por tipo de archivo
    if (hasReactFiles) {
      specificInsights.push("• Componentes React modificados");
      recommendations.push("• Usar React.memo para optimización");
      recommendations.push("• Implementar error boundaries");
    }

    if (hasStyleFiles) {
      specificInsights.push("• Estilos CSS/SCSS modificados");
      recommendations.push("• Considerar CSS-in-JS para mejor encapsulación");
      recommendations.push("• Optimizar especificidad de selectores");
    }

    if (hasUtilFiles) {
      specificInsights.push("• Utilidades y helpers modificados");
      strengths.push("• Código reutilizable bien estructurado");
      recommendations.push("• Agregar tests unitarios para utilidades");
    }

    if (hasComponentFiles) {
      specificInsights.push("• Componentes modificados");
      recommendations.push("• Implementar prop-types o TypeScript");
      recommendations.push("• Considerar composición vs herencia");
    }

    if (hasHookFiles) {
      specificInsights.push("• Custom hooks modificados");
      strengths.push("• Lógica reutilizable bien encapsulada");
      recommendations.push("• Documentar dependencias de hooks");
    }

    // Análisis por estadísticas
    if (stats.additions > 100) {
      warnings.push("• Cambio significativo detectado");
      recommendations.push("• Revisar impacto en rendimiento");
      recommendations.push("• Realizar pruebas exhaustivas");
    }

    if (stats.files > 3) {
      warnings.push("• Múltiples archivos modificados");
      recommendations.push("• Verificar consistencia entre archivos");
      recommendations.push("• Coordinar con el equipo");
    }

    if (version.status === "conflict") {
      warnings.push("• Conflictos de merge detectados");
      recommendations.push("• Resolver conflictos antes de continuar");
      recommendations.push("• Coordinar con el equipo");
    }

    // Generar análisis final único
    const analysis = `${analysisType} - ${version.hash}

📋 **Resumen del Commit:**
• Mensaje: "${version.message}"
• Autor: ${version.author}
• Rama: ${version.branch}
• Estado: ${version.status}
• Archivos: ${files.join(", ")}

🔍 **Insights Específicos:**
${specificInsights.join("\n")}

${strengths.length > 0 ? `✅ **Fortalezas Detectadas:**\n${strengths.join("\n")}\n\n` : ""}${warnings.length > 0 ? `⚠️ **Atenciones:**\n${warnings.join("\n")}\n\n` : ""}💡 **Recomendaciones Específicas:**
${recommendations.length > 0 ? recommendations.join("\n") : "• Agregar tests unitarios\n• Documentar cambios\n• Revisar naming conventions"}

📊 **Métricas de Calidad:** ${score}/100

📈 **Estadísticas Detalladas:**
• +${stats.additions} líneas agregadas (verde)
• -${stats.deletions} líneas eliminadas (rojo)
• ${stats.files} archivos modificados
• Tamaño del cambio: ${stats.additions + stats.deletions} líneas totales

🎯 **Impacto Estimado:**
• Complejidad: ${stats.additions + stats.deletions > 100 ? "Alta" : stats.additions + stats.deletions > 50 ? "Media" : "Baja"}
• Riesgo: ${version.status === "conflict" ? "Alto" : version.status === "testing" ? "Medio" : "Bajo"}
• Prioridad: ${score > 85 ? "Alta" : score > 75 ? "Media" : "Baja"}`;

    return analysis;
  };

  const handleRevertVersion = async (version: Version) => {
    try {
      // Simular revert
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`✅ Versión ${version.hash} revertida exitosamente`);
      fetchVersions();
    } catch (error) {
      console.error("Error reverting version:", error);
      toast.error("❌ Error al revertir versión");
    }
  };

  const handleDownloadVersion = async (version: Version) => {
    try {
      // Simular descarga
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Crear archivo ZIP simulado
      const zipContent = `# Archivo ZIP simulado para ${version.hash}
# Contenido del commit:
${version.message}

# Archivos modificados:
${version.filesChanged.join("\n")}

# Estadísticas:
+${version.stats.additions} líneas agregadas
-${version.stats.deletions} líneas eliminadas
${version.stats.files} archivos modificados

# Fecha: ${new Date(version.date).toLocaleString()}
# Autor: ${version.author}`;

      // Crear y descargar archivo
      const blob = new Blob([zipContent], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${version.hash}-${version.projectName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`✅ Descarga de ${version.hash} completada`);
    } catch {
      toast.error("❌ Error al descargar versión");
    }
  };

  const handleViewDiff = (version: Version) => {
    setSelectedVersion(version);
    setShowDiffModal(true);
  };

  const filteredVersions = versions.filter((version) => {
    const matchesAuthor =
      !filters.author ||
      version.author.toLowerCase().includes(filters.author.toLowerCase());
    const matchesBranch =
      !filters.branch ||
      version.branch.toLowerCase().includes(filters.branch.toLowerCase());
    const matchesStatus = !filters.status || version.status === filters.status;
    const matchesSearch =
      !filters.searchTerm ||
      version.message
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase()) ||
      version.hash.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      version.author.toLowerCase().includes(filters.searchTerm.toLowerCase());

    return matchesAuthor && matchesBranch && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">
                  Historial de Versiones
                </h1>
                <p className="text-black">
                  Gestiona y revisa el historial de cambios de tus proyectos
                </p>
              </div>

              {/* Loading simple */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-black">Cargando versiones...</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">
                Historial de Versiones
              </h1>
              <p className="text-black">
                Gestiona y revisa el historial de cambios de tus proyectos
              </p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-lg font-semibold text-black flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  Filtros y Búsqueda
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-black">
                    {filteredVersions.length} versiones encontradas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
                    Buscar
                  </label>
                  <input
                    type="text"
                    placeholder="Hash, mensaje, autor..."
                    value={filters.searchTerm}
                    onChange={(e) =>
                      setFilters({ ...filters, searchTerm: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    <UserIcon className="w-4 h-4 inline mr-1" />
                    Autor
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del autor..."
                    value={filters.author}
                    onChange={(e) =>
                      setFilters({ ...filters, author: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    <CodeBracketIcon className="w-4 h-4 inline mr-1" />
                    Rama
                  </label>
                  <select
                    value={filters.branch}
                    onChange={(e) =>
                      setFilters({ ...filters, branch: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                  >
                    <option value="">Todas las ramas</option>
                    <option value="main">main</option>
                    <option value="develop">develop</option>
                    <option value="feature">feature/*</option>
                    <option value="hotfix">hotfix/*</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    Estado
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                  >
                    <option value="">Todos los estados</option>
                    <option value="deployed">Desplegado</option>
                    <option value="testing">En pruebas</option>
                    <option value="conflict">En conflicto</option>
                    <option value="failed">Falló</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    <ChartBarIcon className="w-4 h-4 inline mr-1" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          start: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                  />
                </div>
              </div>
            </div>

            {/* Lista de Versiones */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-black flex items-center">
                  <DocumentIcon className="w-5 h-5 mr-2" />
                  Versiones ({filteredVersions.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredVersions.map((version) => (
                  <div
                    key={version.id}
                    className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-black bg-gray-100 px-2 py-1 rounded">
                            {version.hash}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}
                          >
                            {getStatusIcon(version.status)}{" "}
                            {getStatusText(version.status)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCIStatusColor(version.ciStatus)}`}
                          >
                            {getCIStatusIcon(version.ciStatus)} CI/CD
                          </span>
                        </div>

                        <h4 className="text-sm font-medium text-black mb-2">
                          {version.message}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-black mb-3">
                          <span className="flex items-center">
                            <UserIcon className="w-3 h-3 mr-1" />
                            {version.author}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {formatTimeAgo(version.date)}
                          </span>
                          <span className="flex items-center">
                            <CodeBracketIcon className="w-3 h-3 mr-1" />
                            {version.branch}
                          </span>
                          <span className="flex items-center">
                            <DocumentIcon className="w-3 h-3 mr-1" />
                            {version.projectName}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-black mb-3">
                          <span className="text-green-600">
                            +{version.stats.additions}
                          </span>
                          <span className="text-red-600">
                            -{version.stats.deletions}
                          </span>
                          <span className="text-black">
                            {version.stats.files} archivos
                          </span>
                        </div>

                        <div className="text-xs text-black">
                          {version.filesChanged.slice(0, 3).join(", ")}
                          {version.filesChanged.length > 3 &&
                            ` +${version.filesChanged.length - 3} más`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:ml-4 flex-wrap">
                        <button
                          onClick={() => handleViewDiff(version)}
                          className="text-xs bg-gray-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-gray-700 flex items-center"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Ver</span>
                        </button>

                        <button
                          onClick={() => handleAnalyzeWithAI(version)}
                          disabled={analyzingWithAI === version.id}
                          className={`text-xs px-2 sm:px-3 py-1 rounded flex items-center relative overflow-hidden ${
                            analyzingWithAI === version.id
                              ? "bg-green-500 text-white cursor-not-allowed"
                              : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                        >
                          {analyzingWithAI === version.id ? (
                            <>
                              <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
                              <span className="hidden sm:inline">
                                {analysisProgress}%
                              </span>
                              {/* Barra de progreso */}
                              <div
                                className="absolute bottom-0 left-0 h-1 bg-green-300 transition-all duration-300"
                                style={{ width: `${analysisProgress}%` }}
                              />
                            </>
                          ) : (
                            <>
                              <CodeBracketIcon className="w-3 h-3 mr-1" />
                              <span>IA</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDownloadVersion(version)}
                          className="text-xs bg-green-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-green-700 flex items-center"
                        >
                          <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Descargar</span>
                        </button>

                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleRevertVersion(version)}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center"
                          >
                            <ArrowUturnLeftIcon className="w-3 h-3 mr-1" />
                            Revertir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredVersions.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <DocumentIcon className="w-12 h-12 text-black mx-auto mb-4" />
                  <p className="text-black">
                    No se encontraron versiones con los filtros aplicados
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Diff */}
      {showDiffModal && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-black">
                  Cambios en {selectedVersion.hash}
                </h3>
                <p className="text-sm text-black mt-1">
                  {selectedVersion.message}
                </p>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="text-black hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedVersion.diff?.map((fileDiff, index) => (
                <div key={index} className="mb-6">
                  <h4 className="text-sm font-medium text-black mb-3 flex items-center">
                    <DocumentIcon className="w-4 h-4 mr-2" />
                    {fileDiff.file}
                  </h4>

                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                    {fileDiff.additions.map((line, lineIndex) => (
                      <div key={`add-${lineIndex}`} className="text-green-400">
                        {line}
                      </div>
                    ))}
                    {fileDiff.deletions.map((line, lineIndex) => (
                      <div key={`del-${lineIndex}`} className="text-red-400">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="text-sm text-black">
                <span className="text-green-600">
                  +{selectedVersion.stats.additions}
                </span>{" "}
                <span className="text-red-600">
                  -{selectedVersion.stats.deletions}
                </span>{" "}
                <span className="text-black">
                  {selectedVersion.stats.files} archivos
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAnalyzeWithAI(selectedVersion)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Analizar con IA
                </button>
                <button
                  onClick={() => setShowDiffModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Análisis de IA */}
      {aiAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-black flex items-center">
                  <CodeBracketIcon className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                  Análisis de IA
                </h3>
                <p className="text-sm text-black mt-1">
                  Resultados del análisis inteligente
                </p>
              </div>
              <button
                onClick={() => setAiAnalysis("")}
                className="text-black hover:text-gray-600 transition-colors ml-4 flex-shrink-0"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto text-black">
                  {aiAnalysis}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setAiAnalysis("")}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loader Flotante para Análisis de IA */}
      {showAnalysisLoader && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm mx-4 pointer-events-auto">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 flex items-center justify-center">
                <AILoader size="md" text="" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-black mb-1">
                  Analizando con IA
                </h4>
                <p className="text-sm text-black mb-2">
                  Procesando {analysisProgress}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
