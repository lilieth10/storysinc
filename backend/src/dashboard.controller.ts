import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from './prisma.service';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { userId: number; email: string };
}

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('metrics')
  async getMetrics(@Req() req: AuthRequest) {
    try {
      // Obtener datos reales del usuario y sus proyectos
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
        },
        include: {
          collaborators: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          versions: true,
          aiAnalyses: true,
        },
      });

      // Obtener datos de sincronización
      const syncProjects = await this.prisma.syncProject.findMany({
        where: { userId: req.user.userId },
        include: {
          syncHistory: true,
        },
      });

      // Calcular métricas de proyectos
      const totalProjects = userProjects.length;
      const activeProjects = userProjects.filter(p => p.status === 'active').length;
      const projectsByPattern = userProjects.reduce((acc, project) => {
        acc[project.pattern] = (acc[project.pattern] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const projectsByLanguage = userProjects.reduce((acc, project) => {
        acc[project.language] = (acc[project.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calcular métricas de colaboración
      const allCollaborators = userProjects.flatMap(p => p.collaborators);
      const uniqueCollaborators = new Set(allCollaborators.map(c => c.user.id));
      const totalCollaborations = allCollaborators.length;
      const collaboratorsByRole = allCollaborators.reduce((acc, colab) => {
        acc[colab.role] = (acc[colab.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calcular métricas de sincronización
      const totalSyncs = syncProjects.reduce((sum, project) => sum + project.syncHistory.length, 0);
      const successfulSyncs = syncProjects.reduce((sum, project) => 
        sum + project.syncHistory.filter(h => h.status === 'success').length, 0
      );
      const syncsByType = syncProjects.reduce((acc, project) => {
        acc[project.type] = (acc[project.type] || 0) + project.syncHistory.length;
        return acc;
      }, {} as Record<string, number>);

      // Calcular métricas de IA
      const allAnalyses = userProjects.flatMap(p => p.aiAnalyses);
      const totalAnalyses = allAnalyses.length;
      const optimizationsApplied = allAnalyses.filter(a => a.analysisType === 'performance').length;
      const analysesByType = allAnalyses.reduce((acc, analysis) => {
        acc[analysis.analysisType] = (acc[analysis.analysisType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        projects: {
          total: totalProjects,
          active: activeProjects,
          byPattern: projectsByPattern,
          byLanguage: projectsByLanguage,
        },
        collaboration: {
          totalCollaborators: uniqueCollaborators.size,
          totalCollaborations: totalCollaborations,
          byRole: collaboratorsByRole,
        },
        sync: {
          totalSyncs: totalSyncs,
          successfulSyncs: successfulSyncs,
          byType: syncsByType,
        },
        ai: {
          totalAnalyses: totalAnalyses,
          optimizationsApplied: optimizationsApplied,
          byType: analysesByType,
        },
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        projects: {
          total: 0,
          active: 0,
          byPattern: {},
          byLanguage: {},
        },
        collaboration: {
          totalCollaborators: 0,
          totalCollaborations: 0,
          byRole: {},
        },
        sync: {
          totalSyncs: 0,
          successfulSyncs: 0,
          byType: {},
        },
        ai: {
          totalAnalyses: 0,
          optimizationsApplied: 0,
          byType: {},
        },
      };
    }
  }
}
