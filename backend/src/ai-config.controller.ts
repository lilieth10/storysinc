/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Put, Body, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PrismaService } from './prisma.service';

interface AIConfig {
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

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin/ai-config')
export class AIConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('admin')
  async getAIConfig(): Promise<AIConfig> {
    try {
      // Obtener configuración de la base de datos
      const config = await this.prisma.aIConfig.findFirst();

      if (!config) {
        // Crear configuración por defecto si no existe
        const defaultConfig = await this.prisma.aIConfig.create({
          data: {
            analysisInterval: 30,
            confidenceThreshold: 75,
            maxRecommendations: 10,
            autoAnalysis: true,
            performanceAnalysis: true,
            securityAnalysis: true,
            codeQualityAnalysis: true,
            accessibilityAnalysis: true,
            patternDetection: true,
            aiModel: 'gpt-4',
            maxTokens: 4000,
            temperature: 0.7,
          },
        });
        return defaultConfig as AIConfig;
      }

      return config as AIConfig;
    } catch (error) {
      // Si hay error, retornar configuración por defecto
      return {
        analysisInterval: 30,
        confidenceThreshold: 75,
        maxRecommendations: 10,
        autoAnalysis: true,
        performanceAnalysis: true,
        securityAnalysis: true,
        codeQualityAnalysis: true,
        accessibilityAnalysis: true,
        patternDetection: true,
        aiModel: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.7,
      };
    }
  }

  @Put()
  @Roles('admin')
  async updateAIConfig(
    @Body() configData: Partial<AIConfig>,
  ): Promise<AIConfig> {
    // Validar los valores
    if (
      configData.confidenceThreshold !== undefined &&
      (configData.confidenceThreshold < 0 ||
        configData.confidenceThreshold > 100)
    ) {
      throw new Error('El umbral de confianza debe estar entre 0 y 100');
    }

    if (
      configData.temperature !== undefined &&
      (configData.temperature < 0 || configData.temperature > 1)
    ) {
      throw new Error('La temperatura debe estar entre 0 y 1');
    }

    if (
      configData.analysisInterval !== undefined &&
      configData.analysisInterval < 1
    ) {
      throw new Error('El intervalo de análisis debe ser al menos 1 minuto');
    }

    if (
      configData.maxRecommendations !== undefined &&
      configData.maxRecommendations < 1
    ) {
      throw new Error('El máximo de recomendaciones debe ser al menos 1');
    }

    try {
      // Actualizar o crear configuración en la base de datos
      const existingConfig = await this.prisma.aIConfig.findFirst();

      if (existingConfig) {
        const updatedConfig = await this.prisma.aIConfig.update({
          where: { id: existingConfig.id },
          data: configData,
        });
        return updatedConfig as AIConfig;
      } else {
        const newConfig = await this.prisma.aIConfig.create({
          data: {
            analysisInterval: 30,
            confidenceThreshold: 75,
            maxRecommendations: 10,
            autoAnalysis: true,
            performanceAnalysis: true,
            securityAnalysis: true,
            codeQualityAnalysis: true,
            accessibilityAnalysis: true,
            patternDetection: true,
            aiModel: 'gpt-4',
            maxTokens: 4000,
            temperature: 0.7,
            ...configData,
          },
        });
        return newConfig as AIConfig;
      }
    } catch (error) {
      throw new Error('Error al actualizar la configuración de IA');
    }
  }

