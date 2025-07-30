// 🔷 Tipos base para STORYSINC/Proogia
// Basado en la documentación técnica proporcionada

// ═══════════════════════════════════════════════════════════════
// 👤 USUARIOS Y AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  birthdate?: string;
  address?: string;
  gender?: string;
  identityNumber?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = "developer" | "admin" | "architect" | "viewer";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "es" | "en";
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  projects: boolean;
  aiRecommendations: boolean;
  security: boolean;
}

export interface DashboardSettings {
  defaultView: "grid" | "list";
  showMetrics: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // en segundos
}

// ═══════════════════════════════════════════════════════════════
// 📁 PROYECTOS Y PATRONES DE DISEÑO
// ═══════════════════════════════════════════════════════════════

export interface Project {
  id: string;
  name: string;
  description: string;
  pattern: ProjectPattern;
  status: ProjectStatus;
  owner: User;
  collaborators: User[];
  createdAt: Date;
  updatedAt: Date;
  repository?: RepositoryInfo;
  components: Component[];
  analytics: ProjectAnalytics;
  aiInsights: AIInsight[];
}

export type ProjectPattern = "BFF" | "Sidecar" | "Standard" | "Microservices";

export type ProjectStatus = "active" | "archived" | "paused" | "completed";

export interface RepositoryInfo {
  url: string;
  branch: string;
  lastSync: Date;
  provider: "github" | "gitlab" | "bitbucket";
  isPrivate: boolean;
}

export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  path: string;
  code: string;
  lastModified: Date;
  author: User;
  dependencies: string[];
  props: ComponentProp[];
  tests: ComponentTest[];
  documentation?: string;
  iframe?: IFrameConfig;
}

export type ComponentType = "react" | "vue" | "angular" | "html" | "custom";

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string | number | boolean | object;
  description?: string;
}

export interface ComponentTest {
  id: string;
  name: string;
  type: "unit" | "integration" | "e2e";
  status: "passed" | "failed" | "pending";
  coverage?: number;
  lastRun: Date;
}

export interface IFrameConfig {
  enabled: boolean;
  isolationLevel: "strict" | "normal" | "relaxed";
  sandbox: string[];
  allowedOrigins: string[];
}

// ═══════════════════════════════════════════════════════════════
// 🤖 INTELIGENCIA ARTIFICIAL
// ═══════════════════════════════════════════════════════════════

export interface AIInsight {
  id: string;
  type: AIInsightType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-100
  category: AICategory;
  recommendations: AIRecommendation[];
  appliedAt?: Date;
  createdAt: Date;
  projectId: string;
  componentId?: string;
}

export type AIInsightType =
  | "performance"
  | "security"
  | "pattern_optimization"
  | "code_quality"
  | "accessibility"
  | "best_practices";

export type AICategory =
  | "optimization"
  | "refactoring"
  | "pattern_detection"
  | "vulnerability"
  | "improvement";

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  estimated_impact: "low" | "medium" | "high";
  effort_required: "minimal" | "moderate" | "significant";
  code_example?: string;
  documentation_link?: string;
  priority: number; // 1-10
}

export interface AIAnalysisResult {
  overall_score: number; // 0-100
  metrics: AnalysisMetric[];
  patterns_detected: ProjectPattern[];
  suggestions: AIRecommendation[];
  performance_insights: PerformanceMetric[];
  security_assessment: SecurityMetric[];
}

export interface AnalysisMetric {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  benchmark?: number;
}

export interface PerformanceMetric {
  metric: string;
  current_value: number;
  optimal_value: number;
  improvement_suggestions: string[];
}

export interface SecurityMetric {
  vulnerability_type: string;
  severity: "low" | "medium" | "high" | "critical";
  affected_components: string[];
  remediation_steps: string[];
}

// ═══════════════════════════════════════════════════════════════
// 📊 ANALYTICS Y MÉTRICAS
// ═══════════════════════════════════════════════════════════════

export interface ProjectAnalytics {
  totalComponents: number;
  linesOfCode: number;
  testCoverage: number;
  performanceScore: number;
  securityScore: number;
  codeQualityScore: number;
  lastAnalysis: Date;
  trends: AnalyticsTrend[];
  usage: UsageMetrics;
}

export interface AnalyticsTrend {
  date: Date;
  metric: string;
  value: number;
}

export interface UsageMetrics {
  dailyActiveSessions: number;
  weeklyActiveUsers: number;
  mostUsedComponents: string[];
  averageSessionDuration: number; // en minutos
  syncFrequency: number; // por día
}

// ═══════════════════════════════════════════════════════════════
// 🔄 SINCRONIZACIÓN EN TIEMPO REAL
// ═══════════════════════════════════════════════════════════════

export interface SyncEvent {
  id: string;
  type: SyncEventType;
  projectId: string;
  componentId?: string;
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
}

export type SyncEventType =
  | "code_change"
  | "component_added"
  | "component_deleted"
  | "user_joined"
  | "user_left"
  | "ai_analysis_completed";

export interface RealtimeConnection {
  userId: string;
  projectId: string;
  socketId: string;
  joinedAt: Date;
  isActive: boolean;
  cursor?: CursorPosition;
}

export interface CursorPosition {
  componentId: string;
  line: number;
  column: number;
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// ═══════════════════════════════════════════════════════════════
// 🎯 UI/UX Y ESTADOS
// ═══════════════════════════════════════════════════════════════

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: Record<string, unknown>;
  onClose?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// 🌐 API Y RESPONSES
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
  meta?: Record<string, unknown>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 CONFIGURACIÓN Y CONSTANTES
// ═══════════════════════════════════════════════════════════════

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  websocket: {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
  };
  ai: {
    analysisInterval: number;
    confidenceThreshold: number;
    maxRecommendations: number;
  };
  ui: {
    theme: string;
    animations: boolean;
    debugMode: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════
// 📋 FORMULARIOS Y VALIDACIÓN
// ═══════════════════════════════════════════════════════════════

export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
  birthdate?: string;
  address?: string;
  gender?: string;
  identityNumber?: string;
  agreeToTerms: boolean;
}

export interface ProjectForm {
  name: string;
  description: string;
  pattern: ProjectPattern;
  repository?: Partial<RepositoryInfo>;
  collaborators: string[]; // user IDs
}

export interface ComponentForm {
  name: string;
  type: ComponentType;
  code: string;
  documentation?: string;
  props: ComponentProp[];
}

// ═══════════════════════════════════════════════════════════════
// 🎨 THEME Y ESTILOS
// ═══════════════════════════════════════════════════════════════

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
}

// ═══════════════════════════════════════════════════════════════
// 🔔 NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: string; // success, info, warning, etc.
}

export interface AIConfig {
  analysisInterval: number; // en minutos
  confidenceThreshold: number; // 0-100
  maxRecommendations: number; // máximo de recomendaciones por análisis
  autoAnalysis: boolean; // análisis automático
  performanceAnalysis: boolean; // análisis de rendimiento
  securityAnalysis: boolean; // análisis de seguridad
  codeQualityAnalysis: boolean; // análisis de calidad de código
  accessibilityAnalysis: boolean; // análisis de accesibilidad
  patternDetection: boolean; // detección de patrones
  aiModel: string; // modelo de IA a usar
  maxTokens: number; // máximo de tokens por análisis
  temperature: number; // temperatura del modelo (0-1)
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface AIStats {
  totalAnalyses: number;
  averageConfidence: number;
  mostCommonIssues: Array<{ issue: string; count: number }>;
  performanceScore: number;
}
