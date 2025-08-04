import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Res,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from './prisma.service';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
// import PDFDocument from 'pdfkit';

interface AuthRequest extends Request {
  user: { userId: number; email: string };
}

interface CreateReportDto {
  type: string;
  title: string;
  description?: string;
  metrics?: Record<string, any>;
  dateRange?: { start: string; end: string };
}

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getReports(
    @Req() req: AuthRequest,
    @Query('type') type?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const where: Prisma.ReportWhereInput = {
      userId: req.user.userId,
    };

    if (type) {
      where.type = type;
    }

    if (start && end) {
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('metrics')
  async getReportsMetrics(
    @Req() req: AuthRequest,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit) : 10;

    return this.prisma.report.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  @Get('summary-metrics')
  async getSummaryMetrics(
    @Req() req: AuthRequest,
    @Query('type') type: string = 'project',
    @Query('dateRange') dateRange: string = '30',
  ) {
    try {
      // Calcular fechas basadas en el rango proporcionado
      const endDate = new Date();
      const startDate = new Date();
      const daysBack = parseInt(dateRange);
      startDate.setDate(startDate.getDate() - daysBack);



      // Obtener datos reales del usuario y sus proyectos dentro del rango de fechas
      const userProjects = await this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: req.user.userId },
            {
              collaborators: {
                some: { userId: req.user.userId },
              },
            },
          ],
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          collaborators: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          versions: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          aiAnalyses: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      // Verificar si hay proyectos sin el filtro de fechas para debug
      const allUserProjects = await this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: req.user.userId },
            {
              collaborators: {
                some: { userId: req.user.userId },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              collaborators: true
            }
          }
        }
      });





      // Obtener datos de sincronización dentro del rango de fechas
      const syncProjects = await this.prisma.syncProject.findMany({
        where: { 
          userId: req.user.userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          syncHistory: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });



      // Obtener análisis de IA dentro del rango de fechas
      const aiAnalyses = await this.prisma.aIAnalysis.findMany({
        where: {
          projectId: {
            in: userProjects.map(p => p.id),
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });



      let chartData = {};

      if (type === 'project') {
        // Datos para gráfico de proyectos por patrón
        const projectsByPattern = userProjects.reduce((acc, project) => {
          acc[project.pattern] = (acc[project.pattern] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        chartData = {
          categories: Object.keys(projectsByPattern),
          series: [{
            name: 'Proyectos',
            data: Object.values(projectsByPattern),
          }],
          totalProjects: userProjects.length,
          totalCollaborators: userProjects.reduce((sum, project) => sum + project.collaborators.length, 0),
        };
        

      } else if (type === 'collaboration') {
        // Datos para gráfico de colaboradores por rol
        const allCollaborators = userProjects.flatMap(p => p.collaborators);
        const collaboratorsByRole = allCollaborators.reduce((acc, colab) => {
          acc[colab.role] = (acc[colab.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        chartData = {
          categories: Object.keys(collaboratorsByRole),
          series: [{
            name: 'Colaboradores',
            data: Object.values(collaboratorsByRole),
          }],
          totalCollaborators: new Set(allCollaborators.map(c => c.user.id)).size,
          totalCollaborations: allCollaborators.length,
        };
      } else if (type === 'sync') {
        // Datos para gráfico de sincronizaciones por tipo
        const syncsByType = syncProjects.reduce((acc, project) => {
          acc[project.type] = (acc[project.type] || 0) + project.syncHistory.length;
          return acc;
        }, {} as Record<string, number>);

        chartData = {
          categories: Object.keys(syncsByType),
          series: [{
            name: 'Sincronizaciones',
            data: Object.values(syncsByType),
          }],
          totalSyncs: syncProjects.reduce((sum, project) => sum + project.syncHistory.length, 0),
          successfulSyncs: syncProjects.reduce((sum, project) => 
            sum + project.syncHistory.filter(h => h.status === 'success').length, 0
          ),
        };
      } else if (type === 'ai') {
        // Datos para gráfico de análisis de IA por tipo
        const analysesByType = aiAnalyses.reduce((acc, analysis) => {
          acc[analysis.analysisType] = (acc[analysis.analysisType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        chartData = {
          categories: Object.keys(analysesByType),
          series: [{
            name: 'Análisis',
            data: Object.values(analysesByType),
          }],
          totalAnalyses: aiAnalyses.length,
          averageScore: aiAnalyses.length > 0 ? (aiAnalyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / aiAnalyses.length).toFixed(2) : 0,
        };
      } else if (type === 'history') {
        // Datos para gráfico de versiones por estado
        const allVersions = userProjects.flatMap(p => p.versions);
        const versionsByStatus = allVersions.reduce((acc, version) => {
          acc[version.status] = (acc[version.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        chartData = {
          categories: Object.keys(versionsByStatus),
          series: [{
            name: 'Versiones',
            data: Object.values(versionsByStatus),
          }],
          totalVersions: allVersions.length,
          averageVersionsPerProject: userProjects.length > 0 ? (allVersions.length / userProjects.length).toFixed(2) : 0,
        };
      }



      return {
        chartData,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    } catch (error) {
      console.error('Error getting summary metrics:', error);
      throw new Error('Error al obtener métricas de resumen');
    }
  }

  @Get(':id')
  async getReport(@Param('id') id: string, @Req() req: AuthRequest) {
    const report = await this.prisma.report.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId,
      },
    });

    if (!report) {
      throw new Error('Reporte no encontrado');
    }

    return report;
  }

  @Post()
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @Req() req: AuthRequest,
  ) {
    try {
      // Calcular fechas basadas en el rango proporcionado
      const endDate = new Date();
      const startDate = new Date();
      
      if (createReportDto.dateRange?.start && createReportDto.dateRange?.end) {
        startDate.setTime(new Date(createReportDto.dateRange.start).getTime());
        endDate.setTime(new Date(createReportDto.dateRange.end).getTime());
      } else {
        // Si no se proporciona rango, usar los últimos 30 días por defecto
        startDate.setDate(startDate.getDate() - 30);
      }

      // Obtener datos reales del usuario y sus proyectos dentro del rango de fechas
      const userProjects = await this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: req.user.userId },
            {
              collaborators: {
                some: { userId: req.user.userId },
              },
            },
          ],
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          collaborators: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          owner: {
            select: { id: true, fullName: true, email: true },
          },
          versions: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          aiAnalyses: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      // Obtener datos de sincronización dentro del rango de fechas
      const syncProjects = await this.prisma.syncProject.findMany({
        where: { 
          userId: req.user.userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          syncHistory: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      // Obtener análisis de IA dentro del rango de fechas
      const aiAnalyses = await this.prisma.aIAnalysis.findMany({
        where: {
          projectId: {
            in: userProjects.map(p => p.id),
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Generar métricas específicas según el tipo de reporte
      let metrics = {};
      let iaResults = {};

      if (createReportDto.type === 'project') {
        // Métricas de proyectos
        const totalProjects = userProjects.length;
        const totalCollaborators = userProjects.reduce(
          (sum, project) => sum + project.collaborators.length,
          0,
        );
        const projectsByPattern = userProjects.reduce((acc, project) => {
          acc[project.pattern] = (acc[project.pattern] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        metrics = {
          totalProjects,
          totalCollaborators,
          projectsByPattern,
          averageCollaboratorsPerProject: totalProjects > 0 ? (totalCollaborators / totalProjects).toFixed(2) : 0,
          activeProjects: userProjects.filter(p => p.status === 'active').length,
          recentProjects: userProjects.filter(p => {
            const projectDate = new Date(p.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return projectDate > thirtyDaysAgo;
          }).length,
          projectsByLanguage: userProjects.reduce((acc, project) => {
            acc[project.language] = (acc[project.language] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };

        // IA Results para proyectos
        const performanceScore = Math.floor(Math.random() * 30) + 70;
        const recommendations = [
          {
            type: 'performance',
            message: totalProjects > 5 ? 'Considera consolidar proyectos similares' : 'Excelente gestión de proyectos',
            priority: totalProjects > 5 ? 'high' : 'low',
          },
          {
            type: 'collaboration',
            message: totalCollaborators > 10 ? 'Gran trabajo en equipo detectado' : 'Considera agregar más colaboradores',
            priority: totalCollaborators > 10 ? 'low' : 'medium',
          },
          {
            type: 'architecture',
            message: projectsByPattern['microservices'] > 2 ? 'Arquitectura escalable detectada' : 'Considera migrar a microservicios',
            priority: projectsByPattern['microservices'] > 2 ? 'low' : 'medium',
          },
        ];

        iaResults = {
          recommendations,
          alerts: [
            {
              type: 'info',
              message: `Gestión de ${totalProjects} proyectos activos en el período seleccionado`,
              severity: 'low',
            },
          ],
          insights: {
            performanceScore,
            collaborationScore: Math.floor(Math.random() * 20) + 80,
            architectureScore: Math.floor(Math.random() * 15) + 85,
            recommendations: recommendations.length,
          },
        };
      } else if (createReportDto.type === 'collaboration') {
        // Métricas de colaboración
        const allCollaborators = userProjects.flatMap(p => p.collaborators);
        const uniqueCollaborators = new Set(allCollaborators.map(c => c.user.id));
        const collaboratorsByRole = allCollaborators.reduce((acc, colab) => {
          acc[colab.role] = (acc[colab.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        metrics = {
          totalCollaborators: uniqueCollaborators.size,
          totalCollaborations: allCollaborators.length,
          collaboratorsByRole,
          averageProjectsPerCollaborator: uniqueCollaborators.size > 0 ? (userProjects.length / uniqueCollaborators.size).toFixed(2) : 0,
          mostCollaborativeProject: userProjects.reduce((max, project) => 
            project.collaborators.length > max.collaborators.length ? project : max
          , userProjects[0] || { name: 'N/A', collaborators: [] }),
          collaborationActivity: {
            recentCollaborations: allCollaborators.filter(c => {
              const collaborationDate = new Date();
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return collaborationDate > thirtyDaysAgo;
            }).length,
          },
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };

        // IA Results para colaboración
        const collaborationScore = Math.floor(Math.random() * 25) + 75;
        const recommendations = [
          {
            type: 'team',
            message: uniqueCollaborators.size > 5 ? 'Excelente diversidad de equipo' : 'Considera expandir el equipo',
            priority: uniqueCollaborators.size > 5 ? 'low' : 'medium',
          },
          {
            type: 'communication',
            message: 'Implementa herramientas de comunicación en tiempo real',
            priority: 'medium',
          },
          {
            type: 'roles',
            message: Object.keys(collaboratorsByRole).length > 3 ? 'Buena distribución de roles' : 'Considera definir roles más específicos',
            priority: Object.keys(collaboratorsByRole).length > 3 ? 'low' : 'medium',
          },
        ];

        iaResults = {
          recommendations,
          alerts: [
            {
              type: 'success',
              message: `${uniqueCollaborators.size} colaboradores activos en el período seleccionado`,
              severity: 'low',
            },
          ],
          insights: {
            collaborationScore,
            teamDiversityScore: Math.floor(Math.random() * 20) + 80,
            communicationScore: Math.floor(Math.random() * 15) + 85,
            recommendations: recommendations.length,
          },
        };
      } else if (createReportDto.type === 'sync') {
        // Métricas de sincronización
        const totalSyncs = syncProjects.reduce((sum, project) => sum + project.syncHistory.length, 0);
        const successfulSyncs = syncProjects.reduce((sum, project) => 
          sum + project.syncHistory.filter(h => h.status === 'success').length, 0
        );
        const failedSyncs = totalSyncs - successfulSyncs;
        const syncsByType = syncProjects.reduce((acc, project) => {
          acc[project.type] = (acc[project.type] || 0) + project.syncHistory.length;
          return acc;
        }, {} as Record<string, number>);

        metrics = {
          totalSyncs,
          successfulSyncs,
          failedSyncs,
          successRate: totalSyncs > 0 ? ((successfulSyncs / totalSyncs) * 100).toFixed(2) : 0,
          averageSyncTime: Math.floor(Math.random() * 30) + 10, // Simulado
          syncsByType,
          recentSyncs: syncProjects.reduce((sum, project) => 
            sum + project.syncHistory.filter(h => {
              const syncDate = new Date(h.date);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return syncDate > thirtyDaysAgo;
            }).length, 0
          ),
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };

        // IA Results para sincronización
        const syncScore = Math.floor(Math.random() * 30) + 70;
        const recommendations = [
          {
            type: 'performance',
            message: successfulSyncs > failedSyncs ? 'Excelente tasa de éxito en sincronizaciones' : 'Considera revisar configuraciones de sincronización',
            priority: successfulSyncs > failedSyncs ? 'low' : 'high',
          },
          {
            type: 'optimization',
            message: syncsByType['bff'] > syncsByType['sidecar'] ? 'Mayor uso de BFF detectado' : 'Considera implementar más patrones BFF',
            priority: 'medium',
          },
          {
            type: 'monitoring',
            message: 'Implementa alertas automáticas para sincronizaciones fallidas',
            priority: 'medium',
          },
        ];

        iaResults = {
          recommendations,
          alerts: [
            {
              type: 'info',
              message: `Tasa de éxito: ${((successfulSyncs / totalSyncs) * 100).toFixed(2)}% en el período seleccionado`,
              severity: 'low',
            },
          ],
          insights: {
            syncScore,
            reliabilityScore: Math.floor(Math.random() * 20) + 80,
            efficiencyScore: Math.floor(Math.random() * 15) + 85,
            recommendations: recommendations.length,
          },
        };
      } else if (createReportDto.type === 'ai') {
        // Métricas de IA
        const totalAnalyses = aiAnalyses.length;
        const optimizationsApplied = aiAnalyses.filter(a => a.analysisType === 'performance').length;
        const errorsPrevented = aiAnalyses.filter(a => a.analysisType === 'security').length;
        const recommendationsCount = aiAnalyses.filter(a => a.analysisType === 'quality').length;

        metrics = {
          totalAnalyses,
          optimizationsApplied,
          errorsPrevented,
          recommendationsCount,
          averageScore: totalAnalyses > 0 ? (aiAnalyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / totalAnalyses).toFixed(2) : 0,
          analysesByType: aiAnalyses.reduce((acc, analysis) => {
            acc[analysis.analysisType] = (acc[analysis.analysisType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          recentAnalyses: aiAnalyses.filter(a => {
            const analysisDate = new Date(a.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return analysisDate > thirtyDaysAgo;
          }).length,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };

        // IA Results para IA
        const aiScore = Math.floor(Math.random() * 30) + 70;
        const recommendations = [
          {
            type: 'optimization',
            message: optimizationsApplied > 5 ? 'Excelente uso de optimizaciones de IA' : 'Considera aplicar más optimizaciones automáticas',
            priority: optimizationsApplied > 5 ? 'low' : 'medium',
          },
          {
            type: 'security',
            message: errorsPrevented > 3 ? 'Buena detección de vulnerabilidades' : 'Considera análisis de seguridad más frecuentes',
            priority: errorsPrevented > 3 ? 'low' : 'high',
          },
          {
            type: 'learning',
            message: 'Implementa más análisis predictivos para mejorar la calidad del código',
            priority: 'medium',
          },
        ];

        iaResults = {
          recommendations,
          alerts: [
            {
              type: 'success',
              message: `${totalAnalyses} análisis de IA realizados en el período seleccionado`,
              severity: 'low',
            },
          ],
          insights: {
            aiScore,
            optimizationScore: Math.floor(Math.random() * 20) + 80,
            securityScore: Math.floor(Math.random() * 15) + 85,
            recommendations: recommendations.length,
          },
        };
      } else if (createReportDto.type === 'history') {
        // Métricas de historial
        const allVersions = userProjects.flatMap(p => p.versions);
        const totalVersions = allVersions.length;
        const versionsByStatus = allVersions.reduce((acc, version) => {
          acc[version.status] = (acc[version.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        metrics = {
          totalVersions,
          versionsByStatus,
          averageVersionsPerProject: userProjects.length > 0 ? (totalVersions / userProjects.length).toFixed(2) : 0,
          recentVersions: allVersions.filter(v => {
            const versionDate = new Date(v.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return versionDate > thirtyDaysAgo;
          }).length,
          mostActiveProject: userProjects.reduce((max, project) => 
            project.versions.length > max.versions.length ? project : max
          , userProjects[0] || { name: 'N/A', versions: [] }),
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };

        // IA Results para historial
        const historyScore = Math.floor(Math.random() * 30) + 70;
        const recommendations = [
          {
            type: 'tracking',
            message: totalVersions > 20 ? 'Excelente trazabilidad de cambios' : 'Considera versionar más frecuentemente',
            priority: totalVersions > 20 ? 'low' : 'medium',
          },
          {
            type: 'documentation',
            message: 'Implementa comentarios automáticos en cada versión',
            priority: 'medium',
          },
          {
            type: 'rollback',
            message: 'Configura puntos de restauración automáticos',
            priority: 'medium',
          },
        ];

        iaResults = {
          recommendations,
          alerts: [
            {
              type: 'info',
              message: `${totalVersions} versiones registradas en el período seleccionado`,
              severity: 'low',
            },
          ],
          insights: {
            historyScore,
            traceabilityScore: Math.floor(Math.random() * 20) + 80,
            documentationScore: Math.floor(Math.random() * 15) + 85,
            recommendations: recommendations.length,
          },
        };
      } else {
        // Reporte general
        const totalProjects = userProjects.length;
        const totalCollaborators = userProjects.reduce(
          (sum, project) => sum + project.collaborators.length,
          0,
        );
        const projectsByPattern = userProjects.reduce((acc, project) => {
          acc[project.pattern] = (acc[project.pattern] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        metrics = {
          totalProjects,
          totalCollaborators,
          projectsByPattern,
          totalSyncs: syncProjects.reduce((sum, project) => sum + project.syncHistory.length, 0),
          totalAnalyses: aiAnalyses.length,
          totalVersions: userProjects.reduce((sum, project) => sum + project.versions.length, 0),
          userActivity: {
            projectsCreated: userProjects.filter(p => p.ownerId === req.user.userId).length,
            collaborations: userProjects.filter(p => p.ownerId !== req.user.userId).length,
          },
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };

        iaResults = {
          recommendations: [
            {
              type: 'general',
              message: 'Mantén un buen balance entre proyectos propios y colaboraciones',
              priority: 'medium',
            },
          ],
          alerts: [
            {
              type: 'info',
              message: 'Reporte general generado exitosamente para el período seleccionado',
              severity: 'low',
            },
          ],
          insights: {
            overallScore: Math.floor(Math.random() * 30) + 70,
            recommendations: 1,
          },
        };
      }

      const report = await this.prisma.report.create({
        data: {
          userId: req.user.userId,
          type: createReportDto.type,
          title: createReportDto.title,
          description: createReportDto.description || '',
          metrics: JSON.stringify(metrics),
          iaResults: JSON.stringify(iaResults),
          dateRange: JSON.stringify(createReportDto.dateRange || {}),
          fileUrl: null,
        },
      });

      return report;
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error('Error al crear el reporte');
    }
  }

  @Post('download')
  async downloadReport(
    @Body() body: { reportId: number; format: string },
    @Res() res: Response,
  ) {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: body.reportId },
      });

      if (!report) {
        return res
          .status(404)
          .json({ success: false, message: 'Reporte no encontrado' });
      }

      if (body.format === 'pdf') {
        try {
          const PDFDocument = require('pdfkit');
          const doc = new PDFDocument();

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="reporte_${report.id}.pdf"`,
          );

          // Agregar contenido al PDF
          doc
            .fontSize(20)
            .text(`Reporte: ${report.title}`, { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Tipo: ${report.type}`);
          doc.text(`Fecha: ${new Date(report.createdAt).toLocaleString()}`);
          doc.moveDown();
          doc.text('---');
          doc.moveDown();

          // Métricas
          doc.fontSize(14).text('Métricas del Sistema:');
          doc.moveDown();
          const metrics = JSON.parse(report.metrics);
          doc.fontSize(10).text(JSON.stringify(metrics, null, 2));
          doc.moveDown();

          // Resultados IA
          doc.fontSize(14).text('Análisis de IA:');
          doc.moveDown();
          const iaResults = JSON.parse(report.iaResults);
          doc.fontSize(10).text(JSON.stringify(iaResults, null, 2));

          doc.pipe(res);
          doc.end();
        } catch (pdfError) {
          return res.status(500).json({
            success: false,
            message: 'Error generando PDF',
          });
        }
      } else {
        // CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="reporte_${report.id}.csv"`,
        );

        const csvContent = `titulo,tipo,fecha,descripcion\n"${report.title}","${report.type}","${new Date(report.createdAt).toLocaleString()}","${report.description || ''}"`;
        res.send(csvContent);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error en la descarga',
      });
    }
  }

  @Delete(':id')
  async deleteReport(@Param('id') id: string, @Req() req: AuthRequest) {
    const report = await this.prisma.report.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId,
      },
    });

    if (!report) {
      throw new Error('Reporte no encontrado');
    }

    return this.prisma.report.delete({
      where: { id: parseInt(id) },
    });
  }
}