  @Get('models')
  @Roles('admin')
  async getAvailableModels(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
    }>
  > {
    try {
      // Obtener modelos de la base de datos
      const dbModels = await this.prisma.aIModel.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      // Si no hay modelos en la DB, retornar los por defecto
      if (dbModels.length === 0) {
        return [
          {
            id: 'gpt-4',
            name: 'GPT-4',
            description: 'Modelo más avanzado, mejor rendimiento',
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            description: 'Modelo rápido y eficiente',
          },
          {
            id: 'claude-3',
            name: 'Claude-3',
            description: 'Modelo especializado en código',
          },
          {
            id: 'code-llama',
            name: 'Code Llama',
            description: 'Modelo específico para programación',
          },
        ];
      }

      return dbModels.map((model) => ({
        id: model.name,
        name: model.name,
        description: model.description,
      }));
    } catch (error) {
      // Retornar modelos por defecto si hay error
      return [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          description: 'Modelo más avanzado, mejor rendimiento',
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Modelo rápido y eficiente',
        },
      ];
    }
  }

  @Get('stats')
  @Roles('admin')
  async getAIStats(): Promise<{
    totalAnalyses: number;
    averageConfidence: number;
    mostCommonIssues: Array<{ issue: string; count: number }>;
    performanceScore: number;
  }> {
    try {
      // Obtener estadísticas reales de la base de datos
      const totalAnalyses = await this.prisma.aIAnalysis.count();

      const analyses = await this.prisma.aIAnalysis.findMany({
        select: { confidence: true, analysisType: true },
      });

      const averageConfidence =
        analyses.length > 0
          ? analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) /
            analyses.length
          : 0;

      // Contar tipos de análisis más comunes
      const analysisTypeCounts: Record<string, number> = {};
      analyses.forEach((analysis) => {
        const type = analysis.analysisType;
        analysisTypeCounts[type] = (analysisTypeCounts[type] || 0) + 1;
      });

      const mostCommonIssues = Object.entries(analysisTypeCounts)
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Calcular puntuación de rendimiento basada en confianza promedio
      const performanceScore = Math.min(100, Math.max(0, averageConfidence));

      return {
        totalAnalyses,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        mostCommonIssues,
        performanceScore: Math.round(performanceScore * 100) / 100,
      };
    } catch (error) {
      // Retornar estadísticas por defecto si hay error
      return {
        totalAnalyses: 0,
        averageConfidence: 0,
        mostCommonIssues: [],
        performanceScore: 0,
      };
    }
  }

  @Get('projects')
  @Roles('admin')
  async getAllProjects() {
    try {
      // Obtener todos los proyectos del sistema para el admin
      const projects = await this.prisma.project.findMany({
        include: {
          owner: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return projects;
    } catch (error) {
      throw new Error(`Error al obtener proyectos: ${error.message}`);
    }
  }

  @Post('analyze-project')
  @Roles('admin')
  async analyzeProject(@Body() body: { projectId: number }) {
    try {
      // Obtener el proyecto
      const project = await this.prisma.project.findUnique({
        where: { id: body.projectId },
        include: { owner: true },
      });

      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      // Obtener configuración de IA
      const aiConfig = await this.prisma.aIConfig.findFirst();
      const config = aiConfig || {
        confidenceThreshold: 75,
        maxRecommendations: 10,
        performanceAnalysis: true,
        securityAnalysis: true,
        codeQualityAnalysis: true,
      };

      // Simular análisis de IA basado en el código del proyecto
      const analysis = this.performAIAnalysis(project, config);

      // Guardar el análisis en la base de datos
      const savedAnalysis = await this.prisma.aIAnalysis.create({
        data: {
          projectId: project.id,
          userId: project.ownerId,
          analysisType: 'comprehensive',
          confidence: analysis.confidence,
          recommendations: JSON.stringify(analysis.recommendations),
          status: 'completed',
        },
      });

      return {
        id: savedAnalysis.id,
        project: {
          id: project.id,
          name: project.name,
          pattern: project.pattern,
          language: project.language,
        },
        analysis: {
          confidence: analysis.confidence,
          recommendations: analysis.recommendations,
          metrics: analysis.metrics,
          issues: analysis.issues,
          improvements: analysis.improvements,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Error al analizar proyecto: ${error.message}`);
    }
  }

  private performAIAnalysis(
    project: {
      id: number;
      ownerId: number;
      pattern: string;
      language: string;
    },
    config: {
      confidenceThreshold: number;
      maxRecommendations: number;
      performanceAnalysis: boolean;
      securityAnalysis: boolean;
      codeQualityAnalysis: boolean;
    },
  ) {
    // Simular análisis de IA basado en el patrón del proyecto
    const recommendations: any[] = [];
    const issues: any[] = [];
    const improvements: any[] = [];
    let confidence = 85;

    // Análisis basado en el patrón del proyecto
    if (project.pattern === 'monolith') {
      recommendations.push({
        type: 'architecture',
        title: 'Considera migrar a microservicios',
        description:
          'Tu aplicación es un monolito. Para mejor escalabilidad, considera dividirla en microservicios.',
        severity: 'medium',
        impact: 'high',
      });

      issues.push({
        type: 'performance',
        title: 'Posibles cuellos de botella',
        description:
          'Los monolitos pueden tener problemas de rendimiento bajo alta carga.',
        severity: 'medium',
      });

      confidence -= 10;
    }

    if (project.pattern === 'BFF') {
      recommendations.push({
        type: 'optimization',
        title: 'Optimiza el BFF',
        description:
          'Implementa caché y rate limiting para mejorar el rendimiento.',
        severity: 'low',
        impact: 'medium',
      });

      improvements.push({
        type: 'security',
        title: 'Agregar autenticación',
        description: 'Implementa JWT para proteger las APIs del BFF.',
        severity: 'high',
      });
    }

    // Análisis de seguridad
    if (config.securityAnalysis) {
      recommendations.push({
        type: 'security',
        title: 'Implementar validación de inputs',
        description: 'Agrega validación robusta para prevenir inyecciones.',
        severity: 'high',
        impact: 'critical',
      });

      issues.push({
        type: 'security',
        title: 'Falta autenticación',
        description: 'No se detectó sistema de autenticación.',
        severity: 'high',
      });

      confidence -= 15;
    }

    // Análisis de rendimiento
    if (config.performanceAnalysis) {
      recommendations.push({
        type: 'performance',
        title: 'Implementar caché',
        description: 'Agrega Redis para mejorar los tiempos de respuesta.',
        severity: 'medium',
        impact: 'high',
      });

      improvements.push({
        type: 'performance',
        title: 'Optimizar consultas',
        description: 'Revisa las consultas a la base de datos.',
        severity: 'medium',
      });
    }

    // Análisis de calidad de código
    if (config.codeQualityAnalysis) {
      recommendations.push({
        type: 'quality',
        title: 'Agregar tests',
        description: 'Implementa tests unitarios y de integración.',
        severity: 'medium',
        impact: 'medium',
      });

      improvements.push({
        type: 'quality',
        title: 'Documentar APIs',
        description: 'Agrega documentación con Swagger/OpenAPI.',
        severity: 'low',
      });
    }

    return {
      confidence: Math.max(0, Math.min(100, confidence)),
      recommendations: recommendations.slice(0, config.maxRecommendations),
      issues,
      improvements,
      metrics: {
        codeQuality: Math.floor(Math.random() * 30) + 70,
        security: Math.floor(Math.random() * 40) + 60,
        performance: Math.floor(Math.random() * 35) + 65,
        maintainability: Math.floor(Math.random() * 25) + 75,
      },
    };
  }
}
