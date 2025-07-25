// 📋 Constantes globales para STORYSINC/Proogia
// Basado en el Figma y documentación técnica

// ═══════════════════════════════════════════════════════════════
// 🎨 BRANDING Y COLORES
// ═══════════════════════════════════════════════════════════════

export const BRAND = {
  name: "Proogia",
  fullName: "STORYSINC - Proogia",
  tagline: "Sincronizá, desarrollá y simplificá",
  description: "PaaS para Entornos de Desarrollo Impulsados por IA",
} as const;

export const COLORS = {
  primary: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // Color principal
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },
  states: {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 📱 RESPONSIVE BREAKPOINTS
// ═══════════════════════════════════════════════════════════════

export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// ═══════════════════════════════════════════════════════════════
// 🔧 CONFIGURACIÓN DE API
// ═══════════════════════════════════════════════════════════════

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  TIMEOUT: 30000, // 30 segundos
  RETRIES: 3,
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      LOGOUT: "/auth/logout",
      REFRESH: "/auth/refresh",
      PROFILE: "/auth/profile",
    },
    PROJECTS: {
      LIST: "/projects",
      CREATE: "/projects",
      GET: (id: string) => `/projects/${id}`,
      UPDATE: (id: string) => `/projects/${id}`,
      DELETE: (id: string) => `/projects/${id}`,
      ANALYTICS: (id: string) => `/projects/${id}/analytics`,
    },
    COMPONENTS: {
      LIST: (projectId: string) => `/projects/${projectId}/components`,
      CREATE: (projectId: string) => `/projects/${projectId}/components`,
      GET: (projectId: string, componentId: string) =>
        `/projects/${projectId}/components/${componentId}`,
      UPDATE: (projectId: string, componentId: string) =>
        `/projects/${projectId}/components/${componentId}`,
      DELETE: (projectId: string, componentId: string) =>
        `/projects/${projectId}/components/${componentId}`,
    },
    AI: {
      ANALYZE: "/ai/analyze",
      RECOMMENDATIONS: "/ai/recommendations",
      INSIGHTS: "/ai/insights",
      METRICS: "/ai/metrics",
    },
    USERS: {
      LIST: "/users",
      GET: (id: string) => `/users/${id}`,
      UPDATE: (id: string) => `/users/${id}`,
      PREFERENCES: (id: string) => `/users/${id}/preferences`,
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 🔌 WEBSOCKET CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

export const WEBSOCKET_CONFIG = {
  URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
  RECONNECT_INTERVAL: 5000, // 5 segundos
  MAX_RECONNECT_ATTEMPTS: 10,
  EVENTS: {
    // Eventos de conexión
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    RECONNECT: "reconnect",

    // Eventos de proyectos
    PROJECT_JOIN: "project:join",
    PROJECT_LEAVE: "project:leave",
    PROJECT_UPDATE: "project:update",

    // Eventos de sincronización
    CODE_CHANGE: "sync:code_change",
    COMPONENT_UPDATE: "sync:component_update",
    USER_CURSOR: "sync:cursor",

    // Eventos de IA
    AI_ANALYSIS_START: "ai:analysis_start",
    AI_ANALYSIS_COMPLETE: "ai:analysis_complete",
    AI_RECOMMENDATION: "ai:recommendation",

    // Eventos de notificaciones
    NOTIFICATION: "notification",
    TOAST: "toast",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 🤖 CONFIGURACIÓN DE IA
// ═══════════════════════════════════════════════════════════════

export const AI_CONFIG = {
  ANALYSIS_INTERVAL: 300000, // 5 minutos
  CONFIDENCE_THRESHOLD: 0.8, // 80%
  MAX_RECOMMENDATIONS: 10,
  CATEGORIES: {
    OPTIMIZATION: "optimization",
    REFACTORING: "refactoring",
    PATTERN_DETECTION: "pattern_detection",
    VULNERABILITY: "vulnerability",
    IMPROVEMENT: "improvement",
  },
  INSIGHT_TYPES: {
    PERFORMANCE: "performance",
    SECURITY: "security",
    PATTERN_OPTIMIZATION: "pattern_optimization",
    CODE_QUALITY: "code_quality",
    ACCESSIBILITY: "accessibility",
    BEST_PRACTICES: "best_practices",
  },
  SEVERITIES: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 📊 PATRONES DE DISEÑO
// ═══════════════════════════════════════════════════════════════

export const PATTERNS = {
  BFF: {
    name: "Backend for Frontend",
    description:
      "Patrón que crea una capa de API específica para cada frontend",
    icon: "🔗",
    color: "bg-blue-500",
    benefits: [
      "API optimizada para cada cliente",
      "Menor acoplamiento",
      "Mejor rendimiento",
    ],
  },
  SIDECAR: {
    name: "Sidecar",
    description:
      "Patrón que acompaña servicios principales con funcionalidades auxiliares",
    icon: "🚗",
    color: "bg-green-500",
    benefits: [
      "Separación de responsabilidades",
      "Reutilización de componentes",
      "Facilita el mantenimiento",
    ],
  },
  STANDARD: {
    name: "Standard",
    description: "Arquitectura tradicional monolítica o en capas",
    icon: "🏗️",
    color: "bg-gray-500",
    benefits: [
      "Simplicidad de desarrollo",
      "Fácil despliegue",
      "Menos complejidad inicial",
    ],
  },
  MICROSERVICES: {
    name: "Microservices",
    description: "Arquitectura distribuida con servicios independientes",
    icon: "🧩",
    color: "bg-purple-500",
    benefits: [
      "Escalabilidad independiente",
      "Tecnologías heterogéneas",
      "Resiliencia mejorada",
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 🎯 ESTADOS Y CONFIGURACIÓN UI
// ═══════════════════════════════════════════════════════════════

export const UI_CONFIG = {
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  TOAST_DURATION: {
    SUCCESS: 4000,
    ERROR: 6000,
    WARNING: 5000,
    INFO: 4000,
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
  },
  DEBOUNCE_DELAY: 300, // Para búsquedas
  AUTOSAVE_INTERVAL: 30000, // 30 segundos
} as const;

// ═══════════════════════════════════════════════════════════════
// 🔐 ROLES Y PERMISOS
// ═══════════════════════════════════════════════════════════════

export const ROLES = {
  ADMIN: {
    value: "admin",
    label: "Administrador",
    permissions: [
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
      "projects.create",
      "projects.read",
      "projects.update",
      "projects.delete",
      "ai.configure",
      "system.manage",
    ],
  },
  ARCHITECT: {
    value: "architect",
    label: "Arquitecto",
    permissions: [
      "projects.create",
      "projects.read",
      "projects.update",
      "projects.delete",
      "components.create",
      "components.read",
      "components.update",
      "components.delete",
      "ai.insights",
      "patterns.implement",
    ],
  },
  DEVELOPER: {
    value: "developer",
    label: "Desarrollador",
    permissions: [
      "projects.read",
      "projects.update",
      "components.create",
      "components.read",
      "components.update",
      "ai.recommendations",
      "sync.participate",
    ],
  },
  VIEWER: {
    value: "viewer",
    label: "Visualizador",
    permissions: ["projects.read", "components.read", "ai.view"],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 📝 FORMULARIOS Y VALIDACIÓN
// ═══════════════════════════════════════════════════════════════

export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  PROJECT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9\s_-]+$/,
  },
  COMPONENT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z][a-zA-Z0-9_]*$/,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 🌐 INTERNACIONALIZACIÓN
// ═══════════════════════════════════════════════════════════════

export const LOCALES = {
  ES: "es",
  EN: "en",
} as const;

export const DEFAULT_LOCALE = LOCALES.ES;

// ═══════════════════════════════════════════════════════════════
// 📁 ARCHIVOS Y FORMATOS
// ═══════════════════════════════════════════════════════════════

export const FILE_CONFIG = {
  ALLOWED_EXTENSIONS: [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".vue",
    ".html",
    ".css",
    ".scss",
    ".json",
    ".md",
    ".yml",
    ".yaml",
  ],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_LANGUAGES: [
    "javascript",
    "typescript",
    "react",
    "vue",
    "html",
    "css",
    "json",
    "markdown",
  ],
} as const;

// ═══════════════════════════════════════════════════════════════
// 🔗 ENLACES EXTERNOS
// ═══════════════════════════════════════════════════════════════

export const EXTERNAL_LINKS = {
  DOCUMENTATION: "https://docs.proogia.com",
  SUPPORT: "https://support.proogia.com",
  COMMUNITY: "https://community.proogia.com",
  GITHUB: "https://github.com/proogia",
  STATUS: "https://status.proogia.com",
  BLOG: "https://blog.proogia.com",
  LEGAL: {
    TERMS: "https://proogia.com/terms",
    PRIVACY: "https://proogia.com/privacy",
    COOKIES: "https://proogia.com/cookies",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 📊 MÉTRICAS Y ANALYTICS
// ═══════════════════════════════════════════════════════════════

export const METRICS = {
  PERFORMANCE_THRESHOLDS: {
    EXCELLENT: 90,
    GOOD: 75,
    FAIR: 60,
    POOR: 45,
  },
  SECURITY_LEVELS: {
    SECURE: 90,
    MOSTLY_SECURE: 75,
    NEEDS_ATTENTION: 60,
    VULNERABLE: 45,
  },
  CODE_QUALITY_GRADES: {
    A: 90,
    B: 80,
    C: 70,
    D: 60,
    F: 0,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 🎭 ANIMACIONES Y TRANSICIONES
// ═══════════════════════════════════════════════════════════════

export const ANIMATIONS = {
  EASING: {
    EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
    EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)",
    EASE_IN: "cubic-bezier(0.4, 0, 1, 1)",
    BOUNCE: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
  VARIANTS: {
    FADE_IN: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    SLIDE_UP: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
    },
    SCALE: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
  },
} as const;
